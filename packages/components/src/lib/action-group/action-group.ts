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
} from '@angular/core';
import type { PaepIconName } from '@proseit/paep-foundation';
import { PaepButton } from '../button/button';
import { PaepMenu, PaepMenuItem, PaepMenuSeparator } from '../menu/menu';
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
 * width in DOM order. Write the DOM in visual order: secondary, destructive, primary. The "More" menu is a `PaepMenu`
 * aligned to More's inline-end edge (HOF-IB2-001 v1.2 §2.3, closing DDR-IB2-02): platform light dismiss, the menu key
 * map, items generated from the projected buttons at open; activating an item runs the original button.
 */
@Component({
  selector: 'paep-action-group',
  exportAs: 'paepActionGroup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [PaepButton, PaepMenu, PaepMenuItem, PaepMenuSeparator],
  host: {
    class: 'paep-action-group',
    role: 'group',
    '[class.paep-action-group--toolbar]': 'variant() === "toolbar"',
    '[class.paep-action-group--footer]': 'variant() === "footer"',
    '[attr.aria-label]': 'label()',
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
          [attr.aria-controls]="menu.id()"
          [attr.aria-label]="moreActionsText()"
          (pointerdown)="wasOpen = open()"
          (click)="toggle()"
          (keydown)="onMoreKeydown($event)"
        >{{ moreText() }}</button>
        <paep-menu #menu class="paep-action-group__menu" align="end" [label]="moreActionsText()" (openChange)="open.set($event)">
          @for (entry of entries(); track $index) {
            @if (entry.destructive && $index === firstDestructive()) {
              <hr paepMenuSeparator class="paep-action-group__divider" />
            }
            <button
              paepMenuItem
              class="paep-action-group__item"
              [icon]="entry.icon"
              [disabled]="entry.disabled"
              [destructive]="entry.destructive"
              (click)="run(entry)"
            >{{ entry.label }}</button>
          }
        </paep-menu>
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

  private readonly items = contentChildren(PaepButton);
  private readonly moreButton = viewChild('more', { read: ElementRef<HTMLButtonElement> });
  private readonly menu = viewChild(PaepMenu);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly open = signal(false);
  /** Open state captured on pointerdown, before light dismiss can close the menu. */
  protected wasOpen: boolean | null = null;
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
    const open = this.wasOpen ?? this.open();
    this.wasOpen = null;
    if (open) this.menu()?.hide(true);
    else this.openMenu('first');
  }

  protected onMoreKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.openMenu(event.key === 'ArrowDown' ? 'first' : 'last');
    }
  }

  protected run(entry: PaepOverflowEntry): void {
    if (entry.disabled) return;
    this.menu()?.hide(true);
    // The original (hidden) button performs the action, so click handlers and form submission stay the consumer's.
    entry.source.click();
  }

  /** Items are generated from the projected buttons at open (label, icon, disabled and loading state as they are now). */
  private openMenu(focus: 'first' | 'last'): void {
    const more = this.moreButton()?.nativeElement;
    if (!more) return;
    this.entries.set(this.collectEntries());
    this.cdr.detectChanges();
    this.menu()?.show(more, focus);
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
}
