import { ChangeDetectionStrategy, Component, booleanAttribute, computed, inject, input, output } from '@angular/core';
import { PaepAlert, PaepBreadcrumb, PaepButton, PaepEmptyState, PaepSkeleton, type PaepBreadcrumbItem } from '@proseit/paep-components';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_SHELL_CONTEXT } from '../ports/ports';
import { PaepShellText } from '../shell/shell-text';

/** Content state of a page: the host renders its content only when `ready`. */
export type PaepPageState = 'ready' | 'loading' | 'empty' | 'error';

/**
 * Generic page frame (HOF-IB3-001 E-05, SCR-SHELL-011/-015): page header with breadcrumbs, the `h1` (tabindex −1, the
 * route-focus target), a context line, status and actions; an optional toolbar (filter) region; named extension
 * regions before and after the content; and an optional aside ("Details"), beside the content from 1440 px and
 * below it otherwise. Below 600 px the context line also shows the current tenant context (Q-07). No analytics.
 *
 * Slots: `[paepPageStatus]`, `[paepPageContext]`, `[paepPageActions]`, `[paepPageToolbar]`, `[paepPageBefore]`,
 * default content, `[paepPageAfter]`, `[paepPageAside]` (set `aside` to show the aside region) and
 * `[paepPageEmptyAction]` (the action of the empty state).
 *
 * Content states replace only the content, never the header: `loading`; `empty` (host heading, description and
 * action); `error`, an error alert with the host's heading and message, the correlation reference and "Try again"
 * when retryable (REQ-WORKSPACE-06). The error text comes from the host; raw error details never belong in it.
 */
@Component({
  selector: 'paep-page-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepAlert, PaepBreadcrumb, PaepButton, PaepEmptyState, PaepIcon, PaepSkeleton],
  host: { class: 'paep-page-frame' },
  template: `
    <div class="paep-page-frame__header">
      @if (breadcrumbs().length) {
        <paep-breadcrumb [items]="breadcrumbs()" [label]="text.t('paep.shell.breadcrumb.label')" />
      }
      <div class="paep-page-frame__titles-row">
        <div class="paep-page-frame__titles">
          <h1 class="paep-page-frame__title" tabindex="-1">{{ heading() }}</h1>
          <div class="paep-page-frame__context">
            @if (contextLine(); as ctx) {
              <span class="paep-page-frame__tenant">
                <svg paepIcon="building"></svg>
                <span><span class="paep-visually-hidden">{{ text.t('paep.shell.context.label') }}: </span>{{ ctx }}</span>
              </span>
            }
            <ng-content select="[paepPageStatus]" />
            <ng-content select="[paepPageContext]" />
          </div>
        </div>
        <div class="paep-page-frame__actions">
          <ng-content select="[paepPageActions]" />
        </div>
      </div>
    </div>
    <ng-content select="[paepPageToolbar]" />
    <div class="paep-page-frame__body" [class.paep-page-frame__body--aside]="aside()">
      <div class="paep-page-frame__content">
        <ng-content select="[paepPageBefore]" />
        @switch (state()) {
          @case ('loading') {
            <div class="paep-page-frame__loading" role="status">
              <span class="paep-visually-hidden">{{ text.t('paep.shell.page.loading') }}</span>
              <paep-skeleton shape="item" />
              <paep-skeleton shape="text" />
              <paep-skeleton shape="text" />
            </div>
          }
          @case ('empty') {
            <paep-empty-state kind="empty" [heading]="emptyHeading() || text.t('paep.shell.page.empty')" [description]="emptyDescription()" [headingLevel]="2">
              <ng-content select="[paepPageEmptyAction]" />
            </paep-empty-state>
          }
          @case ('error') {
            <paep-alert class="paep-page-frame__error" status="error" live [heading]="errorHeading()">
              @if (errorMessage()) {
                {{ errorMessage() }}
              }
              @if (errorReference(); as ref) {
                <span class="paep-page-frame__reference">{{ text.t('paep.shell.error.reference') }} <code dir="ltr">{{ ref }}</code>.</span>
              }
              @if (retryable()) {
                <button paepButton paepAlertActions icon="retry" (click)="retry.emit()">{{ text.t('paep.shell.error.retry') }}</button>
              }
            </paep-alert>
          }
          @default {
            <ng-content />
          }
        }
        <ng-content select="[paepPageAfter]" />
      </div>
      @if (aside()) {
        <aside class="paep-page-frame__aside" [attr.aria-label]="asideLabel() || text.t('paep.shell.page.aside')">
          <ng-content select="[paepPageAside]" />
        </aside>
      }
    </div>
  `,
  styleUrl: './page-frame.css',
})
export class PaepPageFrame {
  protected readonly text = inject(PaepShellText);
  private readonly context = inject(PAEP_SHELL_CONTEXT, { optional: true });

  /** The page title (`h1`); wraps, never truncates. */
  readonly heading = input.required<string>();
  /** Breadcrumb trail, only when the app's IA justifies it; the last item is the current page. */
  readonly breadcrumbs = input<readonly PaepBreadcrumbItem[]>([]);
  readonly state = input<PaepPageState>('ready');
  /** Heading of the empty state (default paep.shell.page.empty). */
  readonly emptyHeading = input<string>('');
  /** Description of the empty state; undefined keeps the component default, an empty string hides it. */
  readonly emptyDescription = input<string | undefined>(undefined);
  /** Heading of the error state, from the host (e.g. "Records could not be loaded"). */
  readonly errorHeading = input<string>('');
  /** Plain-language message of the error state, from the host. */
  readonly errorMessage = input<string>('');
  /** Correlation reference of the failure (shown left to right). */
  readonly errorReference = input<string>('');
  /** Offers "Try again" in the error state (only for retryable failures). */
  readonly retryable = input(true, { transform: booleanAttribute });
  /** Emits when "Try again" is activated in the error state. */
  readonly retry = output<void>();
  /** Shows the aside region. */
  readonly aside = input(false, { transform: booleanAttribute });
  /** Accessible name of the aside (default paep.shell.page.aside). */
  readonly asideLabel = input<string>('');

  /** Tenant and site of the current context (shown in the context line below 600 px). */
  protected readonly contextLine = computed(() => {
    const c = this.context?.current();
    return c ? [c.tenant.displayName, c.site].filter(Boolean).join(' · ') : null;
  });
}
