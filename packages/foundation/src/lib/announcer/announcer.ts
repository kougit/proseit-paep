import { DOCUMENT, Injectable, OnDestroy, inject } from '@angular/core';

export type PaepPoliteness = 'polite' | 'assertive';

/**
 * Screen-reader announcements through two persistent, visually hidden live regions (created once per
 * document). Use for transient results ("Saved", "Loading records"); persistent messages belong in the page.
 */
@Injectable({ providedIn: 'root' })
export class PaepAnnouncer implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly regions = new Map<PaepPoliteness, HTMLElement>();
  private readonly timers = new Map<PaepPoliteness, ReturnType<typeof setTimeout>>();

  /** Announces a message. The region is cleared first so repeating the same text is announced again. */
  announce(message: string, politeness: PaepPoliteness = 'polite'): void {
    const region = this.region(politeness);
    region.textContent = '';
    clearTimeout(this.timers.get(politeness));
    this.timers.set(politeness, setTimeout(() => (region.textContent = message), 50));
  }

  /** The live region element for a politeness level (created on first use). */
  region(politeness: PaepPoliteness): HTMLElement {
    let el = this.regions.get(politeness);
    if (!el || !el.isConnected) {
      el = this.document.createElement('div');
      el.className = 'paep-visually-hidden';
      el.setAttribute('aria-live', politeness);
      el.setAttribute('aria-atomic', 'true');
      el.setAttribute('data-paep-announcer', politeness);
      this.document.body.appendChild(el);
      this.regions.set(politeness, el);
    }
    return el;
  }

  ngOnDestroy(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    for (const el of this.regions.values()) el.remove();
    this.regions.clear();
  }
}
