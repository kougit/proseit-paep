import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { PaepShellContext } from '../ports/ports';
import { TEST_CONTEXTS, provideTestShell, settle, text } from '../testing/shell-testing';
import { PaepPageFrame, type PaepPageState } from './page-frame';

@Component({
  imports: [PaepPageFrame],
  template: `
    <paep-page-frame
      [heading]="heading()"
      [state]="state()"
      [breadcrumbs]="crumbs()"
      [aside]="aside()"
      [emptyDescription]="emptyDescription()"
      errorHeading="Records could not be loaded"
      errorMessage="The service did not respond."
      [errorReference]="reference()"
      [retryable]="retryable()"
      (retry)="retries = retries + 1"
    >
      <span paepPageStatus class="status">Draft</span>
      <button paepPageActions type="button">Act</button>
      <div paepPageToolbar class="toolbar">Filters</div>
      <div paepPageBefore class="before">Before</div>
      <p class="content">Content</p>
      <div paepPageAfter class="after">After</div>
      <p paepPageAside>Aside text</p>
      <button paepPageEmptyAction type="button" class="empty-action">New record</button>
    </paep-page-frame>
  `,
})
class FrameHost {
  readonly heading = signal('All records');
  readonly state = signal<PaepPageState>('ready');
  readonly crumbs = signal<{ label: string; href?: string }[]>([]);
  readonly aside = signal(false);
  readonly emptyDescription = signal<string | undefined>(undefined);
  readonly reference = signal('c0a8-7f3e-51d2');
  readonly retryable = signal(true);
  retries = 0;
}

describe('PaepPageFrame', () => {
  let fixture: ComponentFixture<FrameHost>;
  const current = signal<PaepShellContext | null>(TEST_CONTEXTS[0]);
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ...provideTestShell({ context: { current, available: signal(TEST_CONTEXTS), requestSwitch: async () => ({ status: 'accepted' }) } }),
      ],
    });
    fixture = TestBed.createComponent(FrameHost);
    await settle(fixture);
  });
  afterEach(() => fixture.destroy());

  it('renders the one page h1 as the route-focus target (tabindex -1) and projects the named regions in order', () => {
    const h1s = el().querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(text(h1s[0])).toBe('All records');
    expect(h1s[0].getAttribute('tabindex')).toBe('-1');
    const order = ['.toolbar', '.before', '.content', '.after'].map((s) => el().querySelector(s) as Element);
    for (let i = 1; i < order.length; i++) expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(el().querySelector('.paep-page-frame__actions button')).not.toBeNull();
    expect(el().querySelector('.paep-page-frame__context .status')).not.toBeNull();
  });

  it('shows breadcrumbs only when given, named "Breadcrumb"', async () => {
    expect(el().querySelector('paep-breadcrumb')).toBeNull();
    fixture.componentInstance.crumbs.set([{ label: 'Home', href: '#home' }, { label: 'All records' }]);
    await settle(fixture);
    expect(el().querySelector('paep-breadcrumb nav')?.getAttribute('aria-label')).toBe('Breadcrumb');
  });

  it('replaces the content with a loading status or the empty state, keeping the header', async () => {
    fixture.componentInstance.state.set('loading');
    await settle(fixture);
    expect(el().querySelector('.content')).toBeNull();
    expect(text(el().querySelector('[role="status"]'))).toContain('Loading page…');
    fixture.componentInstance.state.set('empty');
    await settle(fixture);
    expect(text(el().querySelector('paep-empty-state h2'))).toBe('Nothing here yet');
    expect(text(el().querySelector('h1'))).toBe('All records');
  });

  it('shows the host empty description and action, or no description when it is empty text', async () => {
    fixture.componentInstance.state.set('empty');
    fixture.componentInstance.emptyDescription.set('Records you create appear here.');
    await settle(fixture);
    expect(text(el().querySelector('.paep-empty-state__description'))).toBe('Records you create appear here.');
    expect(text(el().querySelector('paep-empty-state .empty-action'))).toBe('New record');
    fixture.componentInstance.emptyDescription.set('');
    await settle(fixture);
    expect(el().querySelector('.paep-empty-state__description')).toBeNull();
  });

  it('replaces the content with an error alert: host text, the reference left to right and Try again only when retryable', async () => {
    fixture.componentInstance.state.set('error');
    await settle(fixture);
    const alert = el().querySelector<HTMLElement>('paep-alert')!;
    expect(el().querySelector('.content')).toBeNull();
    expect(alert.getAttribute('role')).toBe('alert');
    expect(text(alert)).toContain('Records could not be loaded');
    expect(text(alert)).toContain('The service did not respond.');
    expect(alert.querySelector('code')?.getAttribute('dir')).toBe('ltr');
    expect(text(alert.querySelector('code'))).toBe('c0a8-7f3e-51d2');
    const retry = [...alert.querySelectorAll('button')].find((b) => text(b) === 'Try again')!;
    retry.click();
    expect(fixture.componentInstance.retries).toBe(1);
    expect(text(el().querySelector('h1'))).toBe('All records');
    fixture.componentInstance.retryable.set(false);
    await settle(fixture);
    expect([...el().querySelectorAll('paep-alert button')].some((b) => text(b) === 'Try again')).toBe(false);
  });

  it('shows the aside as a complementary region named "Details" when enabled', async () => {
    expect(el().querySelector('aside')).toBeNull();
    fixture.componentInstance.aside.set(true);
    await settle(fixture);
    expect(el().querySelector('aside')?.getAttribute('aria-label')).toBe('Details');
    expect(text(el().querySelector('aside'))).toBe('Aside text');
  });

  it('carries the current tenant context line for narrow layouts, with a hidden "Current context" prefix', () => {
    const tenant = el().querySelector('.paep-page-frame__tenant') as HTMLElement;
    expect(text(tenant)).toBe('Current context: Northwind Holdings · Site 04');
    expect(text(tenant.querySelector('.paep-visually-hidden'))).toBe('Current context:');
  });

  it('wraps a long unbroken title instead of overflowing', async () => {
    fixture.nativeElement.style.inlineSize = '320px';
    fixture.componentInstance.heading.set('X'.repeat(120));
    await settle(fixture);
    const h1 = el().querySelector('h1') as HTMLElement;
    expect(h1.scrollWidth).toBeLessThanOrEqual(h1.clientWidth + 1);
  });
});
