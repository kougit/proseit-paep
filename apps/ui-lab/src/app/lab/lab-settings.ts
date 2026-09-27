import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { PAEP_DEFAULT_BRAND, PaepBrandProfile, applyBrandProfile, clearBrandProfile } from '@proseit/paep-foundation';

export type LabDensity = 'comfortable' | 'compact';
export type LabDirection = 'ltr' | 'rtl';
export type LabBrand = 'proseit-default' | 'synthetic-demo-petrol';

/**
 * Synthetic demonstration profile (HOF-IB2-001 F09): proves the brand layer is overridable while protected
 * tokens stay unchanged. Not a product brand.
 */
export const LAB_SYNTHETIC_PETROL: PaepBrandProfile = {
  primary: '#0B5E73',
  'primary-hover': '#094C5E',
  'primary-active': '#073C4A',
  'primary-subtle': '#E4F1F4',
  'on-primary': '#FFFFFF',
  accent: '#9ED6E0',
  'on-accent': '#1A1F26',
};

export const LAB_BRANDS: Readonly<Record<LabBrand, PaepBrandProfile>> = {
  'proseit-default': PAEP_DEFAULT_BRAND,
  'synthetic-demo-petrol': LAB_SYNTHETIC_PETROL,
};

/**
 * Lab-wide specimen settings. They apply to the whole page through root attributes, the same mechanism
 * products use: data-paep-density, dir, the brand profile (through applyBrandProfile) and data-paep-motion.
 * Settings are mirrored in the URL query (density, dir, brand, motion) so every state has a stable address.
 */
@Injectable({ providedIn: 'root' })
export class LabSettings {
  private readonly root = inject(DOCUMENT).documentElement;
  readonly density = signal<LabDensity>('comfortable');
  readonly direction = signal<LabDirection>('ltr');
  readonly brand = signal<LabBrand>('proseit-default');
  readonly reducedMotion = signal(false);

  /** Reads settings from a query string such as "?dir=rtl&density=compact". Unknown values are ignored. */
  readFromQuery(search: string): void {
    const q = new URLSearchParams(search);
    const density = q.get('density');
    const dir = q.get('dir');
    const brand = q.get('brand');
    if (density === 'compact' || density === 'comfortable') this.density.set(density);
    if (dir === 'rtl' || dir === 'ltr') this.direction.set(dir);
    if (brand === 'proseit-default' || brand === 'synthetic-demo-petrol') this.brand.set(brand);
    this.reducedMotion.set(q.get('motion') === 'reduce');
    this.apply();
  }

  /** The current settings as query parameters (defaults omitted). */
  query(): Record<string, string | null> {
    return {
      density: this.density() === 'compact' ? 'compact' : null,
      dir: this.direction() === 'rtl' ? 'rtl' : null,
      brand: this.brand() === 'synthetic-demo-petrol' ? 'synthetic-demo-petrol' : null,
      motion: this.reducedMotion() ? 'reduce' : null,
    };
  }

  apply(): void {
    this.root.setAttribute('data-paep-density', this.density());
    this.root.setAttribute('dir', this.direction());
    if (this.reducedMotion()) this.root.setAttribute('data-paep-motion', 'reduce');
    else this.root.removeAttribute('data-paep-motion');
    if (this.brand() === 'proseit-default') clearBrandProfile(this.root);
    else applyBrandProfile(this.root, LAB_BRANDS[this.brand()]);
  }
}
