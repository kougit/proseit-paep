import type { RuntimeConfig, RuntimeConfigErrorCode, RuntimeConfigIssue } from '@proseit/paep-contracts';

/*
 * Cross-field rules the schema cannot express (PAEP-IB-01 §9.1, §9.2(iv), §11, §19.1). Runs only on a schema-valid document.
 */

/** Environment facts the loader supplies. */
export interface RuntimeConfigEnvironment {
  /** Path part of the document base URI (for example "/" or "/erp/"); deployment.basePath must equal it. Omit when validating outside a browser. */
  readonly documentBasePath?: string;
}

const URL_FIELDS: readonly (readonly [string, (c: RuntimeConfig) => string | null | undefined])[] = [
  ['/backend/apiBaseUrl', (c) => c.backend.apiBaseUrl],
  ['/backend/realtimeUrl', (c) => c.backend.realtimeUrl],
  ['/backend/fileBaseUrl', (c) => c.backend.fileBaseUrl],
  ['/identity/issuer', (c) => c.identity.issuer],
  ['/telemetry/endpoint', (c) => c.telemetry.endpoint],
  ['/analytics/reportingBaseUrl', (c) => c.analytics.reportingBaseUrl]
];

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Split an already schema-valid URL into scheme and host without the DOM URL class. */
function schemeAndHost(url: string): { readonly scheme: string; readonly host: string } | null {
  const m = /^(https?):\/\/(\[[0-9a-f:]+\]|[^/:?#]+)/i.exec(url);
  return m ? { scheme: (m[1] as string).toLowerCase(), host: (m[2] as string).toLowerCase() } : null;
}

const isIpv4 = (host: string): boolean => /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
const isPrivateIpv4 = (host: string): boolean => /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);

/** Compare two "major.minor" versions numerically. */
export function compareMajorMinor(a: string, b: string): number {
  const [am = 0, an = 0] = a.split('.').map(Number);
  const [bm = 0, bn = 0] = b.split('.').map(Number);
  return am !== bm ? am - bm : an - bn;
}

export function checkSemantics(c: RuntimeConfig, env: RuntimeConfigEnvironment, externalBiProviders: readonly string[]): RuntimeConfigIssue[] {
  const out: RuntimeConfigIssue[] = [];
  const add = (code: RuntimeConfigErrorCode, path: string): void => { out.push({ stage: 'semantic', code, path }); };
  const env0 = c.deployment.environment;

  // Endpoints: https only; plain http only for loopback in development; staging/production never point at loopback or private hosts.
  for (const [path, get] of URL_FIELDS) {
    const v = get(c);
    if (v === null || v === undefined) continue;
    const u = schemeAndHost(v);
    if (!u) { add('CFG_URL_INVALID', path); continue; }
    if (u.scheme === 'http' && !(env0 === 'development' && LOOPBACK.has(u.host))) { add('CFG_URL_INSECURE', path); continue; }
    if ((env0 === 'staging' || env0 === 'production') && (LOOPBACK.has(u.host) || u.host.endsWith('.localhost') || (isIpv4(u.host) && isPrivateIpv4(u.host)))) add('CFG_URL_HOST', path);
    if (u.host.split('.').some((label) => label.startsWith('xn--'))) add('CFG_URL_HOST', path);
  }

  // Localisation.
  const loc = c.localisation;
  if (!loc.supportedLocales.includes(loc.defaultLocale)) add('CFG_LOCALE_DEFAULT', '/localisation/defaultLocale');
  (loc.rtlLocales ?? []).forEach((l, i) => { if (!loc.supportedLocales.includes(l)) add('CFG_LOCALE_RTL', `/localisation/rtlLocales/${i}`); });

  // Identity: OIDC needs its public metadata; server-owned modes must not carry stray OIDC metadata.
  const id = c.identity;
  if (id.mode === 'oidc') {
    if (!id.issuer) add('CFG_IDENTITY_OIDC', '/identity/issuer');
    if (!id.clientId) add('CFG_IDENTITY_OIDC', '/identity/clientId');
    if (!(id.scopes ?? []).includes('openid')) add('CFG_IDENTITY_OIDC', '/identity/scopes');
  } else {
    if (id.issuer) add('CFG_IDENTITY_UNEXPECTED', '/identity/issuer');
    if (id.clientId) add('CFG_IDENTITY_UNEXPECTED', '/identity/clientId');
    if ((id.scopes ?? []).length) add('CFG_IDENTITY_UNEXPECTED', '/identity/scopes');
  }

  // Enabled integrations need their public endpoint; nothing falls back to a default endpoint.
  if (c.telemetry.enabled && !c.telemetry.endpoint) add('CFG_TELEMETRY_ENDPOINT', '/telemetry/endpoint');
  if (c.telemetry.enabled && c.telemetry.sampleRate === undefined) add('CFG_TELEMETRY_ENDPOINT', '/telemetry/sampleRate');
  if (c.analytics.enabled && !c.analytics.reportingBaseUrl) add('CFG_ANALYTICS_ENDPOINT', '/analytics/reportingBaseUrl');

  // External BI is optional and absent unless the build registers an adapter for the named provider (PAEP-IB-01 §19.1(v)).
  const bi = c.analytics.embeddedBi;
  if (bi?.enabled && (!c.analytics.enabled || !bi.provider || !externalBiProviders.includes(bi.provider))) add('CFG_EMBEDDED_BI', '/analytics/embeddedBi');

  // PWA profile consistency.
  if (c.pwa.enabled === (c.pwa.offlineProfile === 'none')) add('CFG_PWA_PROFILE', '/pwa/offlineProfile');

  // Production declares its CSP profile (PAEP-IB-01 §11.1(ii)); the Trusted Types "default" policy name is never used.
  if (env0 === 'production' && !c.security?.cspProfile) add('CFG_SECURITY_PROFILE', '/security');
  if (c.security?.trustedTypesPolicyName === 'default') add('CFG_SECURITY_PROFILE', '/security/trustedTypesPolicyName');

  // Compatibility range must be well-ordered.
  const comp = c.backend.compatibility;
  if (comp.maximumPaep && compareMajorMinor(comp.minimumPaep, comp.maximumPaep) > 0) add('CFG_PAEP_RANGE', '/backend/compatibility/maximumPaep');

  // The configuration must describe where it is actually served (PAEP-IB-01 §19.1(iii)).
  if (env.documentBasePath !== undefined && env.documentBasePath !== c.deployment.basePath) add('CFG_BASE_PATH', '/deployment/basePath');

  return out;
}
