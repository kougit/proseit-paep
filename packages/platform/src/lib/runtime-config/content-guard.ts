import type { RuntimeConfigErrorCode, RuntimeConfigIssue } from '@proseit/paep-contracts';
import { pointerSegment, type JsonValue } from './strict-json.js';

/*
 * Content guard (PAEP-IR-01 §5.5(i); PAEP-IB-01 §9.1, §11.1(iv)). Runs on every key and string before the schema, so a secret,
 * credential, database locator, markup/script value or unsafe character is rejected whatever key it hides under.
 * It is a second layer: the closed schema is the primary control. Findings name the parent pointer for keys, never the key or value.
 */

/** Key-name tokens that indicate a secret, credential or direct data-store access; runtime configuration may never carry them. */
const SECRET_KEY_TOKENS: readonly string[] = [
  'password', 'passwd', 'pwd', 'passphrase', 'secret', 'secrets', 'privatekey', 'apikey', 'accesskey', 'secretkey', 'token', 'tokens',
  'accesstoken', 'refreshtoken', 'idtoken', 'bearer', 'credential', 'credentials', 'connectionstring', 'connstr', 'dsn', 'cookie',
  'sessionid', 'sessionkey', 'authorization', 'hmac', 'salt', 'signingkey', 'sas', 'jwk', 'pem', 'certificate', 'cert', 'keystore'
];
const DATA_ACCESS_KEY_TOKENS: readonly string[] = [
  'database', 'databases', 'db', 'dbhost', 'dbuser', 'dbname', 'dbpassword', 'dburl', 'jdbc', 'odbc', 'sql', 'warehouse', 'datawarehouse',
  'lakehouse', 'analyticalstore', 'analyticsstore', 'datastore', 'erpdb', 'mariadb', 'mysql', 'postgres', 'postgresql', 'mongodb', 'redis', 'clickhouse'
];

/** Split a key into lower-case tokens (camelCase, snake_case, kebab-case, dotted) and also return the whole lower-cased key. */
function keyTokens(key: string): string[] {
  const parts = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^A-Za-z0-9]+/).filter(Boolean).map((t) => t.toLowerCase());
  const joined = key.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  const out = [...parts, joined];
  for (let i = 0; i + 1 < parts.length; i += 1) out.push(`${parts[i]}${parts[i + 1]}`);
  return out;
}

// C0/C1 controls, bidi controls, zero-width and invisible characters, line/paragraph separators, BOM, noncharacters, private use.
const UNSAFE_CHAR = /[\u0000-\u001F\u007F-\u009F\u00AD\u061C\u115F\u1160\u180E\u200B-\u200F\u2028-\u202E\u2060-\u206F\u3164\uFEFF\uFFA0\uFDD0-\uFDEF\uFFFE\uFFFF\uE000-\uF8FF]/u;
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const SUPPLEMENTARY_UNSAFE = /[\u{E0000}-\u{E007F}\u{F0000}-\u{10FFFF}]|[\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}]/u;

/** Script-like or markup-like values: never valid in runtime configuration (no config-driven markup). */
const MARKUP = [/[<>]/, /(?:java|vb)script\s*:/i, /\bdata\s*:[^,]*[;,]/i, /\bon[a-z]+\s*=/i, /\{\{|\}\}|\$\{/, /\bexpression\s*\(/i];

/** Secret-shaped values (PEM, JWT, bearer/basic credentials, cloud and platform keys, credential query parameters, URL userinfo). */
const SECRET_VALUES = [
  /-----BEGIN [A-Z0-9 ]+-----/,
  /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/,
  /\b(?:bearer|basic)\s+[A-Za-z0-9._~+/=-]{8,}/i,
  /\b(?:AKIA|ASIA|AGPA|AIDA|AROA)[A-Z0-9]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /\bxox[abprs]-[A-Za-z0-9-]{8,}/,
  /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{8,}/,
  /\bAIza[0-9A-Za-z_-]{30,}/,
  /\bnpm_[A-Za-z0-9]{30,}/,
  /(?:^|[?&#;\s])\s*(?:access_token|id_token|refresh_token|token|api_key|apikey|client_secret|password|pwd|secret|sig|signature|x-amz-signature|x-goog-signature|accountkey|sharedaccesskey)\s*=/i,
  /\b[a-z][a-z0-9+.-]*:\/\/[^/?#\s]*@/i
];

/** Direct database, ERP-database or analytical-store locators: the browser never receives them (PAEP-IR-01 §5.4). */
const DATA_ACCESS_VALUES = [
  /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|rediss?|amqps?|mssql|sqlserver|oracle|clickhouse|cassandra|snowflake|bigquery|redshift|couchdb|neo4j|ldaps?|sftp|ftp|ssh|s3|gs|hdfs|sqlite|db2|trino|presto|elasticsearch|jdbc:[a-z0-9]+|odbc):/i,
  /\b(?:server|data source|host|user id|uid|initial catalog)\s*=[^;]*;/i
];

function textProblem(s: string): RuntimeConfigErrorCode | null {
  if (UNSAFE_CHAR.test(s) || LONE_SURROGATE.test(s) || SUPPLEMENTARY_UNSAFE.test(s)) return 'CFG_CONTENT_TEXT';
  return null;
}

/** Walk the parsed document and return content findings in document order. */
export function guardContent(value: JsonValue): RuntimeConfigIssue[] {
  const out: RuntimeConfigIssue[] = [];
  const add = (code: RuntimeConfigErrorCode, path: string): void => { out.push({ stage: 'content', code, path }); };
  const visit = (v: JsonValue, path: string): void => {
    if (typeof v === 'string') {
      const t = textProblem(v);
      if (t) { add(t, path); return; }
      if (MARKUP.some((re) => re.test(v))) add('CFG_CONTENT_MARKUP', path);
      if (SECRET_VALUES.some((re) => re.test(v))) add('CFG_CONTENT_SECRET', path);
      if (DATA_ACCESS_VALUES.some((re) => re.test(v))) add('CFG_CONTENT_DATA_ACCESS', path);
      return;
    }
    if (Array.isArray(v)) { v.forEach((item, i) => visit(item, `${path}/${i}`)); return; }
    if (v === null || typeof v !== 'object') return;
    for (const key of Object.keys(v)) {
      if (textProblem(key)) { add('CFG_CONTENT_TEXT', path); continue; }
      if (key.startsWith('$') || key.includes('@')) { add('CFG_CONTENT_KEY', path); continue; }
      const tokens = keyTokens(key);
      if (tokens.some((t) => SECRET_KEY_TOKENS.includes(t))) { add('CFG_CONTENT_SECRET', path); continue; }
      if (tokens.some((t) => DATA_ACCESS_KEY_TOKENS.includes(t))) { add('CFG_CONTENT_DATA_ACCESS', path); continue; }
      if (SECRET_VALUES.some((re) => re.test(key))) { add('CFG_CONTENT_SECRET', path); continue; }
      visit(v[key] as JsonValue, `${path}/${pointerSegment(key)}`);
    }
  };
  visit(value, '');
  return out;
}
