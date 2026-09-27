import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  LOCALE_ID,
  afterNextRender,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_MESSAGES, paepFormat } from '../messages/messages';

type PaepPageEntry = { readonly kind: 'page'; readonly page: number } | { readonly kind: 'gap'; readonly page: number };

/**
 * Pagination for a bounded, server- or input-paged collection:
 * `<paep-pagination [(page)]="page" [pageCount]="20" [focusTarget]="caption" />`.
 * Renders buttons by default, or links when `pageHref` is given (links navigate natively and also emit
 * pageChange). Shows first, last and current ± 1 with gaps. Below a 36 rem container it switches to the
 * compact variant (Previous · "8 / 20" · Next). After a page change focus moves to `focusTarget`
 * (the paged region's caption or heading) so the new content is announced.
 */
@Component({
  selector: 'paep-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, PaepIcon],
  host: { class: 'paep-pagination' },
  template: `
    <nav [attr.aria-label]="navLabel()">
      <ul>
        <li>
          <ng-container
            [ngTemplateOutlet]="control"
            [ngTemplateOutletContext]="{ target: current() - 1, name: previousName(), disabled: current() <= 1, dir: 'previous' }"
          />
        </li>
        @for (e of entries(); track e.kind + e.page) {
          @if (e.kind === 'gap') {
            <li class="paep-pagination__gap" aria-hidden="true">…</li>
          } @else {
            <li class="paep-pagination__num">
              <ng-container
                [ngTemplateOutlet]="control"
                [ngTemplateOutletContext]="{ target: e.page, name: pageName(e.page), disabled: false, dir: '' }"
              />
            </li>
          }
        }
        <li class="paep-pagination__status">{{ compactText() }}</li>
        <li>
          <ng-container
            [ngTemplateOutlet]="control"
            [ngTemplateOutletContext]="{ target: current() + 1, name: nextName(), disabled: current() >= count(), dir: 'next' }"
          />
        </li>
        <li class="paep-pagination__summary">{{ summaryText() }}</li>
      </ul>
    </nav>

    <ng-template #control let-target="target" let-name="name" let-disabled="disabled" let-dir="dir">
      @if (pageHref(); as href) {
        @if (disabled) {
          <a class="paep-pagination__control" role="link" tabindex="0" aria-disabled="true" [attr.aria-label]="name">
            <ng-container [ngTemplateOutlet]="content" [ngTemplateOutletContext]="{ target, dir }" />
          </a>
        } @else {
          <a
            class="paep-pagination__control"
            [attr.href]="href(target)"
            [attr.aria-label]="name"
            [attr.aria-current]="!dir && target === current() ? 'page' : null"
            (click)="go(target)"
          >
            <ng-container [ngTemplateOutlet]="content" [ngTemplateOutletContext]="{ target, dir }" />
          </a>
        }
      } @else {
        <button
          type="button"
          class="paep-pagination__control"
          [attr.aria-label]="name"
          [attr.aria-disabled]="disabled ? 'true' : null"
          [attr.aria-current]="!dir && target === current() ? 'page' : null"
          (click)="disabled || go(target)"
        >
          <ng-container [ngTemplateOutlet]="content" [ngTemplateOutletContext]="{ target, dir }" />
        </button>
      }
    </ng-template>

    <ng-template #content let-target="target" let-dir="dir">
      @switch (dir) {
        @case ('previous') {
          <svg paepIcon="chevron-start"></svg><span class="paep-pagination__text">{{ previousText() }}</span>
        }
        @case ('next') {
          <span class="paep-pagination__text">{{ nextText() }}</span><svg paepIcon="chevron-end"></svg>
        }
        @default {
          {{ pageNumber(target) }}
        }
      }
    </ng-template>
  `,
  styleUrl: './pagination.css',
})
export class PaepPagination {
  private readonly messages = inject(PAEP_MESSAGES);
  private readonly locale = inject(LOCALE_ID);
  private readonly injector = inject(Injector);

  /** Current page (1-based). Two-way bindable; changes emit pageChange. */
  readonly page = model<number>(1);
  /** Total number of pages (at least 1). */
  readonly pageCount = input.required<number>();
  /** Builds a link URL per page; when absent the controls are buttons. */
  readonly pageHref = input<((page: number) => string) | null>(null);
  /** Element that receives focus after a page change (the paged region's caption or heading). */
  readonly focusTarget = input<HTMLElement | null | undefined>(undefined);
  /** Overrides for the navigation name and control texts (defaults paep.pagination.*). */
  readonly label = input<string>('');
  readonly previousLabel = input<string>('');
  readonly nextLabel = input<string>('');

  protected readonly count = computed(() => Math.max(1, Math.floor(this.pageCount() || 1)));
  protected readonly current = computed(() => Math.min(this.count(), Math.max(1, Math.floor(this.page() || 1))));
  protected readonly navLabel = computed(() => this.label() || this.messages['paep.pagination.label']);
  protected readonly previousText = computed(() => this.previousLabel() || this.messages['paep.pagination.previous']);
  protected readonly nextText = computed(() => this.nextLabel() || this.messages['paep.pagination.next']);
  // A consumer override of the visible text also becomes the accessible name, so the name contains the label (WCAG 2.5.3).
  protected readonly previousName = computed(() => this.previousLabel() || this.messages['paep.pagination.previousPage']);
  protected readonly nextName = computed(() => this.nextLabel() || this.messages['paep.pagination.nextPage']);
  protected readonly summaryText = computed(() =>
    paepFormat(this.messages['paep.pagination.summary'], { page: this.current(), pageCount: this.count() }, this.locale),
  );
  protected readonly compactText = computed(() =>
    paepFormat(this.messages['paep.pagination.compact'], { page: this.current(), pageCount: this.count() }, this.locale),
  );

  /** First, last and current ± 1; a gap replaces two or more skipped pages (a single skipped page is shown). */
  protected readonly entries = computed<readonly PaepPageEntry[]>(() => {
    const n = this.count();
    const c = this.current();
    const shown = new Set([1, n, c - 1, c, c + 1].filter((p) => p >= 1 && p <= n));
    const pages = [...shown].sort((a, b) => a - b);
    const out: PaepPageEntry[] = [];
    let prev = 0;
    for (const p of pages) {
      if (p - prev === 2) out.push({ kind: 'page', page: p - 1 });
      else if (p - prev > 2) out.push({ kind: 'gap', page: p - 1 });
      out.push({ kind: 'page', page: p });
      prev = p;
    }
    return out;
  });

  /** Visible page number in the active locale's digits and grouping. */
  protected pageNumber(p: number): string {
    return new Intl.NumberFormat(this.locale).format(p);
  }

  protected pageName(p: number): string {
    return paepFormat(this.messages[p === this.current() ? 'paep.pagination.currentPage' : 'paep.pagination.page'], { page: p }, this.locale);
  }

  protected go(target: number): void {
    if (target < 1 || target > this.count() || target === this.current()) return;
    this.page.set(target);
    const el = this.focusTarget();
    if (el) {
      afterNextRender(
        () => {
          if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
          el.focus();
        },
        { injector: this.injector },
      );
    }
  }
}
