import { InjectionToken } from '@angular/core';
import type { PaepMessageCatalogue } from '@proseit/paep-i18n';

/** @internal Per-locale overrides of shell keys, keyed by locale tag or language ("ar", "pt-BR"). */
export const PAEP_SHELL_MESSAGE_OVERRIDES = new InjectionToken<Readonly<Record<string, PaepMessageCatalogue>>>('PAEP_SHELL_MESSAGE_OVERRIDES', {
  factory: () => ({}),
});
