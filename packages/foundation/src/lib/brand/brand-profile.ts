import { contrastRatio, hueDistance, isHexColor, toOklch } from '../color/color';

/** The only token keys a brand profile may set (HOF-IB2-001 token-values §1.5). */
export const PAEP_BRAND_KEYS = [
  'primary',
  'primary-hover',
  'primary-active',
  'primary-subtle',
  'on-primary',
  'accent',
  'on-accent',
] as const;

export type PaepBrandKey = (typeof PAEP_BRAND_KEYS)[number];

/** A complete brand profile: exactly the seven brand keys as #RRGGBB values. */
export type PaepBrandProfile = { readonly [K in PaepBrandKey]: string };

/** The approved ProSEIT default (Navy #24364B, Gold #D4A62A; PO/SA 2026-09-27). */
export const PAEP_DEFAULT_BRAND: PaepBrandProfile = {
  primary: '#24364B',
  'primary-hover': '#1B2A3B',
  'primary-active': '#121E2B',
  'primary-subtle': '#E7ECF2',
  'on-primary': '#FFFFFF',
  accent: '#D4A62A',
  'on-accent': '#1A1F26',
};

/** Protected reference values the brand is checked against (never overridable). */
const SURFACE = '#FFFFFF';
const SURFACE_SUBTLE = '#F7F8FA';
const BG_PAGE = '#EFF2F5';
const NEUTRAL_200 = '#D3D9E0';
const STATUS_ERROR_FG = '#B3261E';

/** One failed validation rule. */
export interface PaepBrandViolation {
  readonly rule: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  readonly message: string;
}

export interface PaepBrandValidation {
  readonly valid: boolean;
  readonly violations: readonly PaepBrandViolation[];
}

/**
 * Fail-closed brand-profile validator (token-values §1.6 rules 1-7). Anything that is not a plain object
 * with exactly the seven keys and #RRGGBB values is rejected; no rule is skipped when an earlier rule fails,
 * except that contrast rules need well-formed colours.
 */
export function validateBrandProfile(input: unknown): PaepBrandValidation {
  const v: PaepBrandViolation[] = [];
  const fail = (rule: PaepBrandViolation['rule'], message: string) => v.push({ rule, message });
  if (input === null || typeof input !== 'object' || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype) {
    fail(1, 'brand profile must be a plain object');
    return { valid: false, violations: v };
  }
  const obj = input as Record<string, unknown>;
  const allowed = new Set<string>(PAEP_BRAND_KEYS);
  for (const k of Object.keys(obj)) if (!allowed.has(k)) fail(1, `key "${k}" is not an overridable brand key`);
  for (const k of PAEP_BRAND_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) fail(1, `key "${k}" is missing`);
    else if (!isHexColor(obj[k])) fail(1, `key "${k}" must be a #RRGGBB colour`);
  }
  if (v.length) return { valid: false, violations: v };
  const p = obj as PaepBrandProfile;
  const need = (rule: PaepBrandViolation['rule'], fg: PaepBrandKey | string, bg: PaepBrandKey | string, min: number, label: string) => {
    const a = (p as Record<string, string>)[fg] ?? fg;
    const b = (p as Record<string, string>)[bg] ?? bg;
    const r = contrastRatio(a, b);
    if (r < min) fail(rule, `${label}: ${r.toFixed(2)}:1 is below ${min}:1`);
  };
  need(2, 'on-primary', 'primary', 4.5, 'on-primary / primary');
  need(2, 'on-primary', 'primary-hover', 4.5, 'on-primary / primary-hover');
  need(2, 'on-primary', 'primary-active', 4.5, 'on-primary / primary-active');
  need(3, 'primary', SURFACE, 4.5, 'primary as text / surface');
  need(3, 'primary', SURFACE_SUBTLE, 4.5, 'primary as text / surface-subtle');
  need(3, 'primary', BG_PAGE, 4.5, 'primary as text / bg-page');
  need(4, 'primary', BG_PAGE, 3, 'primary indicator / bg-page');
  need(4, 'primary', NEUTRAL_200, 3, 'primary progress fill / neutral-200 track');
  need(5, 'primary', 'primary-subtle', 4.5, 'selected text primary / primary-subtle');
  need(6, 'on-accent', 'accent', 4.5, 'on-accent / accent');
  const primary = toOklch(p.primary);
  const error = toOklch(STATUS_ERROR_FG);
  if (primary.c >= 0.05 && hueDistance(primary.h, error.h) < 30) {
    fail(7, `primary hue ${primary.h.toFixed(1)} is within 30 degrees of the error hue ${error.h.toFixed(1)}`);
  }
  return { valid: v.length === 0, violations: v };
}

/** Thrown by applyBrandProfile when a profile is rejected; nothing is applied. */
export class PaepBrandProfileError extends Error {
  constructor(readonly violations: readonly PaepBrandViolation[]) {
    super(`brand profile rejected: ${violations.map((x) => `rule ${x.rule}: ${x.message}`).join('; ')}`);
    this.name = 'PaepBrandProfileError';
  }
}

/** Minimal style target (an element's CSSStyleDeclaration). */
export interface PaepStyleTarget {
  readonly style: { setProperty(name: string, value: string): void; removeProperty(name: string): string };
}

/**
 * Validates, then sets the seven --paep-brand-* custom properties on the target (usually
 * document.documentElement or a subtree root). A rejected profile throws and changes nothing.
 */
export function applyBrandProfile(target: PaepStyleTarget, profile: unknown): void {
  const result = validateBrandProfile(profile);
  if (!result.valid) throw new PaepBrandProfileError(result.violations);
  const p = profile as PaepBrandProfile;
  for (const k of PAEP_BRAND_KEYS) target.style.setProperty(`--paep-brand-${k}`, p[k]);
}

/** Removes a previously applied profile so the approved default applies again. */
export function clearBrandProfile(target: PaepStyleTarget): void {
  for (const k of PAEP_BRAND_KEYS) target.style.removeProperty(`--paep-brand-${k}`);
}
