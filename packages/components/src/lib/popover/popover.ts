import { ChangeDetectionStrategy, Component, DestroyRef, Directive, ElementRef, inject, input, output, signal } from '@angular/core';

let nextPopoverId = 0;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const MENU_ITEM = '[role="menuitem"]:not([disabled]):not([aria-disabled="true"])';
/** Gap between trigger and panel and minimum distance from the viewport edge, in CSS px (4 px and 16 px tokens). */
const GAP = 4;
const EDGE = 16;

export type PaepPopoverVariant = 'info' | 'menu';
export type PaepPopoverFocus = 'auto' | 'first' | 'last';

/**
 * Non-modal panel anchored to a trigger: `<button paepButton [paepPopoverTrigger]="info">Details</button>
 * <paep-popover #info>…</paep-popover>`. Uses the HTML popover attribute (light dismiss "auto") where the
 * browser supports it, and a script that anchors the panel below the trigger's inline-start edge, flips
 * above when there is not enough space below and shifts to stay 16 px inside the viewport.
 * Never opened by hover. Escape closes and returns focus to the trigger; Tab past the end closes.
 */
@Component({
  selector: 'paep-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'paep-popover',
    '[id]': 'id',
    '[attr.popover]': "supported ? 'auto' : null",
    '[attr.hidden]': '!supported && !isOpen() ? "" : null',
    '[class.paep-popover--fallback]': '!supported',
    '[attr.role]': "variant() === 'menu' ? 'menu' : scrollable() ? 'region' : null",
    '[attr.tabindex]': 'scrollable() ? 0 : null',
    '[attr.aria-labelledby]': 'scrollable() ? triggerId() : null',
    '[attr.data-placement]': 'placement()',
    '(toggle)': 'onToggle($event)',
    '(keydown)': 'onKeydown($event)',
    '(focusout)': 'onFocusout($event)',
  },
  template: '<ng-content />',
  styles: `
    :host {
      inset: auto;
      box-sizing: border-box;
      inline-size: max-content;
      max-inline-size: min(20rem, calc(100% - 2 * var(--paep-space-4)));
      max-block-size: 60%;
      margin: 0;
      padding: var(--paep-space-3) var(--paep-space-4);
      overflow: auto;
      color: var(--paep-color-text-primary);
      background: var(--paep-color-surface-overlay);
      border: 1px solid var(--paep-color-border-subtle);
      border-radius: var(--paep-radius-md);
      box-shadow: var(--paep-elevation-3);
    }
    :host(:popover-open) {
      animation: paep-popover-enter var(--paep-motion-duration-moderate) var(--paep-motion-easing-enter);
    }
    :host(.paep-popover--fallback) {
      position: fixed;
      z-index: 1000;
    }
    :host([role='menu']) {
      padding: var(--paep-space-1);
    }
    @keyframes paep-popover-enter {
      from {
        opacity: 0;
        translate: 0 calc(var(--paep-space-1) * -1);
      }
    }
  `,
})
export class PaepPopover {
  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** info: short supplementary content; menu: a small set of role="menuitem" options (role="menu"). */
  readonly variant = input<PaepPopoverVariant>('info');
  /** Emits true when the panel opens and false when it closes (including light dismiss). */
  readonly openChange = output<boolean>();

  readonly id = `paep-popover-${nextPopoverId++}`;
  /** Whether the panel is open. */
  readonly isOpen = signal(false);
  /** True while an open informational panel has no interactive content (it then describes the trigger). */
  readonly describesTrigger = signal(false);
  /** True while an informational panel without interactive content overflows: it becomes a focusable, named region. */
  protected readonly scrollable = signal(false);
  protected readonly triggerId = signal<string | null>(null);
  protected readonly placement = signal<'below' | 'above'>('below');
  protected readonly supported = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;
  private trigger: HTMLElement | null = null;
  private readonly reposition = () => this.position();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTracking());
  }

  /** Opens the panel anchored to the trigger. Menus focus their first (or last) item. */
  show(trigger: HTMLElement, focus: PaepPopoverFocus = 'auto'): void {
    this.trigger = trigger;
    if (!trigger.id) trigger.id = `${this.id}-trigger`;
    this.triggerId.set(trigger.id);
    if (!this.isOpen()) {
      if (this.supported) {
        if (!this.host.matches(':popover-open')) this.host.showPopover();
      } else {
        this.host.hidden = false;
      }
      this.opened();
    }
    this.position();
    this.moveFocusIn(focus);
  }

  /** Closes the panel; focus returns to the trigger when requested or when it was inside the panel. */
  hide(returnFocus = false): void {
    this.close(returnFocus ? 'return' : 'auto');
  }

  /** Opens or closes the panel. */
  toggle(trigger: HTMLElement): void {
    if (this.isOpen()) this.hide();
    else this.show(trigger);
  }

  protected onToggle(event: Event): void {
    const state = (event as ToggleEvent).newState;
    if (state === 'closed') this.closed('auto');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.hide(true);
      return;
    }
    if (this.variant() !== 'menu') return;
    const items = Array.from(this.host.querySelectorAll<HTMLElement>(MENU_ITEM));
    if (!items.length) return;
    const index = items.indexOf(event.target as HTMLElement);
    const next: Record<string, number> = {
      ArrowDown: (index + 1) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    if (event.key in next) {
      event.preventDefault();
      items[next[event.key]].focus();
    }
  }

  /**
   * @internal Called by the trigger when it loses focus: an open informational panel that focus never entered
   * (it describes the trigger) closes once focus moves on, as Tab past the end does for a panel with content.
   */
  triggerFocusout(to: Node | null): void {
    if (!this.isOpen() || this.variant() === 'menu') return;
    if (to) {
      if (!this.host.contains(to)) this.close('keep');
      return;
    }
    // No related target: focus may have left the document (Tab past the last control into the browser UI).
    // Close once focus has settled outside the document; a click inside the page keeps the panel open.
    setTimeout(() => {
      if (this.isOpen() && !this.host.ownerDocument.hasFocus()) this.close('keep');
    });
  }

  protected onFocusout(event: FocusEvent): void {
    const to = event.relatedTarget as Node | null;
    // Tab past the last element: close and let focus continue in page order.
    if (to && !this.host.contains(to) && to !== this.trigger) this.close('keep');
  }

  private opened(): void {
    this.isOpen.set(true);
    this.openChange.emit(true);
    addEventListener('resize', this.reposition);
    addEventListener('scroll', this.reposition, true);
  }

  private close(focus: 'auto' | 'return' | 'keep'): void {
    if (this.supported && this.host.matches(':popover-open')) this.host.hidePopover();
    this.closed(focus);
  }

  /** focus: 'return' always refocuses the trigger, 'auto' only if focus was in the panel or lost, 'keep' never. */
  private closed(focus: 'auto' | 'return' | 'keep'): void {
    if (!this.supported) this.host.hidden = true;
    if (!this.isOpen()) return;
    const active = this.host.ownerDocument.activeElement;
    const focusWasInside = !active || active === this.host.ownerDocument.body || this.host.contains(active);
    this.isOpen.set(false);
    this.describesTrigger.set(false);
    this.scrollable.set(false);
    this.stopTracking();
    this.openChange.emit(false);
    const refocus = focus === 'return' || (focus === 'auto' && focusWasInside);
    if (refocus && this.trigger?.isConnected) {
      this.trigger.focus();
      // The native popover may already have restored focus without scrolling; keep the trigger in view.
      this.trigger.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
  }

  private stopTracking(): void {
    removeEventListener('resize', this.reposition);
    removeEventListener('scroll', this.reposition, true);
  }

  private moveFocusIn(focus: PaepPopoverFocus): void {
    if (this.variant() === 'menu') {
      const items = this.host.querySelectorAll<HTMLElement>(MENU_ITEM);
      (focus === 'last' ? items[items.length - 1] : items[0])?.focus();
      return;
    }
    const first = this.host.querySelector<HTMLElement>(FOCUSABLE);
    // Long content without controls: the panel itself takes focus so it can be scrolled with the keyboard.
    const overflowing = !first && this.host.scrollHeight > this.host.clientHeight + 1;
    this.scrollable.set(overflowing);
    this.describesTrigger.set(!first && !overflowing);
    if (overflowing) {
      this.host.tabIndex = 0;
      this.host.focus();
    } else {
      first?.focus();
    }
  }

  /** Anchors the panel to the trigger: below and aligned to its inline-start edge, flipped and shifted as needed. */
  private position(): void {
    const trigger = this.trigger;
    if (!trigger || !this.isOpen()) return;
    const t = trigger.getBoundingClientRect();
    const p = this.host.getBoundingClientRect();
    const doc = this.host.ownerDocument.documentElement;
    const vw = doc.clientWidth;
    const vh = doc.clientHeight;
    const spaceBelow = vh - t.bottom - GAP;
    const flip = p.height > spaceBelow && t.top - GAP > spaceBelow;
    const top = flip ? Math.max(EDGE, t.top - GAP - p.height) : t.bottom + GAP;
    const rtl = getComputedStyle(this.host).direction === 'rtl';
    const anchorStart = rtl ? vw - t.right : t.left;
    const start = Math.max(EDGE, Math.min(anchorStart, vw - EDGE - p.width));
    this.placement.set(flip ? 'above' : 'below');
    this.host.style.insetBlockStart = `${top}px`;
    this.host.style.insetInlineStart = `${start}px`;
  }
}

/**
 * Makes a button the trigger of a popover: `[paepPopoverTrigger]="popoverRef"`. Exposes aria-expanded and
 * aria-controls; Enter/Space (click) toggles. For menus, ArrowDown opens on the first item, ArrowUp on the last.
 */
@Directive({
  selector: '[paepPopoverTrigger]',
  host: {
    '[attr.aria-expanded]': 'paepPopoverTrigger().isOpen()',
    '[attr.aria-controls]': 'paepPopoverTrigger().id',
    '[attr.aria-haspopup]': "paepPopoverTrigger().variant() === 'menu' ? 'menu' : null",
    '[attr.aria-describedby]': 'paepPopoverTrigger().describesTrigger() ? paepPopoverTrigger().id : null',
    '(pointerdown)': 'wasOpen = paepPopoverTrigger().isOpen()',
    '(click)': 'onClick()',
    '(keydown)': 'onKeydown($event)',
    '(focusout)': 'onFocusout($event)',
  },
})
export class PaepPopoverTrigger {
  private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** The popover this control opens. */
  readonly paepPopoverTrigger = input.required<PaepPopover>();
  /** Open state captured on pointerdown, before light dismiss can close the panel. */
  protected wasOpen: boolean | null = null;

  protected onClick(): void {
    const popover = this.paepPopoverTrigger();
    const open = this.wasOpen ?? popover.isOpen();
    this.wasOpen = null;
    if (open) popover.hide();
    else popover.show(this.element);
  }

  protected onFocusout(event: FocusEvent): void {
    this.paepPopoverTrigger().triggerFocusout(event.relatedTarget as Node | null);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const popover = this.paepPopoverTrigger();
    if (popover.variant() !== 'menu' || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
    event.preventDefault();
    popover.show(this.element, event.key === 'ArrowUp' ? 'last' : 'first');
  }
}
