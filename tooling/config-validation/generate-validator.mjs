#!/usr/bin/env node
// PAEP IB1: generate the standalone runtime-configuration schema validator (PAEP-IB-01 §9.2(ii)).
//
// Reads config/runtime-config.schema.json and writes
// packages/platform/src/lib/runtime-config/generated/runtime-config-schema.validator.ts: plain TypeScript,
// no dependency, no dynamic schema compilation, no eval. The generator accepts only a closed subset of
// JSON Schema 2020-12 and refuses (exit 1) any keyword or shape it does not implement, so the generated
// validator can never silently ignore a constraint (for example "format", which 2020-12 treats as an
// annotation only).
//
//   node tooling/config-validation/generate-validator.mjs          write the validator
//   node tooling/config-validation/generate-validator.mjs --check  exit 1 if the committed file is stale
//   node tooling/config-validation/generate-validator.mjs --schema <file> --out <file>   (tests)
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const opt = (name, fallback) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : fallback; };
const schemaFile = path.resolve(root, opt('--schema', 'config/runtime-config.schema.json'));
const outFile = path.resolve(root, opt('--out', 'packages/platform/src/lib/runtime-config/generated/runtime-config-schema.validator.ts'));
const check = argv.includes('--check');

export const SUPPORTED_KEYWORDS = Object.freeze([
  '$schema', '$id', 'title', 'description', '$comment', '$defs', '$ref', 'type', 'const', 'enum', 'properties', 'required',
  'additionalProperties', 'propertyNames', 'minProperties', 'maxProperties', 'items', 'minItems', 'maxItems', 'uniqueItems',
  'pattern', 'minLength', 'maxLength', 'minimum', 'maximum'
]);
const ROOT_ONLY = new Set(['$schema', '$id', '$defs']);
const ANNOTATIONS = new Set(['title', 'description', '$comment']);
const TYPES = new Set(['object', 'array', 'string', 'number', 'integer', 'boolean', 'null']);
const DRAFT = 'https://json-schema.org/draft/2020-12/schema';

class SchemaSubsetError extends Error {}
const fail = (at, msg) => { throw new SchemaSubsetError(`${at || '#'}: ${msg}`); };
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isPrimitive = (v) => v === null || ['string', 'number', 'boolean'].includes(typeof v);
const nonNegInt = (v) => Number.isSafeInteger(v) && v >= 0;

// Validate one schema node against the supported subset (fail closed).
function checkNode(node, at, defs, isRoot = false) {
  if (!isPlain(node)) fail(at, 'schema node is not an object');
  for (const k of Object.keys(node)) {
    if (!SUPPORTED_KEYWORDS.includes(k)) fail(at, `unsupported keyword "${k}"`);
    if (ROOT_ONLY.has(k) && !isRoot) fail(at, `"${k}" is allowed only at the root`);
  }
  if (isRoot) {
    if (node.$schema !== DRAFT) fail(at, `$schema must be ${DRAFT}`);
    if (typeof node.$id !== 'string' || !/^https:\/\/[^\s]+\/schema\.json$/.test(node.$id)) fail(at, '$id must be an https URL ending in /schema.json');
  }
  for (const k of ANNOTATIONS) if (k in node && typeof node[k] !== 'string') fail(at, `${k} must be a string`);
  const constraintKeys = Object.keys(node).filter((k) => !ANNOTATIONS.has(k) && !ROOT_ONLY.has(k));
  if ('$ref' in node) {
    if (constraintKeys.length !== 1) fail(at, '$ref must stand alone');
    const m = /^#\/\$defs\/([A-Za-z][A-Za-z0-9]*)$/.exec(node.$ref);
    if (!m) fail(at, 'only local #/$defs/<name> references are supported');
    if (!defs.has(m[1])) fail(at, `unknown $ref ${node.$ref}`);
    return;
  }
  const types = node.type === undefined ? [] : Array.isArray(node.type) ? node.type : [node.type];
  if (!types.every((t) => TYPES.has(t)) || new Set(types).size !== types.length || (Array.isArray(node.type) && types.length < 2)) fail(at, 'type must be one type name or an array of 2+ distinct type names');
  if (!types.length && !('enum' in node) && !('const' in node)) fail(at, 'node must declare type, enum or const');
  if ('const' in node && !isPrimitive(node.const)) fail(at, 'const must be a primitive');
  if ('enum' in node && (!Array.isArray(node.enum) || !node.enum.length || !node.enum.every(isPrimitive) || new Set(node.enum).size !== node.enum.length)) fail(at, 'enum must be a non-empty list of distinct primitives');
  const has = (t) => types.includes(t);
  const need = (keys, t) => { for (const k of keys) if (k in node && !t.some(has)) fail(at, `"${k}" needs type ${t.join(' or ')}`); };
  need(['minLength', 'maxLength', 'pattern'], ['string']);
  need(['minimum', 'maximum'], ['number', 'integer']);
  need(['items', 'minItems', 'maxItems', 'uniqueItems'], ['array']);
  need(['properties', 'required', 'additionalProperties', 'propertyNames', 'minProperties', 'maxProperties'], ['object']);
  for (const k of ['minLength', 'maxLength', 'minItems', 'maxItems', 'minProperties', 'maxProperties']) if (k in node && !nonNegInt(node[k])) fail(at, `${k} must be a non-negative integer`);
  for (const k of ['minimum', 'maximum']) if (k in node && !Number.isFinite(node[k])) fail(at, `${k} must be a finite number`);
  if ('uniqueItems' in node && node.uniqueItems !== true) fail(at, 'uniqueItems must be true when present');
  if ('pattern' in node) {
    if (typeof node.pattern !== 'string' || !node.pattern.startsWith('^') || !node.pattern.endsWith('$')) fail(at, 'pattern must be an anchored ^...$ string');
    try { new RegExp(node.pattern, 'u'); } catch (e) { fail(at, `pattern does not compile with the u flag: ${e.message}`); }
  }
  if (has('array')) {
    if (!('items' in node)) fail(at, 'array node must declare items');
    checkNode(node.items, `${at}/items`, defs);
  }
  if (has('object')) {
    if (!('additionalProperties' in node)) fail(at, 'object node must declare additionalProperties explicitly');
    const props = node.properties ?? {};
    if (!isPlain(props)) fail(at, 'properties must be an object');
    for (const [k, v] of Object.entries(props)) {
      if (!/^[A-Za-z][A-Za-z0-9]*$/.test(k)) fail(at, `property name "${k}" is not a plain identifier`);
      checkNode(v, `${at}/properties/${k}`, defs);
    }
    if ('required' in node && (!Array.isArray(node.required) || new Set(node.required).size !== node.required.length || !node.required.every((r) => Object.hasOwn(props, r)))) fail(at, 'required must list distinct declared properties');
    if (node.additionalProperties === false) {
      if ('propertyNames' in node) fail(at, 'propertyNames is only supported with a schema-valued additionalProperties');
    } else if (isPlain(node.additionalProperties)) {
      if (!isPlain(node.propertyNames)) fail(at, 'a schema-valued additionalProperties requires propertyNames');
      for (const k of Object.keys(node.propertyNames)) if (!['pattern', 'minLength', 'maxLength'].includes(k)) fail(at, `propertyNames supports only pattern/minLength/maxLength, not "${k}"`);
      if (typeof node.propertyNames.pattern !== 'string') fail(at, 'propertyNames must declare a pattern');
      checkNode({ type: 'string', ...node.propertyNames }, `${at}/propertyNames`, defs);
      checkNode(node.additionalProperties, `${at}/additionalProperties`, defs);
    } else fail(at, 'additionalProperties must be false or a schema');
  }
}

function checkSchema(schema) {
  if (!isPlain(schema)) fail('#', 'schema root is not an object');
  const defs = new Map(Object.entries(schema.$defs ?? {}));
  if ('$defs' in schema && !isPlain(schema.$defs)) fail('#', '$defs must be an object');
  // A definition may reference only definitions declared before it, which rules out recursion and cycles.
  const earlier = new Map();
  for (const [name, d] of defs) {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) fail('#/$defs', `definition name "${name}" is not a plain identifier`);
    checkNode(d, `#/$defs/${name}`, earlier);
    earlier.set(name, d);
  }
  checkNode(schema, '#', defs, true);
  if (!schema.type || schema.type !== 'object') fail('#', 'root must be type object');
}

// ---- code generation ------------------------------------------------------------------
function generate(schema, schemaText) {
  const sha = crypto.createHash('sha256').update(schemaText).digest('hex');
  const patterns = new Map();
  const patternConst = (p) => { if (!patterns.has(p)) patterns.set(p, `P${patterns.size}`); return patterns.get(p); };
  const fns = [];
  let counter = 0;
  const defFn = (name) => `v_def_${name}`;

  const compile = (node, name) => {
    const body = [];
    if (node.$ref) { fns.push(`function ${name}(x: unknown, p: string, out: SchemaIssue[]): void {\n  ${defFn(node.$ref.slice(8))}(x, p, out);\n}`); return name; }
    const types = node.type === undefined ? [] : Array.isArray(node.type) ? node.type : [node.type];
    if (types.length) {
      const cond = types.map((t) => ({ object: 'isObject(x)', array: 'Array.isArray(x)', string: "typeof x === 'string'", number: "typeof x === 'number' && Number.isFinite(x)", integer: 'Number.isSafeInteger(x)', boolean: "typeof x === 'boolean'", null: 'x === null' }[t])).join(' || ');
      body.push(`if (!(${cond})) { out.push({ code: 'CFG_SCHEMA_TYPE', path: p }); return; }`);
    }
    if ('const' in node) body.push(`if (x !== ${JSON.stringify(node.const)}) { out.push({ code: 'CFG_SCHEMA_CONST', path: p }); return; }`);
    if ('enum' in node) body.push(`if (!(${node.enum.map((e) => `x === ${JSON.stringify(e)}`).join(' || ')})) { out.push({ code: 'CFG_SCHEMA_ENUM', path: p }); return; }`);
    if (types.includes('string')) {
      const s = [];
      if ('minLength' in node || 'maxLength' in node) {
        const c = [];
        if ('minLength' in node) c.push(`n < ${node.minLength}`);
        if ('maxLength' in node) c.push(`n > ${node.maxLength}`);
        s.push(`const n = codePoints(x);`, `if (${c.join(' || ')}) out.push({ code: 'CFG_SCHEMA_LENGTH', path: p });`);
      }
      if (node.pattern) s.push(`if (!${patternConst(node.pattern)}.test(x)) out.push({ code: 'CFG_SCHEMA_PATTERN', path: p });`);
      if (s.length) body.push(`if (typeof x === 'string') {\n    ${s.join('\n    ')}\n  }`);
    }
    if (types.includes('number') || types.includes('integer')) {
      const c = [];
      if ('minimum' in node) c.push(`x < ${node.minimum}`);
      if ('maximum' in node) c.push(`x > ${node.maximum}`);
      if (c.length) body.push(`if (typeof x === 'number' && (${c.join(' || ')})) out.push({ code: 'CFG_SCHEMA_RANGE', path: p });`);
    }
    if (types.includes('array')) {
      const itemFn = compile(node.items, `v_${++counter}`);
      const a = [];
      const c = [];
      if ('minItems' in node) c.push(`x.length < ${node.minItems}`);
      if ('maxItems' in node) c.push(`x.length > ${node.maxItems}`);
      if (c.length) a.push(`if (${c.join(' || ')}) out.push({ code: 'CFG_SCHEMA_ITEMS', path: p });`);
      if (node.uniqueItems) a.push(`const dup = firstDuplicate(x);`, `if (dup >= 0) out.push({ code: 'CFG_SCHEMA_UNIQUE', path: \`\${p}/\${dup}\` });`);
      a.push(`x.forEach((item, i) => ${itemFn}(item, \`\${p}/\${i}\`, out));`);
      body.push(`if (Array.isArray(x)) {\n    ${a.join('\n    ')}\n  }`);
    }
    if (types.includes('object')) {
      const props = node.properties ?? {};
      const o = [];
      const c = [];
      if ('minProperties' in node) c.push(`keys.length < ${node.minProperties}`);
      if ('maxProperties' in node) c.push(`keys.length > ${node.maxProperties}`);
      o.push('const keys = Object.keys(x);');
      if (c.length) o.push(`if (${c.join(' || ')}) out.push({ code: 'CFG_SCHEMA_PROPERTIES', path: p });`);
      for (const r of node.required ?? []) o.push(`if (!Object.hasOwn(x, ${JSON.stringify(r)})) out.push({ code: 'CFG_SCHEMA_REQUIRED', path: \`\${p}/${r}\` });`);
      for (const [k, v] of Object.entries(props)) {
        const f = compile(v, `v_${++counter}`);
        o.push(`if (Object.hasOwn(x, ${JSON.stringify(k)})) ${f}(x[${JSON.stringify(k)}], \`\${p}/${k}\`, out);`);
      }
      const known = JSON.stringify(Object.keys(props));
      if (node.additionalProperties === false) {
        o.push(`if (keys.some((k) => !(${known} as readonly string[]).includes(k))) out.push({ code: 'CFG_SCHEMA_ADDITIONAL', path: p });`);
      } else {
        const nameNode = { type: 'string', ...node.propertyNames };
        const nameFn = compile(nameNode, `v_${++counter}`);
        const valFn = compile(node.additionalProperties, `v_${++counter}`);
        o.push(`for (const k of keys) {`,
          `  if ((${known} as readonly string[]).includes(k)) continue;`,
          `  const names: SchemaIssue[] = [];`,
          `  ${nameFn}(k, p, names);`,
          `  if (names.length) { out.push({ code: 'CFG_SCHEMA_PROPERTY_NAME', path: p }); continue; }`,
          `  ${valFn}(x[k], \`\${p}/\${k}\`, out);`,
          `}`);
      }
      body.push(`if (isObject(x)) {\n    ${o.join('\n    ')}\n  }`);
    }
    fns.push(`function ${name}(x: unknown, p: string, out: SchemaIssue[]): void {\n  ${body.join('\n  ') || '// no constraint'}\n}`);
    return name;
  };

  for (const [n, d] of Object.entries(schema.$defs ?? {})) compile(d, defFn(n));
  const rootFn = compile(schema, 'v_root');
  const patternLines = [...patterns].map(([p, n]) => `const ${n} = new RegExp(${JSON.stringify(p)}, 'u');`);
  return `// GENERATED FILE - DO NOT EDIT.
// Generated by tooling/config-validation/generate-validator.mjs from config/runtime-config.schema.json (PAEP-IB-01 §9.2(ii)).
// Regenerate with: node tooling/config-validation/generate-validator.mjs   (CI fails if this file is stale).

/** SHA-256 of the schema file this validator was generated from. */
export const RUNTIME_CONFIG_SCHEMA_SHA256 = '${sha}';

/** Schema $id this validator implements. */
export const RUNTIME_CONFIG_SCHEMA_ID = ${JSON.stringify(schema.$id)};

export type SchemaIssueCode = 'CFG_SCHEMA_REQUIRED' | 'CFG_SCHEMA_ADDITIONAL' | 'CFG_SCHEMA_TYPE' | 'CFG_SCHEMA_CONST' | 'CFG_SCHEMA_ENUM' | 'CFG_SCHEMA_PATTERN'
  | 'CFG_SCHEMA_LENGTH' | 'CFG_SCHEMA_RANGE' | 'CFG_SCHEMA_ITEMS' | 'CFG_SCHEMA_UNIQUE' | 'CFG_SCHEMA_PROPERTIES' | 'CFG_SCHEMA_PROPERTY_NAME';

/** One schema finding: code and RFC 6901 pointer. Unknown keys are reported at their parent, so no key or value is echoed. */
export interface SchemaIssue {
  readonly code: SchemaIssueCode;
  readonly path: string;
}

type JsonObject = Record<string, unknown>;

${patternLines.join('\n')}

function isObject(x: unknown): x is JsonObject {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function codePoints(s: string): number {
  let n = 0;
  for (const _ of s) n += 1;
  return n;
}

function firstDuplicate(items: readonly unknown[]): number {
  const seen = new Set<string>();
  for (let i = 0; i < items.length; i += 1) {
    const v = items[i];
    const key = \`\${typeof v}:\${String(v)}\`;
    if (seen.has(key)) return i;
    seen.add(key);
  }
  return -1;
}

${fns.join('\n\n')}

/** Validate a parsed document against the runtime-configuration schema. Returns every finding in schema order; never throws. */
export function validateRuntimeConfigSchema(value: unknown): readonly SchemaIssue[] {
  const out: SchemaIssue[] = [];
  ${rootFn}(value, '', out);
  return out;
}
`;
}

export function buildValidator(schemaText) {
  let schema;
  try { schema = JSON.parse(schemaText); } catch (e) { throw new SchemaSubsetError(`schema is not JSON: ${e.message}`); }
  checkSchema(schema);
  return generate(schema, schemaText);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const text = fs.readFileSync(schemaFile, 'utf8');
    const code = buildValidator(text);
    if (check) {
      const current = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
      if (current !== code) { console.error(`STALE: ${path.relative(root, outFile)} does not match the generator output for ${path.relative(root, schemaFile)}`); process.exit(1); }
      console.log(`OK: ${path.relative(root, outFile)} is up to date (schema sha256 ${crypto.createHash('sha256').update(text).digest('hex')})`);
    } else {
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, code);
      console.log(`wrote ${path.relative(root, outFile)}`);
    }
  } catch (e) {
    console.error(e instanceof SchemaSubsetError ? `REFUSED: ${e.message}` : e);
    process.exit(1);
  }
}
