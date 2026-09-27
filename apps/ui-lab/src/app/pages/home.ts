import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LAB_NAV } from '../app.routes';

@Component({
  selector: 'lab-home',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lab-page">
      <header>
        <h1 tabindex="-1">PAEP UI laboratory</h1>
        <p class="lab-lead">
          The permanent engineering documentation of the PAEP design foundations and reusable components. Every
          component appears with its purpose, variants, states, accessibility, responsive behaviour, RTL notes and
          evidence. Nothing here is a product workflow.
        </p>
      </header>
      <section aria-labelledby="lab-ia">
        <h2 id="lab-ia">Contents</h2>
        <div class="lab-grid">
          @for (group of nav; track group.heading) {
            <section class="lab-panel" [attr.aria-labelledby]="'lab-ia-' + $index">
              <h3 [id]="'lab-ia-' + $index">{{ group.heading }}</h3>
              <ul class="lab-list">
                @for (item of group.items; track item.path) {
                  <li><a [routerLink]="item.path" queryParamsHandling="preserve">{{ item.label }}</a></li>
                }
              </ul>
            </section>
          }
        </div>
      </section>
      <section aria-labelledby="lab-how" class="lab-panel">
        <h2 id="lab-how">How the laboratory is organised</h2>
        <ul class="lab-list">
          <li>The contents list sits at the inline start from 64em; below that it is a Contents disclosure.</li>
          <li>
            Specimen settings (density, direction, brand profile, reduced-motion simulation) apply to the whole page
            through root attributes, the mechanism products use, and are kept in the address so each state can be linked.
          </li>
          <li>
            Every component page follows the specimen template: purpose, examples, variants and states, keyboard,
            accessibility, responsive and localisation notes, and evidence.
          </li>
          <li>Responsive and 320 px, long content, RTL, brand override and table strategies are proof pages in their own right.</li>
        </ul>
      </section>
    </div>
  `,
})
export class LabHomePage {
  protected readonly nav = LAB_NAV.filter((g) => g.heading !== 'Overview');
}
