/**
 * Message-key resolution seam (IB3). Keys resolve to plain text from a typed English default catalogue plus
 * optional per-locale overrides; `{name}` placeholders are replaced with the parameter's string value. Results are
 * plain text and are never interpreted as HTML by the seam. Plurals use `Intl.PluralRules`: an override or default
 * may supply `key#one`, `key#few`, … forms, with the bare key as the `other` form.
 */

export type PaepMessageParams = Readonly<Record<string, string | number>>;

export type PaepMessageCatalogue = Readonly<Record<string, string>>;

export interface PaepMessageResolver {
  /** The locale tag the resolver formats plural categories for. */
  readonly locale: string;
  resolve(key: string, params?: PaepMessageParams): string;
  has(key: string): boolean;
}

const PLACEHOLDER = /\{([A-Za-z][\w]*)\}/g;

/** Replaces `{name}` with the parameter; unknown placeholders stay visible so a missing parameter is noticed. */
export function formatMessage(template: string, params: PaepMessageParams = {}): string {
  return template.replace(PLACEHOLDER, (whole, name: string) => (Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : whole));
}

/**
 * Creates a resolver. Overrides win over defaults key by key; an override value that is not a string is ignored. An
 * unknown key resolves to the key itself, so missing copy is visible rather than silent.
 */
export function createMessageResolver(locale: string, defaults: PaepMessageCatalogue, overrides: PaepMessageCatalogue = {}): PaepMessageResolver {
  const table = new Map<string, string>();
  for (const source of [defaults, overrides]) {
    for (const [k, v] of Object.entries(source)) if (typeof v === 'string') table.set(k, v);
  }
  let rules: Intl.PluralRules | null = null;
  try {
    rules = new Intl.PluralRules(locale);
  } catch {
    rules = null;
  }
  const lookup = (key: string, params?: PaepMessageParams): string | undefined => {
    const count = params?.['count'];
    if (typeof count === 'number' && rules) {
      const form = table.get(`${key}#${rules.select(count)}`);
      if (form !== undefined) return form;
    }
    return table.get(key);
  };
  return Object.freeze({
    locale,
    resolve: (key: string, params?: PaepMessageParams) => formatMessage(lookup(key, params) ?? key, params),
    has: (key: string) => table.has(key),
  });
}
