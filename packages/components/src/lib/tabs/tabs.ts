import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  LOCALE_ID,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_MESSAGES, paepFormat } from '../messages/messages';

let nextTabId = 0;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type PaepTabsActivation = 'automatic' | 'manual';

/**
 * One tab and its panel: `<paep-tab label="Overview">panel content</paep-tab>` inside `<paep-tabs>`.
 * The element itself is the tabpanel; only the selected panel is shown.
 */
@Component({
  selector: 'paep-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tabpanel',
    class: 'paep-tab-panel',
    '[id]': 'panelId',
    '[attr.aria-labelledby]': 'tabId',
    '[hidden]': '!selected()',
  },
  template: '<ng-content />',
  styles: `
    :host {
      display: block;
      padding-block: var(--paep-space-4);
    }
    :host([hidden]) {
      display: none;
    }
  `,
})
export class PaepTab {
  private readonly tabs = inject(PaepTabs);
  /** @internal */
  readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Visible tab label (its accessible name). */
  readonly label = input.required<string>();
  /** Disabled tabs stay reachable with the arrow keys but cannot be activated. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Why the tab is disabled; referenced by aria-describedby. */
  readonly disabledReason = input<string>();
  /** Optional count shown after the label. */
  readonly count = input<number>();
  /** Number of errors in the panel, shown in the tab as an icon and text. */
  readonly errorCount = input(0);

  /** @internal */
  readonly tabId = `paep-tab-${nextTabId}`;
  /** @internal */
  readonly panelId = `paep-tab-${nextTabId}-panel`;
  /** @internal */
  readonly reasonId = `paep-tab-${nextTabId++}-reason`;
  protected readonly selected = computed(() => this.tabs.selectedTab() === this);
}

/**
 * Tabs (WAI-ARIA tabs pattern): `<paep-tabs label="Record sections"><paep-tab label="Overview">…</paep-tab></paep-tabs>`.
 * Roving tabindex; ArrowLeft/ArrowRight follow the visual direction (mirrored in RTL), Home/End jump.
 * Automatic activation by default; `activation="manual"` requires Enter/Space. An overflowing tab list
 * scrolls inside its own box with aria-hidden edge scroll buttons for pointer users.
 */
@Component({
  selector: 'paep-tabs',
  imports: [PaepIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.html',
  styleUrl: './tabs.css',
})
export class PaepTabs {
  private readonly messages = inject(PAEP_MESSAGES);
  private readonly locale = inject(LOCALE_ID);

  /** Accessible name of the tab list. */
  readonly label = input.required<string>();
  /** automatic (default): arrow keys select; manual: arrow keys move focus, Enter/Space select. */
  readonly activation = input<PaepTabsActivation>('automatic');
  /** Index of the selected tab. Two-way bindable: `[(selectedIndex)]`. */
  readonly selectedIndex = model(0);
  readonly scrollStartLabel = input(this.messages['paep.tabs.scrollStart']);
  readonly scrollEndLabel = input(this.messages['paep.tabs.scrollEnd']);

  protected readonly tabs = contentChildren(PaepTab);
  /** @internal */
  readonly selectedTab = computed(() => this.tabs()[this.selectedIndex()]);
  protected readonly canScrollStart = signal(false);
  protected readonly canScrollEnd = signal(false);
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');

  constructor() {
    afterRenderEffect(() => {
      this.selectedIndex();
      for (const tab of this.tabs()) {
        // A panel is a Tab stop only when it has no focusable content of its own.
        if (tab.element.querySelector(FOCUSABLE)) tab.element.removeAttribute('tabindex');
        else tab.element.setAttribute('tabindex', '0');
      }
      this.revealSelected();
      this.updateOverflow();
    });
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new ResizeObserver(() => this.updateOverflow());
      observer.observe(this.list().nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected errorText(count: number): string {
    return paepFormat(this.messages['paep.form.containsErrors'], { count }, this.locale);
  }

  protected activate(index: number): void {
    if (!this.tabs()[index]?.disabled()) this.selectedIndex.set(index);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const buttons = this.buttons();
    const current = buttons.indexOf(event.target as HTMLElement);
    if (current < 0) return;
    const rtl = getComputedStyle(this.list().nativeElement).direction === 'rtl';
    const steps: Record<string, number> = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 };
    const step = steps[event.key];
    let next: number;
    if (step !== undefined) next = (current + step + buttons.length) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[next].focus();
    if (this.activation() === 'automatic') this.activate(next);
  }

  protected scroll(towardEnd: boolean): void {
    const list = this.list().nativeElement;
    const rtl = getComputedStyle(list).direction === 'rtl';
    const sign = (towardEnd ? 1 : -1) * (rtl ? -1 : 1);
    list.scrollBy({ left: sign * list.clientWidth * 0.8 });
  }

  protected updateOverflow(): void {
    const list = this.list().nativeElement;
    const scrolled = Math.abs(list.scrollLeft);
    this.canScrollStart.set(scrolled > 1);
    this.canScrollEnd.set(scrolled + list.clientWidth < list.scrollWidth - 1);
  }

  private buttons(): HTMLElement[] {
    return Array.from(this.list().nativeElement.querySelectorAll<HTMLElement>('[role="tab"]'));
  }

  /** Scrolls the selected tab into view inside the list only (never the page). */
  private revealSelected(): void {
    const list = this.list().nativeElement;
    const tab = this.buttons()[this.selectedIndex()];
    if (!tab || list.scrollWidth <= list.clientWidth) return;
    const l = list.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(list).scrollPaddingInlineStart) || 0;
    if (t.left < l.left + pad) list.scrollLeft -= l.left + pad - t.left;
    else if (t.right > l.right - pad) list.scrollLeft += t.right - (l.right - pad);
  }
}
