import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  untracked,
} from '@angular/core';
import { PaepIcon, PaepIconName } from '@proseit/paep-foundation';
import { PaepAlert } from '../alert/alert';
import { PaepEmptyState, PaepHeadingLevel } from '../empty-state/empty-state';
import { PAEP_MESSAGES } from '../messages/messages';
import { PaepSkeleton } from '../skeleton/skeleton';
import { PaepStatusBadge, PaepStatusTone } from '../status-badge/status-badge';

/** State of a bounded collection shown by the list or the table shell. */
export type PaepCollectionState = 'loading' | 'empty' | 'no-results' | 'error' | 'populated';

/** One list item. All text is consumer-provided (already localised). */
export interface PaepListItem {
  /** Stable identity used for tracking. */
  readonly id: string;
  /** Primary text; rendered as a link when `href` is set. */
  readonly primary: string;
  readonly href?: string;
  readonly secondary?: string;
  /** Optional decorative leading icon. */
  readonly icon?: PaepIconName;
  /** Trailing meta text (for example a formatted number). */
  readonly meta?: string;
  /** Renders `meta` with tabular numbers. */
  readonly metaNumeric?: boolean;
  /** Trailing status badge. */
  readonly status?: { readonly tone: PaepStatusTone; readonly label: string };
  /** Text of an optional per-item action button; activation emits itemAction. */
  readonly actionLabel?: string;
}

/**
 * Vertical collection where column comparison is not needed: `<paep-list [items]="items" state="populated" />`.
 * Handles loading (skeleton items, aria-busy, hidden loading text), empty, no-results, error (alert with Retry)
 * and populated states; state changes are announced through a polite live region and never move focus,
 * except that after Retry focus moves to `focusTarget` (the list's heading) once loading ends.
 * Renders every item it is given: keep collections bounded (page them with paep-pagination).
 */
@Component({
  selector: 'paep-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon, PaepAlert, PaepEmptyState, PaepSkeleton, PaepStatusBadge],
  host: { class: 'paep-list' },
  template: `
    <div class="paep-list__region" [attr.aria-busy]="effectiveState() === 'loading' ? 'true' : null">
      @switch (effectiveState()) {
        @case ('loading') {
          <ul aria-hidden="true">
            @for (i of skeletonItems(); track i) {
              <li><paep-skeleton class="paep-list__main" shape="item" /></li>
            }
          </ul>
        }
        @case ('empty') {
          <paep-empty-state
            class="paep-list__state"
            kind="empty"
            [headingLevel]="headingLevel()"
            [heading]="emptyHeading()"
            [description]="emptyDescription()"
            [actionLabel]="emptyActionLabel() || ''"
            (action)="emptyAction.emit()"
          />
        }
        @case ('no-results') {
          <paep-empty-state
            class="paep-list__state"
            kind="no-results"
            [headingLevel]="headingLevel()"
            [heading]="noResultsHeading()"
            [description]="noResultsDescription()"
            (action)="clearFilters.emit()"
          />
        }
        @case ('error') {
          <div class="paep-list__error">
            <paep-alert status="error" live [heading]="errorHeadingText()">
              {{ errorMessageText() }}
              <button paepAlertActions type="button" class="paep-list__retry" (click)="onRetry()">
                <svg paepIcon="retry"></svg>{{ retryText() }}
              </button>
            </paep-alert>
          </div>
        }
        @default {
          <ul [attr.aria-label]="label() || null">
            @for (item of items(); track item.id) {
              <li>
                @if (item.icon) {
                  <svg class="paep-list__icon" [paepIcon]="item.icon"></svg>
                }
                <div class="paep-list__main">
                  @if (item.href) {
                    <a class="paep-list__primary" [href]="item.href">{{ item.primary }}</a>
                  } @else {
                    <span class="paep-list__primary">{{ item.primary }}</span>
                  }
                  @if (item.secondary) {
                    <span class="paep-list__secondary">{{ item.secondary }}</span>
                  }
                </div>
                @if (item.meta || item.status || item.actionLabel) {
                  <div class="paep-list__meta">
                    @if (item.status) {
                      <paep-status-badge [tone]="item.status.tone">{{ item.status.label }}</paep-status-badge>
                    }
                    @if (item.meta) {
                      <span [class.paep-list__numeric]="item.metaNumeric">{{ item.meta }}</span>
                    }
                    @if (item.actionLabel) {
                      <button type="button" class="paep-list__action" (click)="itemAction.emit(item)">{{ item.actionLabel }}</button>
                    }
                  </div>
                }
              </li>
            }
          </ul>
        }
      }
    </div>
    <p class="paep-visually-hidden" aria-live="polite" aria-atomic="true">{{ liveText() }}</p>
  `,
  styleUrl: './list.css',
})
export class PaepList {
  private readonly messages = inject(PAEP_MESSAGES);
  private readonly injector = inject(Injector);
  private retryPending = false;

  readonly items = input<readonly PaepListItem[]>([]);
  /** Collection state; 'populated' with no items renders the empty state. */
  readonly state = input<PaepCollectionState>('populated');
  /** Optional accessible name for the list. */
  readonly label = input<string>('');
  /** Skeleton items shown while loading (expected page size, 1-10). */
  readonly loadingItems = input(3, { transform: (v: unknown) => Math.min(10, Math.max(1, numberAttribute(v, 3))) });
  /** Heading level for the empty and no-results states. */
  readonly headingLevel = input<PaepHeadingLevel>(3);
  /** Receives focus after Retry once loading ends (the list's heading). */
  readonly focusTarget = input<HTMLElement | null | undefined>(undefined);
  /** Text overrides (defaults from content keys; product nouns belong to the consumer). */
  readonly loadingLabel = input<string>('');
  readonly emptyHeading = input<string>('');
  readonly emptyDescription = input<string | undefined>(undefined);
  /** Empty-state action text (for example "Create record"); no action when empty. */
  readonly emptyActionLabel = input<string>('');
  readonly noResultsHeading = input<string>('');
  readonly noResultsDescription = input<string | undefined>(undefined);
  readonly errorHeading = input<string>('');
  readonly errorMessage = input<string>('');

  readonly retry = output<void>();
  readonly emptyAction = output<void>();
  readonly clearFilters = output<void>();
  readonly itemAction = output<PaepListItem>();

  protected readonly effectiveState = computed<PaepCollectionState>(() =>
    this.state() === 'populated' && this.items().length === 0 ? 'empty' : this.state(),
  );
  protected readonly skeletonItems = computed(() => Array.from({ length: this.loadingItems() }, (_, i) => i));
  protected readonly retryText = computed(() => this.messages['paep.common.retry']);
  protected readonly errorHeadingText = computed(() => this.errorHeading() || this.messages['paep.table.errorTitle']);
  protected readonly errorMessageText = computed(() => this.errorMessage() || this.messages['paep.table.errorBody']);
  protected readonly liveText = computed(() => {
    switch (this.effectiveState()) {
      case 'loading':
        return this.loadingLabel() || this.messages['paep.common.loading'];
      case 'empty':
        return this.emptyHeading() || this.messages['paep.empty.title'];
      case 'no-results':
        return this.noResultsHeading() || this.messages['paep.noResults.title'];
      default:
        return '';
    }
  });

  constructor() {
    effect(() => {
      const s = this.effectiveState();
      untracked(() => {
        if (s === 'loading' || !this.retryPending) return;
        this.retryPending = false;
        const el = this.focusTarget();
        if (!el) return;
        afterNextRender(
          () => {
            if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
            el.focus();
          },
          { injector: this.injector },
        );
      });
    });
  }

  protected onRetry(): void {
    this.retryPending = true;
    this.retry.emit();
  }
}
