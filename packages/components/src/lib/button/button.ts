import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { PaepIcon, PaepIconName } from '@proseit/paep-foundation';

/** `field`: a button presented like a field (search trigger, HOF-IB3-001 P-05); it opens something, it is not an input. */
export type PaepButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'field';
export type PaepButtonType = 'button' | 'submit' | 'reset';

/**
 * Suppresses activation of a busy control: a capture listener on the element itself runs before any
 * consumer click handler, cancels form submission / link navigation and stops the event. Shared by the
 * button and icon button.
 */
export function suppressActivationWhile(host: HTMLElement, busy: () => boolean): void {
  const guard = (event: Event) => {
    if (busy()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  host.addEventListener('click', guard, { capture: true });
  inject(DestroyRef).onDestroy(() => host.removeEventListener('click', guard, { capture: true }));
}

/**
 * Task action on a native element: `<button paepButton variant="primary">Save changes</button>` or a
 * link-styled-as-button `<a paepButton href="…">`. Native semantics, keyboard and form behaviour are kept;
 * the size comes from density. `disabled` is the native attribute (buttons only). While `loading`, a
 * spinner replaces the leading icon, the button is aria-busy + aria-disabled, stays focusable, keeps its
 * width and ignores activation. `variant="field"` presents the button like a field: a leading search icon (or
 * `icon`), the label truncated on one line (the accessible name keeps it in full) and an optional decorative keyboard
 * hint (`keyHint`, e.g. "Ctrl K"); the host states the shortcut itself with aria-keyshortcuts.
 */
@Component({
  selector: 'button[paepButton], a[paepButton]',
  exportAs: 'paepButton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon],
  host: {
    class: 'paep-button',
    '[class.paep-button--primary]': 'variant() === "primary"',
    '[class.paep-button--secondary]': 'variant() === "secondary"',
    '[class.paep-button--tertiary]': 'variant() === "tertiary"',
    '[class.paep-button--destructive]': 'variant() === "destructive"',
    '[class.paep-button--field]': 'variant() === "field"',
    '[class.paep-button--block]': 'block()',
    '[attr.type]': 'isButton ? type() : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.aria-disabled]': 'loading() ? "true" : null',
    '[style.min-inline-size.px]': 'lockedWidth()',
  },
  template: `
    @if (loading()) {
      <svg class="paep-button__icon" paepIcon="spinner"></svg>
    } @else if (leadingIcon(); as leading) {
      <svg class="paep-button__icon" [paepIcon]="leading"></svg>
    }
    <span class="paep-button__label"><ng-content /></span>
    @if (variant() === 'field' && keyHint()) {
      <kbd class="paep-button__hint" aria-hidden="true">{{ keyHint() }}</kbd>
    }
    @if (trailingIcon(); as trailing) {
      <svg class="paep-button__icon" [paepIcon]="trailing"></svg>
    }
  `,
  styleUrl: './button.css',
})
export class PaepButton {
  /** Emphasis: one primary per region; destructive only for irreversible or data-removing outcomes. */
  readonly variant = input<PaepButtonVariant>('secondary');
  /** Native button type. Defaults to "button" so a button never submits a form by accident. Ignored on links. */
  readonly type = input<PaepButtonType>('button');
  /** Optional decorative leading icon (the label always stays visible). The field variant defaults to search. */
  readonly icon = input<PaepIconName | undefined>(undefined);
  /** Optional decorative trailing icon, e.g. chevron-down or external. */
  readonly trailingIcon = input<PaepIconName | undefined>(undefined);
  /** Busy state: spinner, aria-busy, aria-disabled, focus kept, activation suppressed. */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Full-width layout option (narrow widths, footers). */
  readonly block = input(false, { transform: booleanAttribute });
  /** Field variant only: visible keyboard hint, decorative (aria-hidden), e.g. "Ctrl K". */
  readonly keyHint = input<string>('');

  /** Host element (used by the action group to mirror the action into its overflow menu). */
  readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly isButton = this.element.tagName === 'BUTTON';
  protected readonly lockedWidth = signal<number | null>(null);
  protected readonly leadingIcon = computed(() => this.icon() ?? (this.variant() === 'field' ? 'search' : undefined));

  constructor() {
    suppressActivationWhile(this.element, () => this.loading());
    // Lock the width when loading starts so a progressive label or the spinner does not shift the layout.
    effect(() => {
      const busy = this.loading();
      untracked(() => this.lockedWidth.set(busy ? this.element.getBoundingClientRect().width || null : null));
    });
  }
}
