/**
 * Approved redirect to the server-hosted Frappe login (D6, ADR-011 §2.6): the backend origin plus a fixed path, with
 * an application-relative return path only. PAEP has no login route, screen or dialog of its own.
 */
export type Navigate = (url: string) => void;

const LOGIN_PATH = '/login';

/** The browser navigation the application uses; replaced by a recorder in tests. */
export const browserNavigate: Navigate = (url) => { globalThis.location.assign(url); };

/** An application-relative path: one leading slash, no scheme, host, backslash, whitespace, control character or dot segment. */
export function safeReturnPath(value: string): boolean {
  if (value.length === 0 || value.length > 512 || !value.startsWith('/') || value.startsWith('//')) return false;
  if (/[\\\s\u0000-\u001f\u007f]/.test(value) || /^\/[^/?#]*:/.test(value)) return false;
  let decoded: string;
  try { decoded = decodeURIComponent(value); } catch { return false; }
  return !decoded.startsWith('//') && !/[\\\u0000-\u001f\u007f]/.test(decoded) && !/(^|\/)\.\.?(\/|$|[?#])/.test(decoded.split(/[?#]/)[0] ?? '');
}

/** The login URL on the backend origin for an already validated return path. */
export function serverLoginUrl(origin: string, returnPath: string): string {
  const url = new URL(LOGIN_PATH, origin);
  url.searchParams.set('redirect-to', returnPath);
  return url.href;
}
