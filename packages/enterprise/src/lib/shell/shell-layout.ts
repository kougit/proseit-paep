import { DOCUMENT, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { paepMinWidthQuery } from '@proseit/paep-foundation';

export type PaepShellDensity = 'comfortable' | 'compact';

function query(view: Window | null, name: 'tablet' | 'desktop', destroyRef: DestroyRef) {
  const mql = view && typeof view.matchMedia === 'function' ? view.matchMedia(paepMinWidthQuery(name)) : null;
  const value = signal(mql ? mql.matches : true);
  if (mql) {
    const listener = (e: MediaQueryListEvent) => value.set(e.matches);
    mql.addEventListener('change', listener);
    destroyRef.onDestroy(() => mql.removeEventListener('change', listener));
  }
  return value;
}

/**
 * Session-only shell layout state (Q-03, Q-14; interaction-notes §1.8: no storage and no "saved" message): the width
 * band, the navigation collapse and sheet state, and content density.
 */
@Injectable()
export class PaepShellLayout {
  private readonly view = inject(DOCUMENT).defaultView;
  private readonly destroyRef = inject(DestroyRef);
  /** ≥ 1024 px (64 em): persistent navigation. */
  readonly wide = query(this.view, 'desktop', this.destroyRef).asReadonly();
  /** ≥ 600 px (37.5 em); below it the narrow rules apply. */
  readonly medium = query(this.view, 'tablet', this.destroyRef).asReadonly();
  /** The persistent navigation is collapsed to the rail (user choice for the session). */
  readonly navCollapsed = signal(false);
  /** The modal navigation sheet is open (below 1024 px). */
  readonly sheetOpen = signal(false);
  /** The command palette is open. */
  readonly paletteOpen = signal(false);
  /** Content density; the chrome stays comfortable. */
  readonly density = signal<PaepShellDensity>('comfortable');
  /** The display preferences dialog is open (opened from the account menu). */
  readonly preferencesOpen = signal(false);
  /** Incremented to ask the topbar to open its language menu ("Change language" in the account menu, ≥ 600 px). */
  readonly languageMenuRequest = signal(0);
}
