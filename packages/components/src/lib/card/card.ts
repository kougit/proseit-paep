import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

let nextCardId = 0;

/** Heading levels a card or panel title can use (the page supplies h1); same values as PaepHeadingLevel. */
export type PaepCardHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * Groups a self-contained unit of related content: `<paep-card heading="Summary" [headingLevel]="3">body</paep-card>`.
 * A `<section>` labelled by its heading. Slots: `[paepCardActions]` (header, inline-end; wraps under the
 * title below 30 rem), default (body) and `[paepCardFooter]`. Cards are not interactive: no hover effect.
 */
@Component({
  selector: 'paep-card',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="paep-card" [attr.aria-labelledby]="heading() ? headingId : null">
      @if (heading()) {
        <div class="paep-card__head">
          <div class="paep-card__titles">
            <ng-template #title>{{ heading() }}</ng-template>
            @switch (headingLevel()) {
              @case (2) {
                <h2 class="paep-card__title" [id]="headingId"><ng-container [ngTemplateOutlet]="title" /></h2>
              }
              @case (4) {
                <h4 class="paep-card__title" [id]="headingId"><ng-container [ngTemplateOutlet]="title" /></h4>
              }
              @case (5) {
                <h5 class="paep-card__title" [id]="headingId"><ng-container [ngTemplateOutlet]="title" /></h5>
              }
              @case (6) {
                <h6 class="paep-card__title" [id]="headingId"><ng-container [ngTemplateOutlet]="title" /></h6>
              }
              @default {
                <h3 class="paep-card__title" [id]="headingId"><ng-container [ngTemplateOutlet]="title" /></h3>
              }
            }
            @if (description()) {
              <p class="paep-card__description">{{ description() }}</p>
            }
          </div>
          <div class="paep-card__actions"><ng-content select="[paepCardActions]" /></div>
        </div>
      }
      <div class="paep-card__body"><ng-content /></div>
      <div class="paep-card__foot"><ng-content select="[paepCardFooter]" /></div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
      min-inline-size: 0;
    }
    .paep-card {
      display: flex;
      flex-direction: column;
      gap: var(--paep-space-3);
      padding: var(--paep-density-card-padding);
      color: var(--paep-color-text-primary);
      background: var(--paep-color-surface);
      border: 1px solid var(--paep-color-border-subtle);
      border-radius: var(--paep-radius-md);
      box-shadow: var(--paep-elevation-1);
    }
    .paep-card__head {
      display: flex;
      gap: var(--paep-space-2) var(--paep-space-4);
      align-items: flex-start;
      justify-content: space-between;
    }
    .paep-card__titles {
      flex: 1 1 0;
      min-inline-size: 0;
    }
    .paep-card__title {
      margin: 0;
      overflow-wrap: anywhere;
      font-size: var(--paep-font-size-title-sm);
      line-height: var(--paep-line-height-title-sm);
      font-weight: var(--paep-font-weight-title-sm);
    }
    .paep-card__description {
      margin: var(--paep-space-1) 0 0;
      color: var(--paep-color-text-secondary);
      font-size: var(--paep-font-size-body-sm);
      line-height: var(--paep-line-height-body-sm);
    }
    .paep-card__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--paep-space-2);
    }
    .paep-card__body {
      min-inline-size: 0;
      overflow-wrap: break-word;
    }
    .paep-card__foot {
      display: flex;
      flex-wrap: wrap;
      gap: var(--paep-space-2);
      padding-block-start: var(--paep-space-3);
      border-block-start: 1px solid var(--paep-color-border-subtle);
    }
    .paep-card__actions:empty,
    .paep-card__foot:empty {
      display: none;
    }
    @container (max-width: 30rem) {
      .paep-card {
        padding: var(--paep-space-4);
      }
      .paep-card__head {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `,
})
export class PaepCard {
  /** Title text; when set, the card is a section labelled by this heading. */
  readonly heading = input<string>();
  /** Heading level of the title (default 3). */
  readonly headingLevel = input<PaepCardHeadingLevel>(3);
  /** Optional one-line description under the title. */
  readonly description = input<string>();

  protected readonly headingId = `paep-card-${nextCardId++}-heading`;
}
