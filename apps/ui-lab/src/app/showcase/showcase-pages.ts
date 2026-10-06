import { ChangeDetectionStrategy, Component, DOCUMENT, ElementRef, computed, effect, inject, input, viewChild } from '@angular/core';
import { Routes } from '@angular/router';
import { LabSettings } from '../lab/lab-settings';
import { SHOWCASE_PREVIEW } from './showcase-mode';

/*
 * Enterprise-shell showcase (IB3 AC-IB3-14): one lab page per shell part, inside the lab chrome. Each page shows the
 * real shell in a live preview document (an iframe of this lab under /showcase/preview/), so the preview has its own
 * banner, navigation, main and h1 and the lab page keeps exactly one of each.
 */

interface LabPreview {
  /** Preview path below the preview prefix, with an optional query. */
  readonly path: string;
  readonly title: string;
  /** Narrow previews are 20 rem wide, which shows the layout below the 40 em breakpoint. */
  readonly narrow?: boolean;
}

export interface LabShowcasePart {
  readonly id: string;
  /** HOF-IB3-001 component-map row. */
  readonly ref: string;
  readonly name: string;
  readonly symbol: string;
  readonly selector: string;
  readonly purpose: string;
  readonly keyboard: readonly string[];
  readonly accessibility: readonly string[];
  readonly previews: readonly LabPreview[];
}

const WORKSPACE: LabPreview = { path: 'workspace', title: 'Shell preview: workspace' };
const WORKSPACE_NARROW: LabPreview = { path: 'workspace', title: 'Shell preview: workspace, narrow', narrow: true };

export const LAB_SHOWCASE_PARTS: readonly LabShowcasePart[] = [
  {
    id: 'shell',
    ref: 'E-01',
    name: 'Shell frame',
    symbol: 'PaepShell',
    selector: 'paep-shell',
    purpose: 'The application frame: skip link, banner, status strip, navigation, the main slot, overlays and live regions.',
    keyboard: ['Tab from the top reaches the skip link first; it moves focus to the page heading.'],
    accessibility: ['One banner, one navigation landmark and the host’s main.', 'Polite and assertive live regions for route and state changes.'],
    previews: [WORKSPACE, WORKSPACE_NARROW],
  },
  {
    id: 'topbar',
    ref: 'E-02',
    name: 'Topbar',
    symbol: 'PaepShellTopbar',
    selector: 'paep-shell-topbar',
    purpose: 'Product, environment badge, context, the search trigger and the global actions, in the approved overflow order.',
    keyboard: ['Ctrl+K or ⌘K opens search from anywhere in the shell.', 'Every control is a native button or link in reading order.'],
    accessibility: ['The product link, search and navigation toggle are never hidden at 320 CSS px or 400 % zoom.', 'Targets are at least 24 × 24 CSS px.'],
    previews: [WORKSPACE, WORKSPACE_NARROW],
  },
  {
    id: 'navigation',
    ref: 'E-03',
    name: 'Navigation',
    symbol: 'PaepShellNav',
    selector: 'paep-shell-nav',
    purpose: 'Groups as disclosures, links with aria-current, counts, locked items and the collapsed rail with flyouts.',
    keyboard: ['Enter or Space opens and closes a group.', 'Locked items stay focusable and explain why they are locked.'],
    accessibility: ['Counts and lock reasons are part of the accessible name.', 'The rail shows labels on focus as well as on hover.'],
    previews: [WORKSPACE],
  },
  {
    id: 'navigation-sheet',
    ref: 'E-04',
    name: 'Navigation sheet',
    symbol: 'PaepShellNavSheet',
    selector: 'paep-shell-nav-sheet',
    purpose: 'The modal navigation below 64 em, built on PaepModalBase (not the drawer). Open it with the navigation button.',
    keyboard: ['Escape closes the sheet and focus returns to the navigation button.', 'Focus stays inside the sheet while it is open.'],
    accessibility: ['A modal dialog named “Navigation”.', 'Its slide-in stops under reduced motion.'],
    previews: [WORKSPACE_NARROW],
  },
  {
    id: 'page-frame',
    ref: 'E-05',
    name: 'Page frame',
    symbol: 'PaepPageFrame',
    selector: 'paep-page-frame',
    purpose: 'The page header with its h1, breadcrumbs, context line, status and actions; toolbar, content and aside regions.',
    keyboard: ['A route change moves focus to the page h1.'],
    accessibility: ['Exactly one h1 per page.', 'The aside stacks below the content at narrow widths.'],
    previews: [WORKSPACE, WORKSPACE_NARROW],
  },
  {
    id: 'command-palette',
    ref: 'E-06',
    name: 'Command palette',
    symbol: 'PaepCommandPalette',
    selector: 'paep-command-palette',
    purpose: 'Search across Go to, Actions and Records. In the preview, select Search or press Ctrl+K; try “record”, “partial” or “unavailable”.',
    keyboard: ['Arrow keys move through results; Enter opens one.', 'Escape clears the query first, then closes.'],
    accessibility: ['A combobox with a listbox of grouped options.', 'The result count is announced politely; a failure is an alert with a reference.'],
    previews: [WORKSPACE],
  },
  {
    id: 'context-switcher',
    ref: 'E-08',
    name: 'Context switcher',
    symbol: 'PaepContextSwitcher',
    selector: 'paep-context-switcher',
    purpose: 'The current organisation and site, and a request dialog. Organisation B is accepted after a delay; any other is rejected.',
    keyboard: ['The dialog opens on the current context; Escape cancels.'],
    accessibility: ['Pending and rejected outcomes are announced; a rejection shows its reference.'],
    previews: [WORKSPACE],
  },
  {
    id: 'locked-state',
    ref: 'E-10',
    name: 'Locked state',
    symbol: 'PaepLockedState',
    selector: 'paep-locked-state',
    purpose: 'Explains why a page is unavailable, for the four reasons: permission, edition, configuration and environment.',
    keyboard: ['The page heading takes focus; the next step is a link or button.'],
    accessibility: ['It explains only: nothing is enforced on the client.'],
    previews: [{ path: 'locked/permission', title: 'Shell preview: locked page' }],
  },
  {
    id: 'error-boundary',
    ref: 'E-11a',
    name: 'Error boundary',
    symbol: 'PaepErrorBoundary',
    selector: 'paep-error-boundary',
    purpose: 'A page that fails to render is replaced by a recoverable error with a support reference. “Try again” renders it.',
    keyboard: ['Focus moves to the error heading; Try again and Go to home are buttons and links.'],
    accessibility: ['No raw error text reaches the page or the report.'],
    previews: [{ path: 'error', title: 'Shell preview: error boundary' }],
  },
  {
    id: 'not-found',
    ref: 'E-11b',
    name: 'Not found',
    symbol: 'PaepNotFound',
    selector: 'paep-not-found',
    purpose: 'The page shown for an unknown address, with a way back home.',
    keyboard: ['Focus moves to the heading.'],
    accessibility: ['The document title says the page was not found.'],
    previews: [{ path: 'no-such-page', title: 'Shell preview: page not found' }],
  },
  {
    id: 'status-strip',
    ref: 'E-12',
    name: 'Status strip',
    symbol: 'PaepStatusStrip',
    selector: 'paep-shell-status-strip',
    purpose: 'Connectivity, environment and session states below the topbar; several rows collapse behind “more” at narrow widths.',
    keyboard: ['Row actions are buttons in reading order.'],
    accessibility: ['Every state has an icon and text, never colour alone; changes are announced.'],
    previews: [
      { path: 'workspace?connectivity=offline', title: 'Shell preview: offline' },
      { path: 'workspace?connectivity=offline', title: 'Shell preview: offline, narrow', narrow: true },
    ],
  },
  {
    id: 'preferences',
    ref: 'E-13',
    name: 'Shell preferences',
    symbol: 'PaepShellPreferences',
    selector: 'paep-shell-preferences',
    purpose: 'Session-only preferences, such as the collapsed navigation. Nothing is stored.',
    keyboard: ['A modal dialog; Escape closes it and focus returns to its trigger.'],
    accessibility: ['Native checkbox and radio controls with visible labels.'],
    previews: [WORKSPACE],
  },
  {
    id: 'route-focus',
    ref: 'E-14',
    name: 'Route focus',
    symbol: 'PaepRouteFocus',
    selector: '(service)',
    purpose: 'After every navigation, focus moves to the new page’s h1 and the page title is announced. Use the preview navigation.',
    keyboard: ['After a route change, Tab continues from the page heading.'],
    accessibility: ['Composes PaepAnnouncer; announcements are polite.'],
    previews: [WORKSPACE],
  },
];

/** Sets an iframe's address from the fixed preview table (always below the preview prefix of this lab). */
@Component({
  selector: 'lab-showcase-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<iframe #frame class="lab-showcase__frame" [class.lab-showcase__frame--narrow]="preview().narrow" [title]="preview().title"></iframe>`,
  styles: `
    :host { display: block; }
    .lab-showcase__frame {
      display: block;
      inline-size: 100%;
      block-size: 36rem;
      border: var(--paep-border-width-default) solid var(--paep-color-border);
      border-radius: var(--paep-radius-md);
      background: var(--paep-color-bg-page);
    }
    .lab-showcase__frame--narrow { inline-size: min(100%, 20rem); }
  `,
})
export class LabShowcasePreview {
  readonly preview = input.required<LabPreview>();
  private readonly settings = inject(LabSettings);
  private readonly frame = viewChild.required<ElementRef<HTMLIFrameElement>>('frame');
  private readonly document = inject(DOCUMENT);

  constructor() {
    effect(() => {
      const [path, query = ''] = this.preview().path.split('?');
      const q = new URLSearchParams(query);
      for (const [k, v] of Object.entries(this.settings.query())) if (v) q.set(k, v);
      const frame = this.frame().nativeElement;
      const address = `${SHOWCASE_PREVIEW}/${path}${q.size ? `?${q}` : ''}`;
      if (/^\/showcase\/preview\/[a-z/-]+(\?[a-z0-9=&-]*)?$/.test(address)) frame.src = new URL(address.slice(1), this.document.baseURI).href;
    });
  }
}

@Component({
  selector: 'lab-showcase-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabShowcasePreview],
  template: `
    @if (entry(); as p) {
      <article class="lab-page" [attr.aria-labelledby]="'lab-title-' + p.id">
        <header>
          <p class="lab-meta">Enterprise shell · {{ p.ref }}</p>
          <h1 [id]="'lab-title-' + p.id" tabindex="-1">{{ p.name }}</h1>
          <p class="lab-lead">{{ p.purpose }}</p>
          <p class="lab-meta"><code>{{ p.symbol }}</code> · <code>{{ p.selector }}</code> · from <code>&#64;proseit/paep-enterprise</code></p>
        </header>
        <section aria-labelledby="lab-preview">
          <h2 id="lab-preview">Live preview</h2>
          <p>The real shell with neutral sample data. The lab’s density, direction, brand and motion settings apply to the preview.</p>
          @for (v of p.previews; track v.title) {
            <h3>{{ v.narrow ? 'Narrow (20 rem)' : 'Full width' }}</h3>
            <lab-showcase-preview [preview]="v" />
          }
        </section>
        <section aria-labelledby="lab-a11y">
          <h2 id="lab-a11y">Accessibility</h2>
          <h3>Keyboard</h3>
          <ul class="lab-list">
            @for (k of p.keyboard; track k) {
              <li>{{ k }}</li>
            }
          </ul>
          <h3>Semantics and focus</h3>
          <ul class="lab-list">
            @for (a of p.accessibility; track a) {
              <li>{{ a }}</li>
            }
          </ul>
        </section>
        <section aria-labelledby="lab-evidence">
          <h2 id="lab-evidence">Evidence</h2>
          <p>
            Behaviour tests: <code>npm run test:enterprise</code>. Browser gate on the reference application at seven viewports,
            200 % and 400 % zoom, LTR and RTL: <code>npm run qa:shell</code>. This page and its preview: <code>npm run qa:accessibility</code>.
          </p>
        </section>
      </article>
    }
  `,
})
export class LabShowcasePage {
  /** Route parameter. */
  readonly part = input<string>('');
  protected readonly entry = computed(() => LAB_SHOWCASE_PARTS.find((p) => p.id === this.part()) ?? null);
}

export const LAB_SHOWCASE_ROUTES: Routes = LAB_SHOWCASE_PARTS.map((p) => ({
  path: p.id,
  component: LabShowcasePage,
  data: { part: p.id },
  title: `${p.name} · Enterprise shell · PAEP UI laboratory`,
}));
