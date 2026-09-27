import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PAEP_TOKENS, PAEP_TOKEN_VERSION, PaepTokenCategory } from '@proseit/paep-foundation';

/** Token catalogue (IB2-AC13): every token with value, compact value, layer, protection, overridability and version. */
@Component({
  selector: 'lab-tokens',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lab-page">
      <header>
        <h1 tabindex="-1">Token catalogue</h1>
        <p class="lab-lead">
          {{ tokens.length }} tokens, catalogue version {{ version }} (HOF-IB2-001 v1.1). Components use semantic and
          brand tokens only; reference tokens are foundation-internal.
        </p>
      </header>
      <section class="lab-panel" aria-labelledby="lab-override">
        <h2 id="lab-override">Override rules</h2>
        <ul class="lab-list">
          <li>Only the seven <code>--paep-brand-*</code> tokens are overridable, and only through a validated brand profile (applyBrandProfile).</li>
          <li>Status, text, surface, focus, invalid, disabled, read-only and scrim tokens are protected: no profile, product or edition may change them.</li>
          <li>Density tokens change only through <code>data-paep-density</code>; motion tokens become 0 ms under reduced motion.</li>
          <li>Deprecation history: none. Every token was introduced in {{ version }}; a later change to a protected token's meaning requires release notes.</li>
        </ul>
      </section>
      <section aria-labelledby="lab-catalogue">
        <h2 id="lab-catalogue">Catalogue</h2>
        <div class="lab-field lab-filter">
          <label for="lab-token-category">Category</label>
          <select id="lab-token-category" [value]="category()" (change)="category.set($any($event.target).value)">
            <option value="all">All categories</option>
            @for (c of categories; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </div>
        <div class="lab-scroll" role="region" aria-labelledby="lab-token-caption" tabindex="0">
          <table class="lab-table">
            <caption id="lab-token-caption">Design tokens ({{ shown().length }} shown)</caption>
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col">Value</th>
                <th scope="col">Compact</th>
                <th scope="col">Layer</th>
                <th scope="col">Protected</th>
                <th scope="col">Overridable</th>
                <th scope="col">Since</th>
              </tr>
            </thead>
            <tbody>
              @for (t of shown(); track t.name) {
                <tr>
                  <th scope="row"><code>{{ t.name }}</code></th>
                  <td>
                    @if (t.category === 'color' || t.category === 'status' || t.category === 'brand') {
                      <span class="lab-swatch" [style.background]="'var(' + t.name + ')'" aria-hidden="true"></span>
                    }
                    <code>{{ t.value }}</code>
                  </td>
                  <td><code>{{ t.compact ?? '' }}</code></td>
                  <td>{{ t.layer }}</td>
                  <td>{{ t.protected ? 'Yes' : 'No' }}</td>
                  <td>{{ t.overridable ? 'Yes' : 'No' }}</td>
                  <td>{{ t.since }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: `
    .lab-filter {
      max-inline-size: 16rem;
      margin-block-end: var(--paep-space-3);
    }
  `,
})
export class LabTokensPage {
  protected readonly tokens = PAEP_TOKENS;
  protected readonly version = PAEP_TOKEN_VERSION;
  protected readonly categories = [...new Set(PAEP_TOKENS.map((t) => t.category))] as PaepTokenCategory[];
  protected readonly category = signal<string>('all');
  protected readonly shown = computed(() => (this.category() === 'all' ? this.tokens : this.tokens.filter((t) => t.category === this.category())));
}
