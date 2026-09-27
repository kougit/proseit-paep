import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LabSpecimenMeta } from './specimen-meta';

/**
 * Specimen page frame. The specimen component projects its live examples:
 *   <lab-specimen-page [meta]="meta">
 *     <section labExample="Variants"> ... </section>
 *     <section labExample="States"> ... </section>
 *   </lab-specimen-page>
 * Every projected example must have an h3 heading; the frame supplies the h1/h2 structure and the
 * purpose, accessibility, responsive, RTL and evidence sections from the metadata.
 */
@Component({
  selector: 'lab-specimen-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="lab-specimen" [attr.aria-labelledby]="'lab-title-' + meta().id">
      <header class="lab-specimen__header">
        <p class="lab-specimen__family">{{ meta().family }}</p>
        <h1 [id]="'lab-title-' + meta().id" tabindex="-1">{{ meta().name }}</h1>
        <p class="lab-specimen__purpose">{{ meta().purpose }}</p>
        <p class="lab-specimen__selector"><code>{{ meta().selector }}</code></p>
      </header>

      <section class="lab-specimen__examples" aria-labelledby="lab-examples">
        <h2 id="lab-examples">Examples</h2>
        <ng-content />
      </section>

      <section aria-labelledby="lab-variants-states">
        <h2 id="lab-variants-states">Variants and states</h2>
        <dl class="lab-dl">
          <dt>Variants</dt>
          <dd>{{ meta().variants.join(', ') || 'None' }}</dd>
          <dt>States</dt>
          <dd>{{ meta().states.join(', ') }}</dd>
        </dl>
      </section>

      <section aria-labelledby="lab-a11y">
        <h2 id="lab-a11y">Accessibility</h2>
        <h3>Keyboard</h3>
        <ul>
          @for (k of meta().keyboard; track k) {
            <li>{{ k }}</li>
          }
        </ul>
        <h3>Semantics and focus</h3>
        <ul>
          @for (a of meta().accessibility; track a) {
            <li>{{ a }}</li>
          }
        </ul>
      </section>

      <section aria-labelledby="lab-responsive">
        <h2 id="lab-responsive">Responsive and localisation</h2>
        <dl class="lab-dl">
          <dt>Responsive</dt>
          <dd>{{ meta().responsive }}</dd>
          <dt>RTL</dt>
          <dd>{{ meta().rtl }}</dd>
          <dt>Content keys</dt>
          <dd>
            @for (k of meta().contentKeys; track k; let last = $last) {
              <code>{{ k }}</code>{{ last ? '' : ', ' }}
            } @empty {
              None
            }
          </dd>
        </dl>
      </section>

      <section aria-labelledby="lab-evidence">
        <h2 id="lab-evidence">Evidence</h2>
        <dl class="lab-dl">
          <dt>Behaviour tests</dt>
          <dd><code>{{ meta().unitTests }}</code> (npm run test:components)</dd>
          <dt>Accessibility</dt>
          <dd>axe-core, 320/834/1440 px, LTR and RTL, reduced motion (npm run qa:accessibility)</dd>
          <dt>Visual</dt>
          <dd>CANDIDATE captures under evidence/IB2-FOUNDATION-COMPONENTS/visual/ (not self-approved)</dd>
        </dl>
      </section>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }
    .lab-specimen {
      display: grid;
      gap: var(--paep-space-7);
      max-inline-size: var(--paep-layout-content-max);
    }
    .lab-specimen__family {
      margin: 0;
      color: var(--paep-color-text-secondary);
      font-size: var(--paep-font-size-body-sm);
      line-height: var(--paep-line-height-body-sm);
    }
    h1 {
      margin: 0;
      font-size: var(--paep-font-size-heading-1);
      line-height: var(--paep-line-height-heading-1);
      font-weight: var(--paep-font-weight-heading-1);
      letter-spacing: var(--paep-letter-spacing-heading-1);
    }
    h2 {
      margin: 0 0 var(--paep-space-3);
      font-size: var(--paep-font-size-heading-3);
      line-height: var(--paep-line-height-heading-3);
      font-weight: var(--paep-font-weight-heading-3);
    }
    h3 {
      margin: var(--paep-space-4) 0 var(--paep-space-2);
      font-size: var(--paep-font-size-title-sm);
      line-height: var(--paep-line-height-title-sm);
      font-weight: var(--paep-font-weight-title-sm);
    }
    .lab-specimen__purpose {
      margin: var(--paep-space-2) 0 0;
      max-inline-size: var(--paep-layout-reading-max);
      font-size: var(--paep-font-size-body-lg);
      line-height: var(--paep-line-height-body-lg);
    }
    .lab-specimen__selector {
      margin: var(--paep-space-2) 0 0;
    }
    .lab-dl {
      display: grid;
      grid-template-columns: minmax(0, 12rem) minmax(0, 1fr);
      gap: var(--paep-space-2) var(--paep-space-4);
      margin: 0;
    }
    .lab-dl dt {
      font-weight: var(--paep-font-weight-label);
    }
    .lab-dl dd {
      margin: 0;
    }
    @media (max-width: 37.4375em) {
      .lab-dl {
        grid-template-columns: minmax(0, 1fr);
      }
      .lab-dl dd {
        margin-block-end: var(--paep-space-2);
      }
    }
    ul {
      margin: 0;
      padding-inline-start: var(--paep-space-5);
    }
  `,
})
export class LabSpecimenPage {
  readonly meta = input.required<LabSpecimenMeta>();
}

/**
 * One live example block inside a specimen: <lab-example heading="Loading"> ... </lab-example>.
 * Renders an h3 and a bordered stage on the page surface.
 */
@Component({
  selector: 'lab-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3>{{ heading() }}</h3>
    <div class="lab-example__stage">
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-block-end: var(--paep-space-6);
    }
    h3 {
      margin: 0 0 var(--paep-space-3);
      font-size: var(--paep-font-size-title-sm);
      line-height: var(--paep-line-height-title-sm);
      font-weight: var(--paep-font-weight-title-sm);
    }
    .lab-example__stage {
      padding: var(--paep-space-5);
      background: var(--paep-color-surface);
      border: 1px solid var(--paep-color-border-subtle);
      border-radius: var(--paep-radius-lg);
      min-inline-size: 0;
    }
    @media (max-width: 37.4375em) {
      .lab-example__stage {
        padding: var(--paep-space-3);
      }
    }
  `,
})
export class LabExample {
  readonly heading = input.required<string>();
}
