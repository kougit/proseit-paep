import { Injectable, computed, inject } from '@angular/core';
import { createMessageResolver, type PaepMessageCatalogue, type PaepMessageParams } from '@proseit/paep-i18n';
import { PAEP_SHELL_DEFAULT_MESSAGES, type PaepShellMessageKey } from '../messages/shell-messages';
import { PAEP_SHELL_LOCALE } from '../ports/ports';
import { PAEP_SHELL_MESSAGE_OVERRIDES } from '../providers/tokens';

/**
 * Resolves `paep.shell.*` text for the active locale through the i18n message seam. Reading `t()` in a template
 * tracks the active locale, so the shell re-renders when the app applies another language.
 */
@Injectable()
export class PaepShellText {
  private readonly locale = inject(PAEP_SHELL_LOCALE);
  private readonly overrides = inject(PAEP_SHELL_MESSAGE_OVERRIDES);
  private readonly resolver = computed(() => {
    const tag = this.locale.active();
    const language = tag.split('-')[0];
    const merged: Record<string, string> = { ...(this.overrides[language] ?? {}), ...(this.overrides[tag] ?? {}) };
    return createMessageResolver(tag, PAEP_SHELL_DEFAULT_MESSAGES as PaepMessageCatalogue, merged);
  });

  /** The plain-text value of a shell key. */
  t(key: PaepShellMessageKey, params?: PaepMessageParams): string {
    return this.resolver().resolve(key, params);
  }

  /** Resolves any key the host supplied (for example a notification key); unknown keys resolve to themselves. */
  resolve(key: string, params?: PaepMessageParams): string {
    return this.resolver().resolve(key, params);
  }
}
