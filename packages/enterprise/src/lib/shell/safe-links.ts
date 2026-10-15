import { PaepShellHelpLink } from '../ports/ports';

/** C0 control characters, DEL and white space: never part of a route or link the shell renders. */
const CONTROL_OR_SPACE = /[\u0000- \u007f]/;

/**
 * An internal application route: one leading slash; no scheme, protocol-relative address, backslash, control
 * character or white space. Navigation safety only: the app's routes and guards still decide what may be shown.
 */
export function isInternalRoute(route: unknown): route is string {
  return typeof route === 'string' && route.startsWith('/') && !route.startsWith('//') && !route.includes('\\') && !CONTROL_OR_SPACE.test(route);
}

/** An absolute `https:` address (the only external scheme a shell help link may use). */
export function isExternalHelpHref(href: string | undefined): boolean {
  if (typeof href !== 'string' || CONTROL_OR_SPACE.test(href) || href.includes('\\')) return false;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}

/**
 * Help links the shell may render: a `run` request, an internal route, or an absolute `https:` address. Any other
 * `href` (other schemes, protocol-relative or relative addresses) drops the link. Angular's URL sanitisation still
 * applies to every rendered `href`; links open in the current browsing context (no `target`).
 */
export function safeHelpLinks(links: readonly PaepShellHelpLink[] | undefined): readonly PaepShellHelpLink[] {
  return (links ?? []).filter((l) => (l.href === undefined ? typeof l.run === 'function' : isInternalRoute(l.href) || isExternalHelpHref(l.href)));
}
