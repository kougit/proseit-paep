import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  contentChildren,
  inject,
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { PaepIcon, PaepIconName } from '@proseit/paep-foundation';
import { PaepButton } from '../button/button';
import { PAEP_MESSAGES } from '../messages/messages';

export type PaepActionGroupVariant = 'toolbar' | 'footer';
export type PaepActionPriority = 'primary' | 'secondary' | 'destructive';

interface PaepOverflowEntry {
  readonly label: string;
  readonly icon: PaepIconName | undefined;
  readonly destructive: boolean;
  readonly disabled: boolean;
  readonly source: HTMLElement;
}

let nextId = 0;
/** Gap between the More button and its menu, and the minimum distance to the viewport edge (px). */
const MENU_OFFSET = 4;
const VIEWPORT_MARGIN = 16;

/** Priority of a projected button, taken from its variant (primary / destructive / everything else). */
export function paepActionPriority(button: PaepButton): PaepActionPriority {
  const v = button.variant();
  return v === 'primary' ? 'primary' : v === 'destructive' ? 'destructive' : 'secondary';
}

/**
 * Related actions with stable primary placement and responsive overflow:
 * `<paep-action-group label="Record actions"><button paepButton>Edit</button> … <button paepButton variant="primary">Save</button></paep-action-group>`.
 * Priority comes from each paepButton's variant. The primary sits at the inline-end; destructive actions follow a
 * separator. Toolbar variant: below a 30rem container width the primary stretches and the other actions move into a
 * "More" menu (same order, destructive last after a divider). Footer variant: below 30rem all actions stack full
 * width in DOM order. Write the DOM in visual order: secondary, destructive, primary.
 */
@Component({
  selector: 'paep-action-group',
  exportAs: 'paepActionGroup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [PaepButton, PaepIcon],
  host: {
    class: 'paep-action-group',
    role: 'group',
    '[class.paep-action-group--toolbar]': 'variant() === "toolbar"',
    '[class.paep-action-group--footer]': 'variant() === "footer"',
    '[attr.aria-label]': 'label()',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `
    <div class="paep-action-group__row">
      <ng-content />
      @if (hasSeparator()) {
        <span class="paep-action-group__sep" aria-hidden="true"></span>
      }
      @if (variant() === 'toolbar' && hasOverflow()) {
        <button
          #more
          paepButton
          class="paep-action-group__more"
          icon="more"
          aria-haspopup="menu"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="menuId"
          [attr.aria-label]="moreActionsText()"
          (click)="toggle()"
          (keydown)="onMoreKeydown($event)"
        >{{ moreText() }}</button>
        <div
          #menu
          class="paep-action-group__menu"
          popover="manual"
          role="menu"
          [id]="menuId"
          [attr.aria-label]="moreActionsText()"
          (toggle)="onToggle($event)"
          (keydown)="onMenuKeydown($event)"
        >
          @for (entry of entries(); track $index) {
            @if (entry.destructive && $index === firstDestructive()) {
              <hr class="paep-action-group__divider" role="separator" />
            }
            <button
              #item
              type="button"
              role="menuitem"
              tabindex="-1"
              class="paep-action-group__item"
              [class.paep-action-group__item--destructive]="entry.destructive"
              [attr.aria-disabled]="entry.disabled ? 'true' : null"
              (click)="run(entry)"
            >
              @if (entry.icon; as icon) {
                <svg class="paep-action-group__item-icon" [paepIcon]="icon"></svg>
              }
              {{ entry.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './action-group.css',
})
export class PaepActionGroup {
  /** Accessible name of the group, e.g. "Record actions". */
  readonly label = input.required<string>();
  /** toolbar: overflow into "More" at narrow widths. footer: stack full width at narrow widths (dialogs, drawers). */
  readonly variant = input<PaepActionGroupVariant>('toolbar');
  private readonly messages = inject(PAEP_MESSAGES);
  /** Visible text of the overflow button (paep.action.more). */
  readonly moreLabel = input<string | undefined>(undefined);
  /** Accessible name of the overflow button and menu (paep.action.moreActions). */
  readonly moreActionsLabel = input<string | undefined>(undefined);

  protected readonly moreText = computed(() => this.moreLabel() ?? this.messages['paep.action.more']);
  protected readonly moreActionsText = computed(() => this.moreActionsLabel() ?? this.messages['paep.action.moreActions']);
  protected readonly menuId = `paep-action-group-menu-${nextId++}`;

  private readonly items = contentChildren(PaepButton);
  private readonly moreButton = viewChild('more', { read: ElementRef<HTMLButtonElement> });
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');
  private readonly menuItems = viewChildren<ElementRef<HTMLButtonElement>>('item');
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly open = signal(false);
  protected readonly entries = signal<readonly PaepOverflowEntry[]>([]);
  protected readonly firstDestructive = computed(() => {
    const list = this.entries();
    const i = list.findIndex((e) => e.destructive);
    return i > 0 ? i : -1;
  });
  private readonly priorities = computed(() => this.items().map(paepActionPriority));
  protected readonly hasOverflow = computed(() => this.priorities().some((p) => p !== 'primary'));
  protected readonly hasSeparator = computed(() => {
    const p = this.priorities();
    return p.includes('destructive') && p.includes('secondary');
  });

  protected toggle(): void {
    if (this.open()) this.close(true);
    else this.openMenu('first');
  }

  protected onMoreKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.openMenu(event.key === 'ArrowDown' ? 'first' : 'last');
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    const items = this.menuItems().map((r) => r.nativeElement);
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusAt(current + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusAt(current < 0 ? -1 : current - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusAt(-1);
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.close(true);
        break;
      case 'Tab':
        // Close and continue: focus goes back to More, then the browser moves on from there.
        this.close(true);
        break;
    }
  }

  protected onToggle(event: Event): void {
    this.open.set((event as ToggleEvent).newState === 'open');
  }

  /** Light dismiss: a pointer press outside the menu and the More button closes the menu without moving focus. */
  protected onDocumentPointerDown(event: Event): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && (this.menu()?.nativeElement.contains(target) || this.moreButton()?.nativeElement.contains(target))) return;
    this.close(false);
  }

  protected run(entry: PaepOverflowEntry): void {
    if (entry.disabled) return;
    this.close(true);
    // The original (hidden) button performs the action, so click handlers and form submission stay the consumer's.
    entry.source.click();
  }

  private openMenu(focus: 'first' | 'last'): void {
    const menu = this.menu()?.nativeElement;
    if (!menu) return;
    this.entries.set(this.collectEntries());
    this.cdr.detectChanges();
    if (!menu.matches(':popover-open')) menu.showPopover();
    this.open.set(true);
    this.position(menu);
    const items = this.menuItems().map((r) => r.nativeElement);
    (focus === 'first' ? items[0] : items[items.length - 1])?.focus();
  }

  private close(restoreFocus: boolean): void {
    const menu = this.menu()?.nativeElement;
    if (restoreFocus) this.moreButton()?.nativeElement.focus();
    if (menu?.matches(':popover-open')) menu.hidePopover();
    this.open.set(false);
  }

  private collectEntries(): PaepOverflowEntry[] {
    const toEntry = (b: PaepButton): PaepOverflowEntry => ({
      label: (b.element.textContent ?? '').trim(),
      icon: b.icon(),
      destructive: b.variant() === 'destructive',
      disabled: (b.element as HTMLButtonElement).disabled === true || b.loading(),
      source: b.element,
    });
    const moved = this.items().filter((b) => paepActionPriority(b) !== 'primary');
    return [...moved.filter((b) => b.variant() !== 'destructive'), ...moved.filter((b) => b.variant() === 'destructive')].map(toEntry);
  }

  /** Places the top-layer menu below the More button, aligned to its inline-end, inside the viewport. */
  private position(menu: HTMLElement): void {
    const anchor = this.moreButton()?.nativeElement.getBoundingClientRect();
    if (!anchor) return;
    const rtl = getComputedStyle(this.host).direction === 'rtl';
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const { width, height } = menu.getBoundingClientRect();
    const physicalLeft = rtl ? anchor.left : anchor.right - width;
    const clampedLeft = Math.max(VIEWPORT_MARGIN, Math.min(physicalLeft, vw - VIEWPORT_MARGIN - width));
    const inlineStart = rtl ? vw - clampedLeft - width : clampedLeft;
    let top = anchor.bottom + MENU_OFFSET;
    if (top + height > vh - VIEWPORT_MARGIN && anchor.top - MENU_OFFSET - height >= VIEWPORT_MARGIN) {
      top = anchor.top - MENU_OFFSET - height;
    }
    menu.style.insetBlockStart = `${Math.round(top)}px`;
    menu.style.insetInlineStart = `${Math.round(Math.max(0, inlineStart))}px`;
  }
}
