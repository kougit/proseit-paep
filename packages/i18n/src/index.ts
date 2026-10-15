// Public entry point of @proseit/paep-i18n. Consumers import this package only through this entry point.
// IB3 delivers the minimal locale, direction and message-resolution seam used by the enterprise shell; it is not a
// translation, dictionary-loading or formatting system.
export { applyLocale, resolveLocale, validateLocaleTag } from './lib/locale.js';
export type { PaepLocale, PaepLocaleRoot, PaepTextDirection } from './lib/locale.js';
export { createMessageResolver, formatMessage } from './lib/messages.js';
export type { PaepMessageCatalogue, PaepMessageParams, PaepMessageResolver } from './lib/messages.js';
