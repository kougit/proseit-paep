import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaepDivider, PaepVerticalDivider } from './divider';

@Component({
  imports: [PaepDivider, PaepVerticalDivider],
  template: `
    <div [attr.data-paep-density]="density()">
      <p>First group</p>
      <hr paepDivider id="h" />
      <hr paepDivider inset decorative id="h2" />
      <p>Second group</p>
    </div>
    <div id="row" [style.inline-size]="rowWidth()" style="display: flex; flex-wrap: wrap; align-items: center">
      <span id="a">Filters applied: 3</span>
      <paep-divider vertical id="v" />
      <span id="b">Sorted by record name</span>
      <paep-divider vertical decorative id="v2" />
      <span>End</span>
    </div>
  `,
})
class DividerHost {
  readonly density = signal<'comfortable' | 'compact'>('comfortable');
  readonly rowWidth = signal('600px');
}

const settle = async (f: ComponentFixture<unknown>) => {
  f.detectChanges();
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 50));
  f.detectChanges();
};

describe('PaepDivider', () => {
  let fixture: ComponentFixture<DividerHost>;
  let host: DividerHost;
  const el = (id: string) => document.getElementById(id)!;
  const css = (id: string) => getComputedStyle(el(id));

  beforeEach(async () => {
    fixture = TestBed.createComponent(DividerHost);
    host = fixture.componentInstance;
    await settle(fixture);
  });

  afterEach(() => fixture.destroy());

  it('is a native thematic break drawn as a 1 px subtle line', () => {
    expect(el('h').tagName).toBe('HR');
    expect(el('h').hasAttribute('aria-hidden')).toBe(false);
    expect(css('h').borderTopWidth).toBe('1px');
    expect(css('h').borderBottomWidth).toBe('0px');
    const probe = document.createElement('div');
    probe.style.color = 'var(--paep-color-border-subtle)';
    document.body.appendChild(probe);
    expect(css('h').borderTopColor).toBe(getComputedStyle(probe).color);
    probe.remove();
  });

  it('is hidden from assistive technology when decorative and indents when inset', () => {
    expect(el('h2').getAttribute('aria-hidden')).toBe('true');
    expect(css('h2').marginInlineStart).toBe('16px');
    expect(css('h').marginInlineStart).toBe('0px');
  });

  it('uses 16 px margins, 12 px in compact density', async () => {
    expect(css('h').marginTop).toBe('16px');
    host.density.set('compact');
    await settle(fixture);
    expect(css('h').marginTop).toBe('12px');
  });

  it('vertical: separator with vertical orientation, or aria-hidden when decorative', () => {
    expect(el('v').getAttribute('role')).toBe('separator');
    expect(el('v').getAttribute('aria-orientation')).toBe('vertical');
    expect(el('v2').getAttribute('aria-hidden')).toBe('true');
    expect(el('v2').hasAttribute('role')).toBe(false);
    expect(css('v').borderInlineStartWidth).toBe('1px');
    expect(el('v').getBoundingClientRect().height).toBeGreaterThan(0);
  });

  it('vertical: hidden when the items on either side wrap onto different lines', async () => {
    expect(css('v').visibility).toBe('visible');
    host.rowWidth.set('140px');
    await settle(fixture);
    expect(el('b').getBoundingClientRect().top).toBeGreaterThanOrEqual(el('a').getBoundingClientRect().bottom - 1);
    expect(css('v').visibility).toBe('hidden');
    host.rowWidth.set('600px');
    await settle(fixture);
    expect(css('v').visibility).toBe('visible');
  });
});
