import { ChangeDetectionStrategy, Component, DOCUMENT, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { LAB_NAV } from './app.routes';
import { LabBrand, LabDensity, LabDirection, LabSettings } from './lab/lab-settings';

/**
 * PAEP UI laboratory frame (HOF-IB2-001 SCR-IB2-L01): a header with specimen settings, a contents list at the
 * inline start from 64em (a disclosure above the page below that) and the page. Deliberately not an
 * application shell: the enterprise shell is IB3.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  protected readonly settings = inject(LabSettings);
  protected readonly nav = LAB_NAV;
  protected readonly contentsOpen = signal(false);

  constructor() {
    this.settings.readFromQuery(this.document.location.search);
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.settings.readFromQuery(e.urlAfterRedirects.includes('?') ? e.urlAfterRedirects.slice(e.urlAfterRedirects.indexOf('?')) : '');
      this.contentsOpen.set(false);
      // Move focus to the new page's heading so keyboard and screen-reader users start at the content.
      if (e.id > 1) setTimeout(() => this.document.querySelector<HTMLElement>('main h1')?.focus());
    });
  }

  protected setDensity(value: string): void {
    this.settings.density.set(value as LabDensity);
    this.persist();
  }

  protected setDirection(value: string): void {
    this.settings.direction.set(value as LabDirection);
    this.persist();
  }

  protected setBrand(value: string): void {
    this.settings.brand.set(value as LabBrand);
    this.persist();
  }

  protected setReducedMotion(value: boolean): void {
    this.settings.reducedMotion.set(value);
    this.persist();
  }

  private persist(): void {
    this.settings.apply();
    void this.router.navigate([], { queryParams: this.settings.query(), replaceUrl: true });
  }
}
