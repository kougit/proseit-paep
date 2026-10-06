import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input, numberAttribute, output } from '@angular/core';
import { PaepIcon, PaepIconName } from '@proseit/paep-foundation';
import { PAEP_MESSAGES } from '../messages/messages';

/**
 * `empty`: the collection genuinely has no data. `no-results`: filters or search exclude every item.
 * `unavailable`: the content cannot be shown here (HOF-IB3-001 P-06); the host supplies the icon, the heading and the
 * reason line, and the state explains only (it never grants or denies access).
 */
export type PaepEmptyStateKind = 'empty' | 'no-results' | 'unavailable';
export type PaepHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * Explains why a collection has nothing to show and what to do next:
 * `<paep-empty-state kind="no-results" (action)="clearFilters()" />`.
 * The kinds differ in icon, heading and action; `unavailable` has no default text or action and adds a reason line
 * (`<paep-empty-state kind="unavailable" icon="lock" heading="Archive" reason="Not available to your role" />`).
 * Focus is never moved automatically; the host collection announces the state through its own live region.
 */
@Component({
  selector: 'paep-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepIcon],
  host: { class: 'paep-empty-state', '[attr.data-kind]': 'kind()' },
  template: `
    @if (iconName(); as name) {
      <svg [paepIcon]="name"></svg>
    }
    @switch (headingLevel()) {
      @case (2) { <h2 class="paep-empty-state__heading">{{ headingText() }}</h2> }
      @case (4) { <h4 class="paep-empty-state__heading">{{ headingText() }}</h4> }
      @case (5) { <h5 class="paep-empty-state__heading">{{ headingText() }}</h5> }
      @case (6) { <h6 class="paep-empty-state__heading">{{ headingText() }}</h6> }
      @default { <h3 class="paep-empty-state__heading">{{ headingText() }}</h3> }
    }
    @if (kind() === 'unavailable' && reason()) {
      <p class="paep-empty-state__unavailable-reason">{{ reason() }}</p>
    }
    @if (descriptionText()) {
      <p class="paep-empty-state__description">{{ descriptionText() }}</p>
    }
    @if (actionText()) {
      <button
        type="button"
        class="paep-empty-state__action"
        [disabled]="actionDisabled()"
        [attr.aria-describedby]="actionDisabled() && actionDisabledReason() ? reasonId : null"
        (click)="action.emit()"
      >
        {{ actionText() }}
      </button>
      @if (actionDisabled() && actionDisabledReason()) {
        <p class="paep-empty-state__reason" [id]="reasonId">{{ actionDisabledReason() }}</p>
      }
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--paep-space-2);
      padding: var(--paep-space-7) var(--paep-space-4);
      color: var(--paep-color-text-secondary);
      text-align: center;
      overflow-wrap: anywhere;
      container-type: inline-size;
    }
    svg {
      --paep-icon-size: var(--paep-space-7);
      color: var(--paep-color-icon-default);
    }
    .paep-empty-state__heading {
      margin: 0;
      max-inline-size: 36rem;
      color: var(--paep-color-text-primary);
      font-size: var(--paep-font-size-title-sm);
      line-height: var(--paep-line-height-title-sm);
      font-weight: var(--paep-font-weight-title-sm);
    }
    p {
      margin: 0;
      max-inline-size: 36rem;
    }
    .paep-empty-state__action {
      min-block-size: var(--paep-density-control-height);
      margin-block-start: var(--paep-space-2);
      padding: var(--paep-space-1) var(--paep-density-button-padding-inline);
      color: var(--paep-color-text-primary);
      background: var(--paep-color-surface);
      border: 1px solid var(--paep-color-border-strong);
      border-radius: var(--paep-radius-md);
      font: inherit;
      font-weight: var(--paep-font-weight-label);
      cursor: pointer;
    }
    .paep-empty-state__action:hover:not(:disabled) {
      background: var(--paep-color-hover-neutral);
    }
    .paep-empty-state__action:disabled {
      color: var(--paep-color-disabled-fg);
      background: var(--paep-color-disabled-bg);
      border-color: var(--paep-color-disabled-border);
      cursor: not-allowed;
    }
    .paep-empty-state__unavailable-reason {
      color: var(--paep-color-text-primary);
      font-weight: var(--paep-font-weight-label);
    }
    .paep-empty-state__reason {
      font-size: var(--paep-font-size-body-sm);
      line-height: var(--paep-line-height-body-sm);
    }
    @container (max-width: 20rem) {
      :host {
        padding: var(--paep-space-5) var(--paep-space-2);
      }
    }
  `,
})
export class PaepEmptyState {
  private static nextId = 0;
  private readonly messages = inject(PAEP_MESSAGES);
  protected readonly reasonId = `paep-empty-state-reason-${PaepEmptyState.nextId++}`;

  readonly kind = input<PaepEmptyStateKind>('empty');
  /** Heading level (2-6) chosen for the surrounding document outline. */
  readonly headingLevel = input<PaepHeadingLevel, unknown>(3, {
    transform: (v: unknown) => Math.min(6, Math.max(2, numberAttribute(v, 3))) as PaepHeadingLevel,
  });
  /** Overrides the heading (defaults paep.empty.title / paep.noResults.title); required for `unavailable`. */
  readonly heading = input<string>('');
  /**
   * Overrides the description (defaults paep.empty.body / paep.noResults.body; none for `unavailable`); an empty
   * string hides it.
   */
  readonly description = input<string | undefined>(undefined);
  /**
   * Action text. Undefined uses the default for the kind (no-results: "Clear filters"; empty: no action);
   * an empty string hides the action.
   */
  readonly actionLabel = input<string | undefined>(undefined);
  /** Disables the action (show why with actionDisabledReason); a usability hint, never the authorisation control. */
  readonly actionDisabled = input(false, { transform: booleanAttribute });
  readonly actionDisabledReason = input<string>('');
  /** `unavailable` only: the decorative icon of the reason, supplied by the host (e.g. lock, edition). */
  readonly icon = input<PaepIconName | undefined>(undefined);
  /** `unavailable` only: the reason line, e.g. "Not included in your edition". */
  readonly reason = input<string>('');

  /** Emits when the action button is activated. */
  readonly action = output<void>();

  protected readonly iconName = computed<PaepIconName | undefined>(() => {
    const kind = this.kind();
    return kind === 'unavailable' ? this.icon() : kind === 'no-results' ? 'no-results' : 'empty';
  });
  protected readonly headingText = computed(() => {
    if (this.heading() || this.kind() === 'unavailable') return this.heading();
    return this.messages[this.kind() === 'no-results' ? 'paep.noResults.title' : 'paep.empty.title'];
  });
  protected readonly descriptionText = computed(() => {
    const d = this.description();
    if (d !== undefined) return d;
    if (this.kind() === 'unavailable') return '';
    return this.messages[this.kind() === 'no-results' ? 'paep.noResults.body' : 'paep.empty.body'];
  });
  protected readonly actionText = computed(() => {
    const a = this.actionLabel();
    if (a !== undefined) return a;
    return this.kind() === 'no-results' ? this.messages['paep.noResults.clear'] : '';
  });
}
