import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaepCountBadge, PaepIconButton, PaepSkeleton } from '@proseit/paep-components';
import { PaepIcon, type PaepIconName } from '@proseit/paep-foundation';
import type { PaepShellLockReason } from '../ports/ports';
import { PaepShellLayout } from '../shell/shell-layout';
import { PaepShellText } from '../shell/shell-text';
import { PaepShellNavModel, type PaepShellNavEntry, type PaepShellNavSection } from './nav-model';

/** Icon of each lock reason (HOF-IB3-001 SCR-SHELL-012). */
export const PAEP_SHELL_LOCK_ICONS: Readonly<Record<PaepShellLockReason, PaepIconName>> = {
  permission: 'lock',
  edition: 'edition',
  configuration: 'sliders',
  environment: 'device',
};

let nextNavId = 0;

/**
 * Primary navigation (HOF-IB3-001 E-03, SCR-SHELL-002/-006): groups as disclosures, links with `aria-current="page"`,
 * counts and locked items, in manifest order. `mode="persistent"` (≥ 1024 px) can be collapsed by the user to the
 * rail, whose group buttons open a flyout of links; `mode="sheet"` is the same list inside the navigation sheet.
 * Items are links, so there is no arrow-key roving. Locked items stay links to the explanation page; not-permitted
 * items are not shown (Q-10 A). Presentation only: the router and the server decide.
 */
@Component({
  selector: 'paep-shell-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink, PaepIcon, PaepIconButton, PaepCountBadge, PaepSkeleton],
  host: {
    class: 'paep-shell-nav',
    '[class.paep-shell-nav--rail]': 'rail()',
    '[attr.data-mode]': 'mode()',
    '(keydown.escape)': 'closeFlyout(true)',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    <nav [attr.aria-label]="text.t('paep.shell.nav.label')" [attr.id]="mode() === 'persistent' ? 'paep-shell-nav' : null">
      @if (mode() === 'persistent') {
        <div class="paep-shell-nav__head">
          <button
            #toggle
            paepIconButton
            icon="panel-start"
            class="paep-shell-nav__toggle"
            [label]="rail() ? text.t('paep.shell.nav.expand') : text.t('paep.shell.nav.collapse')"
            [attr.aria-expanded]="!rail()"
            (click)="toggleRail()"
          ></button>
        </div>
      }
      @if (!model.loaded()) {
        <div class="paep-shell-nav__loading" role="status" [attr.aria-label]="text.t('paep.shell.page.loading')">
          @for (row of skeletonRows; track row) {
            <paep-skeleton shape="text" />
          }
        </div>
      } @else if (rail()) {
        <ul class="paep-shell-nav__rail">
          @for (section of model.sections(); track section.id) {
            <li class="paep-shell-nav__rail-group">
              <button
                type="button"
                class="paep-shell-nav__rail-btn"
                [attr.aria-expanded]="flyout() === section.id"
                [attr.aria-controls]="flyout() === section.id ? flyoutId(section) : null"
                [attr.aria-current]="section.current ? 'true' : null"
                (click)="toggleFlyout(section.id)"
              >
                @if (section.icon) {
                  <svg [paepIcon]="section.icon"></svg>
                }
                <span class="paep-shell-nav__rail-label">{{ section.shortLabel }}</span>
              </button>
              @if (flyout() === section.id) {
                <div class="paep-shell-nav__flyout" [id]="flyoutId(section)">
                  <h2 class="paep-shell-nav__flyout-title">{{ section.label }}</h2>
                  <ng-container [ngTemplateOutlet]="items" [ngTemplateOutletContext]="{ $implicit: section.items }" />
                </div>
              }
            </li>
          }
        </ul>
      } @else {
        <ul class="paep-shell-nav__groups">
          @for (section of model.sections(); track section.id) {
            <li class="paep-shell-nav__group">
              <button
                type="button"
                class="paep-shell-nav__group-btn"
                [attr.aria-expanded]="isOpen(section.id)"
                [attr.aria-controls]="groupId(section)"
                (click)="toggleGroup(section.id)"
              >
                @if (section.icon) {
                  <svg [paepIcon]="section.icon"></svg>
                }
                <span class="paep-shell-nav__group-label">{{ section.label }}</span>
                <svg class="paep-shell-nav__chevron" [paepIcon]="isOpen(section.id) ? 'chevron-up' : 'chevron-down'"></svg>
              </button>
              <div [id]="groupId(section)" [hidden]="!isOpen(section.id)">
                <ng-container [ngTemplateOutlet]="items" [ngTemplateOutletContext]="{ $implicit: section.items }" />
              </div>
            </li>
          }
        </ul>
      }
    </nav>

    <ng-template #items let-list>
      <ul class="paep-shell-nav__items">
        @for (item of asEntries(list); track item.id) {
          <li>
            <a
              class="paep-shell-nav__link"
              [class.paep-shell-nav__link--locked]="item.locked"
              [routerLink]="item.route"
              [attr.aria-current]="item.current ? 'page' : null"
              [attr.aria-label]="item.locked ? text.t('paep.shell.nav.locked', { label: item.label, reason: reasonText(item.locked) }) : null"
              (click)="closeFlyout(false)"
            >
              <span class="paep-shell-nav__label">{{ item.label }}</span>
              @if (item.locked; as reason) {
                <svg class="paep-shell-nav__meta" [paepIcon]="lockIcon(reason)"></svg>
              } @else if (item.count !== undefined && item.count !== 0) {
                <paep-count-badge class="paep-shell-nav__meta" [count]="item.count" [label]="text.t('paep.shell.nav.count')" />
              }
            </a>
            @if (item.children.length) {
              <div class="paep-shell-nav__children">
                <ng-container [ngTemplateOutlet]="items" [ngTemplateOutletContext]="{ $implicit: item.children }" />
              </div>
            }
          </li>
        }
      </ul>
    </ng-template>
  `,
  styleUrl: './nav.css',
})
export class PaepShellNav {
  protected readonly text = inject(PaepShellText);
  protected readonly model = inject(PaepShellNavModel);
  private readonly layout = inject(PaepShellLayout);
  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly id = `paep-shell-nav-${nextNavId++}`;
  private readonly toggleRef = viewChild<ElementRef<HTMLElement>>('toggle');

  /** `persistent` (sidebar or rail, ≥ 1024 px) or `sheet` (inside the navigation sheet). */
  readonly mode = input<'persistent' | 'sheet'>('persistent');

  protected readonly rail = computed(() => this.mode() === 'persistent' && this.layout.navCollapsed());
  protected readonly flyout = signal<string | null>(null);
  private readonly closedGroups = signal<ReadonlySet<string>>(new Set());
  protected readonly skeletonRows = [0, 1, 2, 3, 4, 5];

  constructor() {
    const onPointer = (e: PointerEvent) => {
      if (this.flyout() && e.target instanceof Node && !this.host.contains(e.target)) this.flyout.set(null);
    };
    this.document.addEventListener('pointerdown', onPointer, true);
    inject(DestroyRef).onDestroy(() => this.document.removeEventListener('pointerdown', onPointer, true));
  }

  /** Focuses the collapse toggle (used when the sheet closes at ≥ 1024 px). */
  focusToggle(): void {
    this.toggleRef()?.nativeElement.focus();
  }

  protected toggleRail(): void {
    this.flyout.set(null);
    this.layout.navCollapsed.update((v) => !v);
  }

  protected isOpen(id: string): boolean {
    return !this.closedGroups().has(id);
  }

  protected toggleGroup(id: string): void {
    this.closedGroups.update((set) => {
      const next = new Set(set);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  protected toggleFlyout(id: string): void {
    this.flyout.update((v) => (v === id ? null : id));
  }

  /** Closes the rail flyout; with `restore`, focus returns to its group button (Escape). */
  closeFlyout(restore: boolean): void {
    const open = this.flyout();
    if (!open) return;
    const button = this.host.querySelector<HTMLElement>(`[aria-controls="${this.id}-flyout-${open}"]`);
    this.flyout.set(null);
    if (restore) button?.focus();
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (this.flyout() && next instanceof Node && !this.host.contains(next)) this.flyout.set(null);
  }

  protected groupId(section: PaepShellNavSection): string {
    return `${this.id}-group-${section.id}`;
  }

  protected flyoutId(section: PaepShellNavSection): string {
    return `${this.id}-flyout-${section.id}`;
  }

  protected reasonText(reason: PaepShellLockReason): string {
    return this.text.t(`paep.shell.locked.${reason}`);
  }

  protected lockIcon(reason: PaepShellLockReason): PaepIconName {
    return PAEP_SHELL_LOCK_ICONS[reason];
  }

  protected asEntries(list: unknown): readonly PaepShellNavEntry[] {
    return list as readonly PaepShellNavEntry[];
  }
}
