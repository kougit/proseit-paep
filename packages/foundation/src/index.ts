/*
 * @proseit/paep-foundation public API (IB2).
 * Design tokens (HOF-IB2-001 v1.1), brand-profile validation, colour utilities, layout breakpoints,
 * PAEP-owned icons and the live-region announcer. The token stylesheet is
 * '@proseit/paep-foundation/src/styles/paep-foundation.css'.
 */
export type { PaepTokenCategory, PaepTokenDefinition, PaepTokenLayer } from './lib/tokens/token-types';
export { PAEP_TOKENS, PAEP_TOKEN_VERSION } from './lib/tokens/token-catalogue.generated';
export type { PaepOklch, PaepRgb } from './lib/color/color';
export { contrastRatio, hueDistance, isHexColor, parseHex, relativeLuminance, toOklch } from './lib/color/color';
export type { PaepBrandKey, PaepBrandProfile, PaepBrandValidation, PaepBrandViolation, PaepStyleTarget } from './lib/brand/brand-profile';
export {
  PAEP_BRAND_KEYS,
  PAEP_DEFAULT_BRAND,
  PaepBrandProfileError,
  applyBrandProfile,
  clearBrandProfile,
  validateBrandProfile,
} from './lib/brand/brand-profile';
export type { PaepBreakpoint } from './lib/layout/breakpoints';
export { PAEP_BREAKPOINTS, PAEP_CONTAINER_THRESHOLDS, paepMinWidthQuery } from './lib/layout/breakpoints';
export type { PaepIconName, PaepIconShape } from './lib/icons/icons';
export { PAEP_DIRECTIONAL_ICONS, PAEP_ICONS } from './lib/icons/icons';
export { PaepIcon } from './lib/icons/icon';
export type { PaepPoliteness } from './lib/announcer/announcer';
export { PaepAnnouncer } from './lib/announcer/announcer';
