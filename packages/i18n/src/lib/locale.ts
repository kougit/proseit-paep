/**
 * Locale and direction seam (IB3, HOF-IB3-001 accessibility-intent §6). Framework-neutral. It validates locale tags,
 * resolves the text direction and applies `lang` / `dir` to a root element. It is not a translation system: no
 * dictionary loading and no date or number formatting.
 */

export type PaepTextDirection = 'ltr' | 'rtl';

export interface PaepLocale {
  /** A validated BCP 47 tag, for example "en", "ar" or "pt-BR". */
  readonly tag: string;
  readonly direction: PaepTextDirection;
}

/** Languages written right to left (the language subtag of a validated tag). */
const RTL_LANGUAGES = new Set(['ar', 'arc', 'ckb', 'dv', 'fa', 'he', 'iw', 'ks', 'ku', 'ps', 'sd', 'syr', 'ug', 'ur', 'yi']);

/** A conservative BCP 47 shape: language, optional script, region and variants, ASCII only, at most 35 characters. */
const TAG = /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|\d{3}))?(?:-(?:[a-z\d]{5,8}|\d[a-z\d]{3}))*$/;

/** Returns the canonical-case tag when `value` is a safe locale tag, otherwise null (never throws). */
export function validateLocaleTag(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 35) return null;
  const parts = value.replace(/_/g, '-').split('-');
  const canon = parts
    .map((p, i) => (i === 0 ? p.toLowerCase() : p.length === 4 && /^[a-z]+$/i.test(p) ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p.length === 2 && /^[a-z]+$/i.test(p) ? p.toUpperCase() : p.toLowerCase()))
    .join('-');
  return TAG.test(canon) ? canon : null;
}

/**
 * Resolves a locale. `rtlLocales` (runtime configuration `localisation.rtlLocales`) takes precedence over the built-in
 * language list; an invalid tag resolves to null so the caller keeps its current or default locale.
 */
export function resolveLocale(value: unknown, rtlLocales: readonly string[] = []): PaepLocale | null {
  const tag = validateLocaleTag(value);
  if (!tag) return null;
  const language = tag.split('-')[0];
  const listed = rtlLocales.map((t) => validateLocaleTag(t)).filter((t): t is string => t !== null);
  const rtl = listed.length > 0 ? listed.some((t) => t === tag || t === language) : RTL_LANGUAGES.has(language);
  return Object.freeze({ tag, direction: rtl ? 'rtl' : 'ltr' });
}

/** The root element attributes the seam writes. Typed structurally so this package needs no DOM library. */
export interface PaepLocaleRoot {
  setAttribute(name: 'lang' | 'dir', value: string): void;
}

/** Applies `lang` and `dir` to the root element (normally `document.documentElement`). */
export function applyLocale(root: PaepLocaleRoot, locale: PaepLocale): void {
  root.setAttribute('lang', locale.tag);
  root.setAttribute('dir', locale.direction);
}
