import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import {
  PAEP_BRAND_KEYS,
  PAEP_DEFAULT_BRAND,
  PAEP_ICONS,
  PAEP_TOKENS,
  PaepAnnouncer,
  PaepBrandProfileError,
  PaepIcon,
  applyBrandProfile,
  clearBrandProfile,
  contrastRatio,
  validateBrandProfile,
} from '@proseit/paep-foundation';

const PETROL = {
  primary: '#0B5E73',
  'primary-hover': '#094C5E',
  'primary-active': '#073C4A',
  'primary-subtle': '#E4F1F4',
  'on-primary': '#FFFFFF',
  accent: '#9ED6E0',
  'on-accent': '#1A1F26',
};
const YELLOW = { ...PAEP_DEFAULT_BRAND, primary: '#E9B308', 'primary-hover': '#E9B308', 'primary-active': '#E9B308', accent: '#E9B308', 'on-accent': '#FFFFFF' };
const rootStyle = () => getComputedStyle(document.documentElement);
const token = (name: string) => rootStyle().getPropertyValue(name).trim().replace(/\s+/g, ' ');

describe('foundation tokens', () => {
  it('loads every catalogued token with its approved value into the document', () => {
    const wrong = PAEP_TOKENS.filter((t) => token(t.name).toLowerCase() !== t.value.toLowerCase() && !t.value.startsWith('var('));
    expect(wrong.map((t) => `${t.name}=${token(t.name)} expected ${t.value}`)).toEqual([]);
    expect(PAEP_TOKENS.length).toBeGreaterThan(150);
  });

  it('marks only the seven brand tokens as overridable and every status, text, surface and focus token as protected', () => {
    expect(PAEP_TOKENS.filter((t) => t.overridable).map((t) => t.name)).toEqual(PAEP_BRAND_KEYS.map((k) => `--paep-brand-${k}`));
    for (const t of PAEP_TOKENS.filter((x) => /^--paep-color-(status|text|surface|focus|invalid|disabled|readonly|scrim|bg-page|border-default)/.test(x.name))) {
      expect(t.protected, t.name).toBe(true);
    }
    expect(new Set(PAEP_TOKENS.map((t) => t.name)).size).toBe(PAEP_TOKENS.length);
    expect(PAEP_TOKENS.every((t) => t.since === '1.0.0')).toBe(true);
  });

  it('applies compact density values and keeps comfortable as the default', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(getComputedStyle(el).getPropertyValue('--paep-density-control-height').trim()).toBe('40px');
    el.setAttribute('data-paep-density', 'compact');
    const coarse = matchMedia('(pointer: coarse)').matches;
    expect(getComputedStyle(el).getPropertyValue('--paep-density-control-height').trim()).toBe(coarse ? '40px' : '32px');
    expect(getComputedStyle(el).getPropertyValue('--paep-density-row-height').trim()).toBe('36px');
    el.remove();
  });
});

describe('contrast', () => {
  it('computes WCAG ratios matching the handoff evidence', () => {
    expect(contrastRatio('#FFFFFF', '#24364B')).toBeCloseTo(12.32, 1);
    expect(contrastRatio('#1A1F26', '#D4A62A')).toBeCloseTo(7.32, 1);
    expect(contrastRatio('#FFFFFF', '#D4A62A')).toBeCloseTo(2.26, 1);
  });

  it('every approved text pair meets 4.5:1 and every non-text pair 3:1', () => {
    const v = (n: string) => PAEP_TOKENS.find((t) => t.name === n)!.value;
    const text: [string, string][] = [
      ['--paep-color-text-primary', '--paep-color-surface'],
      ['--paep-color-text-secondary', '--paep-color-surface'],
      ['--paep-color-text-secondary', '--paep-color-bg-page'],
      ['--paep-color-text-secondary', '--paep-color-surface-subtle'],
      ['--paep-color-text-primary', '--paep-color-bg-page'],
      ['--paep-color-invalid-fg', '--paep-color-surface'],
      ['--paep-color-text-inverse', '--paep-color-status-error-strong'],
      ['--paep-color-text-inverse', '--paep-color-destructive-hover'],
      ['--paep-color-text-inverse', '--paep-color-destructive-active'],
      ['--paep-brand-on-primary', '--paep-brand-primary'],
      ['--paep-brand-primary', '--paep-brand-primary-subtle'],
      ['--paep-brand-on-accent', '--paep-brand-accent'],
      ...(['success', 'warning', 'error', 'info', 'neutral'] as const).flatMap((s): [string, string][] => [
        [`--paep-color-status-${s}-fg`, `--paep-color-status-${s}-bg`],
        ['--paep-color-text-primary', `--paep-color-status-${s}-bg`],
      ]),
    ];
    const nonText: [string, string][] = [
      ['--paep-color-border-default', '--paep-color-surface'],
      ['--paep-color-border-default', '--paep-color-bg-page'],
      ['--paep-color-border-default', '--paep-color-surface-subtle'],
      ['--paep-color-readonly-border', '--paep-color-surface'],
      ['--paep-color-focus-ring', '--paep-color-surface'],
      ['--paep-color-focus-ring', '--paep-color-bg-page'],
      ['--paep-color-disabled-fg', '--paep-color-disabled-bg'],
      ['--paep-brand-primary', '--paep-ref-color-neutral-200'],
    ];
    const low = [
      ...text.filter(([a, b]) => contrastRatio(v(a), v(b)) < 4.5),
      ...nonText.filter(([a, b]) => contrastRatio(v(a), v(b)) < 3),
    ];
    expect(low).toEqual([]);
  });
});

describe('brand profile validator', () => {
  it('accepts the approved Navy/Gold default and the synthetic petrol profile', () => {
    expect(validateBrandProfile(PAEP_DEFAULT_BRAND)).toEqual({ valid: true, violations: [] });
    expect(validateBrandProfile(PETROL).valid).toBe(true);
  });

  it('rejects the yellow demo profile and white on gold', () => {
    const y = validateBrandProfile(YELLOW);
    expect(y.valid).toBe(false);
    expect(new Set(y.violations.map((x) => x.rule))).toEqual(new Set([2, 3, 4, 5, 6]));
    const whiteOnGold = validateBrandProfile({ ...PAEP_DEFAULT_BRAND, 'on-accent': '#FFFFFF' });
    expect(whiteOnGold.violations.map((x) => x.rule)).toEqual([6]);
  });

  it('rejects protected, unknown, missing and malformed keys (rule 1)', () => {
    const cases: unknown[] = [
      { ...PAEP_DEFAULT_BRAND, 'status-error-fg': '#000000' },
      { ...PAEP_DEFAULT_BRAND, '--paep-color-focus-ring': '#000000' },
      { ...PAEP_DEFAULT_BRAND, primary: undefined },
      { ...PAEP_DEFAULT_BRAND, primary: 'navy' },
      { ...PAEP_DEFAULT_BRAND, primary: '#24364b80' },
      { ...PAEP_DEFAULT_BRAND, primary: 'red; --paep-color-status-error-fg: #000' },
      null,
      [],
      'primary',
      Object.assign(Object.create({ primary: '#24364B' }), {}),
    ];
    for (const c of cases) {
      const r = validateBrandProfile(c);
      expect(r.valid, JSON.stringify(c)).toBe(false);
      expect(r.violations.every((x) => x.rule === 1)).toBe(true);
    }
  });

  it('enforces each contrast rule 2-6 independently', () => {
    const one = (patch: Record<string, string>) => validateBrandProfile({ ...PAEP_DEFAULT_BRAND, ...patch }).violations.map((x) => x.rule);
    expect(one({ 'primary-hover': '#9AA7B5' })).toEqual([2]);
    expect(one({ primary: '#5E7896', 'primary-hover': '#1B2A3B', 'on-primary': '#FFFFFF' })).toContain(3);
    expect(one({ 'primary-subtle': '#44566B' })).toEqual([5]);
    expect(one({ accent: '#545D68' })).toEqual([6]);
  });

  it('rejects a primary whose hue reads as error (rule 7) unless it is near-neutral', () => {
    const red = { ...PAEP_DEFAULT_BRAND, primary: '#8E1B14', 'primary-hover': '#761610', 'primary-active': '#5E110C', 'primary-subtle': '#FBE9E7' };
    expect(validateBrandProfile(red).violations.map((x) => x.rule)).toEqual([7]);
    const grey = { ...PAEP_DEFAULT_BRAND, primary: '#3E4650', 'primary-hover': '#2A3038', 'primary-active': '#1A1F26', 'primary-subtle': '#EFF2F5' };
    expect(validateBrandProfile(grey).valid).toBe(true);
  });

  it('applies a valid profile to a subtree without changing protected tokens, and applies nothing when rejected', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const before = getComputedStyle(el).getPropertyValue('--paep-color-status-error-fg').trim();
    applyBrandProfile(el, PETROL);
    expect(getComputedStyle(el).getPropertyValue('--paep-brand-primary').trim()).toBe('#0B5E73');
    expect(getComputedStyle(el).getPropertyValue('--paep-color-status-error-fg').trim()).toBe(before);
    expect(getComputedStyle(el).getPropertyValue('--paep-color-focus-ring').trim()).toBe('#2D4FD1');
    expect(() => applyBrandProfile(el, YELLOW)).toThrow(PaepBrandProfileError);
    expect(getComputedStyle(el).getPropertyValue('--paep-brand-primary').trim()).toBe('#0B5E73');
    clearBrandProfile(el);
    expect(getComputedStyle(el).getPropertyValue('--paep-brand-primary').trim()).toBe('#24364B');
    el.remove();
  });

  it('applies exactly the values it validated, even when a value changes between reads', () => {
    const el = document.createElement('div');
    let reads = 0;
    const shifting = { ...PETROL };
    Object.defineProperty(shifting, 'on-primary', { enumerable: true, get: () => (++reads === 1 ? '#FFFFFF' : PETROL.primary) });
    applyBrandProfile(el, shifting);
    expect(reads).toBe(1);
    expect(el.style.getPropertyValue('--paep-brand-on-primary')).toBe('#FFFFFF');
    const nullProto = Object.assign(Object.create(null), PETROL);
    expect(() => applyBrandProfile(el, nullProto)).toThrow(PaepBrandProfileError);
  });
});

@Component({
  imports: [PaepIcon],
  template: `<svg paepIcon="chevron-end"></svg><svg paepIcon="success"></svg><div dir="rtl"><svg paepIcon="chevron-end"></svg></div>`,
})
class IconHost {}

describe('icons', () => {
  it('renders decorative, non-focusable SVG from PAEP-owned data and mirrors directional icons in RTL', async () => {
    const f = TestBed.createComponent(IconHost);
    f.detectChanges();
    await f.whenStable();
    const svgs = [...(f.nativeElement as HTMLElement).querySelectorAll('svg')];
    expect(svgs.length).toBe(3);
    for (const s of svgs) {
      expect(s.getAttribute('aria-hidden')).toBe('true');
      expect(s.getAttribute('focusable')).toBe('false');
      expect(s.getAttribute('viewBox')).toBe('0 0 24 24');
    }
    expect(svgs[0].querySelector('path')!.getAttribute('d')).toBe(PAEP_ICONS['chevron-end'][0].d);
    expect(svgs[1].querySelectorAll('circle, path').length).toBe(2);
    expect(getComputedStyle(svgs[0]).transform).toBe('none');
    expect(getComputedStyle(svgs[2]).transform).not.toBe('none');
    expect(Object.keys(PAEP_ICONS).length).toBe(25);
  });
});

describe('announcer', () => {
  it('announces through persistent polite and assertive live regions', async () => {
    const a = TestBed.inject(PaepAnnouncer);
    a.announce('Saved');
    const polite = a.region('polite');
    expect(polite.getAttribute('aria-live')).toBe('polite');
    await new Promise((r) => setTimeout(r, 100));
    expect(polite.textContent).toBe('Saved');
    a.announce('Records could not be loaded', 'assertive');
    await new Promise((r) => setTimeout(r, 100));
    expect(a.region('assertive').textContent).toBe('Records could not be loaded');
    expect(document.querySelectorAll('[data-paep-announcer]').length).toBe(2);
  });

  it('clears the region before repeating a message, and keeps polite and assertive messages independent', async () => {
    const a = TestBed.inject(PaepAnnouncer);
    const polite = a.region('polite');
    a.announce('Saved');
    await new Promise((r) => setTimeout(r, 100));
    a.announce('Saved');
    expect(polite.textContent).toBe('');
    a.announce('Records could not be loaded', 'assertive');
    await new Promise((r) => setTimeout(r, 100));
    expect(polite.textContent).toBe('Saved');
    expect(a.region('assertive').textContent).toBe('Records could not be loaded');
  });
});
