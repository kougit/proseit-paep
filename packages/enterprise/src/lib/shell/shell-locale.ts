import { DestroyRef, inject } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { resolveLocale } from '@proseit/paep-i18n';

/**
 * Display name of a locale in its own language ("English", "العربية", "Français"), from the platform's Intl data. The
 * shell adds no language-name keys: a language is always offered under its own name.
 */
export function languageName(tag: string): string {
  try {
    const name = new Intl.DisplayNames([tag], { type: 'language' }).of(tag) ?? tag;
    return name.charAt(0).toLocaleUpperCase(tag) + name.slice(1);
  } catch {
    return tag;
  }
}

/** "LTR" or "RTL" for a supported locale (the runtime configuration's `rtlLocales`). */
export function directionLabel(tag: string, rtlLocales: readonly string[]): string {
  return resolveLocale(tag, rtlLocales)?.direction === 'rtl' ? 'RTL' : 'LTR';
}

/** Visible short code of a locale in the topbar language button ("EN", "AR"). */
export function languageCode(tag: string): string {
  return tag.split('-')[0].toLocaleUpperCase('en');
}

/**
 * A route change closes the shell's menus and panels (HOF-IB2-001 v1.2 §2.1 dismissal). Call in an injection
 * context; `close` runs on every navigation start.
 */
export function closeOnNavigation(close: () => void): void {
  const sub = inject(Router).events.subscribe((e) => {
    if (e instanceof NavigationStart) close();
  });
  inject(DestroyRef).onDestroy(() => sub.unsubscribe());
}
