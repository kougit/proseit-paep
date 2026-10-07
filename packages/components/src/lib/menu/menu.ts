import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { PaepIcon, PaepIconName } from '@proseit/paep-foundation';
import { suppressActivationWhile } from '../button/button';
import { PaepPopover, PaepPopoverAlign, PaepPopoverFocus } from '../popover/popover';

let nextGroupId = 0;

/**
 * Menu button menu (HOF-IB2-001 v1.2 §2.2, P-02), composed on the `PaepPopover` positioning base (no second
 * positioning engine): `<button paepButton [paepMenuTrigger]="account">Account</button>
 * <paep-menu #account label="Account" align="end"><button paepMenuItem>Display preferences</button>…</paep-menu>`.
 * Items are `paepMenuItem` buttons or links and `paepMenuItemRadio` buttons inside a `paep-menu-group`; a
 * `paepMenuSeparator` divides them. Keys: Enter/Space/↓ on the button open on the first item and ↑ on the last; ↑/↓
 * move and wrap, Home/End jump, a printable character types ahead, Escape closes and returns focus to the button, Tab
 * closes and moves on. Activating an item closes the menu (unless the item is `keepOpen`); focus returns to the button
 * unless the action moved it. Light dismiss is the platform's (`popover="auto"`), so one menu is open at a time.
 */
@Component({
  selector: 'paep-menu',
  exportAs: 'paepMenu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [PaepPopover],
  host: { class: 'paep-menu' },
  template: `
    <paep-popover
      class="paep-menu__panel"
      variant="menu"
      [align]="align()"
      [attr.aria-label]="label()"
      (openChange)="openChange.emit($event)"
    >
      <ng-content />
    </paep-popover>
  `,
  styleUrl: './menu.css',
})
export class PaepMenu {
  /** Accessible name of the menu (usually the menu button's text). */
  readonly label = input.required<string>();
  /** Edge of the menu button the menu aligns to; topbar and "More" menus use `end`. */
  readonly align = input<PaepPopoverAlign>('start');
  /** Emits true when the menu opens and false when it closes (including light dismiss). */
  readonly openChange = output<boolean>();

  private readonly popover = viewChild(PaepPopover);

  /** Id of the element with role="menu" (for the button's aria-controls). */
  id(): string | null {
    return this.popover()?.id ?? null;
  }

  /** Whether the menu is open. */
  isOpen(): boolean {
    return this.popover()?.isOpen() ?? false;
  }

  /** Opens the menu below its button and focuses the first (or last) item. */
  show(trigger: HTMLElement, focus: PaepPopoverFocus = 'first'): void {
    this.popover()?.show(trigger, focus);
  }

  /** Closes the menu; with returnFocus, focus goes back to the menu button. */
  hide(returnFocus = false): void {
    this.popover()?.hide(returnFocus);
  }

  /**
   * @internal Called by an item after its action ran: closes the menu. Focus returns to the button only if the action
   * left it in the menu (a dialog it opened keeps focus).
   */
  itemActivated(): void {
    this.popover()?.hide(false);
  }
}

/**
 * Makes a button the menu button of a `paep-menu`: aria-haspopup="menu", aria-expanded and aria-controls. Enter and
 * Space (click) open on the first item, ↓ on the first and ↑ on the last; a second click closes.
 */
@Directive({
  selector: '[paepMenuTrigger]',
  exportAs: 'paepMenuTrigger',
  host: {
    'aria-haspopup': 'menu',
    '[attr.aria-expanded]': 'paepMenuTrigger().isOpen()',
    '[attr.aria-controls]': 'paepMenuTrigger().id()',
    '(pointerdown)': 'wasOpen = paepMenuTrigger().isOpen()',
    '(click)': 'onClick()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class PaepMenuTrigger {
  private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** The menu this button opens. */
  readonly paepMenuTrigger = input.required<PaepMenu>();
  /** Open state captured on pointerdown, before light dismiss can close the menu. */
  protected wasOpen: boolean | null = null;

  protected onClick(): void {
    const menu = this.paepMenuTrigger();
    const open = this.wasOpen ?? menu.isOpen();
    this.wasOpen = null;
    if (open) menu.hide(true);
    else menu.show(this.element, 'first');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.paepMenuTrigger().show(this.element, event.key === 'ArrowUp' ? 'last' : 'first');
  }
}

/**
 * A menu item: `<button paepMenuItem (click)="…">Display preferences</button>` or a link item
 * `<a paepMenuItem href="…">Support site</a>`. `disabled` keeps it visible and announced but not activatable
 * (aria-disabled); `keepOpen` keeps the menu open after activation (an item that shows its own progress, such as
 * "Signing out…"); `destructive` uses the destructive text tone.
 */
@Component({
  selector: 'button[paepMenuItem], a[paepMenuItem]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon],
  host: {
    class: 'paep-menu__item',
    role: 'menuitem',
    tabindex: '-1',
    '[attr.type]': 'isButton ? "button" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    // aria-disabled only: the item stays perceivable; a static native disabled attribute is removed.
    '[attr.disabled]': 'null',
    '[attr.data-keep-open]': 'keepOpen() ? "" : null',
    '[class.paep-menu__item--destructive]': 'destructive()',
    '(click)': 'activated()',
    '(keydown.space)': 'onSpace($event)',
  },
  template: `
    @if (icon(); as i) {
      <svg class="paep-menu__icon" [paepIcon]="i"></svg>
    }
    <span class="paep-menu__label"><ng-content /></span>
  `,
})
export class PaepMenuItem {
  private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly isButton = this.element.tagName === 'BUTTON';
  /** Optional leading icon. */
  readonly icon = input<PaepIconName | undefined>(undefined);
  /** Announced as unavailable (aria-disabled) and not activatable; still reachable with the arrow keys. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Keep the menu open after activation. */
  readonly keepOpen = input(false, { transform: booleanAttribute });
  /** Destructive outcome (text tone only). */
  readonly destructive = input(false, { transform: booleanAttribute });

  private readonly menu = inject(PaepMenu, { optional: true });

  constructor() {
    suppressActivationWhile(this.element, () => this.disabled());
  }

  /** Runs after the consumer's click handlers (registered earlier on the same element). */
  protected activated(): void {
    if (!this.keepOpen()) setTimeout(() => this.menu?.itemActivated());
  }

  /** Space activates a link item as it does a button item. */
  protected onSpace(event: Event): void {
    if (this.isButton) return;
    event.preventDefault();
    this.element.click();
  }
}

/**
 * A radio item in a `paep-menu-group`: `<button paepMenuItemRadio [checked]="locale === 'en'" (select)="…">English</button>`.
 * Activation emits `select` (the owner updates `checked`, so exactly one item in the group is checked) and closes the menu.
 */
@Component({
  selector: 'button[paepMenuItemRadio]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon],
  host: {
    class: 'paep-menu__item paep-menu__item--radio',
    role: 'menuitemradio',
    type: 'button',
    tabindex: '-1',
    '[attr.aria-checked]': 'checked() ? "true" : "false"',
    '(click)': 'activate()',
  },
  template: `
    <svg class="paep-menu__check" paepIcon="check"></svg>
    <span class="paep-menu__label"><ng-content /></span>
  `,
})
export class PaepMenuItemRadio {
  /** Whether this is the checked item of its group. */
  readonly checked = input(false, { transform: booleanAttribute });
  /** Emits when the item is activated. */
  readonly select = output<void>();
  private readonly menu = inject(PaepMenu, { optional: true });

  protected activate(): void {
    this.select.emit();
    this.menu?.itemActivated();
  }
}

/** A labelled group of radio items: `<paep-menu-group label="Language">…</paep-menu-group>` (role="group"). */
@Component({
  selector: 'paep-menu-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'paep-menu__group', role: 'group', '[attr.aria-labelledby]': 'labelId' },
  template: `
    <div class="paep-menu__group-label" [id]="labelId">{{ label() }}</div>
    <ng-content />
  `,
})
export class PaepMenuGroup {
  /** Visible name of the group. */
  readonly label = input.required<string>();
  protected readonly labelId = `paep-menu-group-${nextGroupId++}`;
}

/** Divider between item sets: `<hr paepMenuSeparator />`. */
@Directive({
  selector: 'hr[paepMenuSeparator]',
  host: { class: 'paep-menu__separator', role: 'separator' },
})
export class PaepMenuSeparator {}
