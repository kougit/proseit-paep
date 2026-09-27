import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PAEP_ICONS, PAEP_TOKENS, PaepIcon, PaepIconName, contrastRatio } from '@proseit/paep-foundation';

export type LabFoundationTopic = 'colour' | 'typography' | 'spacing' | 'surfaces' | 'motion' | 'density' | 'focus' | 'icons';

const TITLES: Record<LabFoundationTopic, [string, string]> = {
  colour: ['Colour', 'Neutral ramp, protected semantic and status colours, and the overridable brand layer, with contrast evidence.'],
  typography: ['Typography', 'System font stack (no font download) and the type scale in rem, so text follows browser zoom.'],
  spacing: ['Spacing, size and radius', 'A 4 px spacing base, icon and target sizes, and the radius scale.'],
  surfaces: ['Surfaces and elevation', 'Page, surface and overlay layers. Every raised layer keeps a border, so elevation never relies on shadow alone.'],
  motion: ['Motion', 'Short, functional durations and easings; under reduced motion every duration is 0 and every loop stops.'],
  density: ['Density', 'Comfortable is the default; compact is opt-in per subtree. Compact keeps 40 px controls on coarse pointers.'],
  focus: ['Focus and states', 'A 2 px focus ring with a 2 px white halo on every interactive element; forced colours use the system Highlight.'],
  icons: ['Icons', 'The PAEP-owned icon set: 24 px grid, 2 px round stroke, currentColor, always decorative.'],
};

const value = (name: string) => PAEP_TOKENS.find((t) => t.name === name)?.value ?? '';

@Component({
  selector: 'lab-foundation',
  imports: [PaepIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './foundation.html',
  styleUrl: './foundation.css',
})
export class LabFoundationPage {
  /** Bound from the route data. */
  readonly topic = input.required<LabFoundationTopic>();
  protected readonly title = computed(() => TITLES[this.topic()][0]);
  protected readonly lead = computed(() => TITLES[this.topic()][1]);
  protected readonly byPrefix = (prefix: string) => PAEP_TOKENS.filter((t) => t.name.startsWith(prefix));
  protected readonly typeRoles = PAEP_TOKENS.filter((t) => t.name.startsWith('--paep-font-size-')).map((t) => t.name.slice('--paep-font-size-'.length));
  protected readonly iconNames = Object.keys(PAEP_ICONS) as PaepIconName[];
  protected readonly statuses = ['success', 'warning', 'error', 'info', 'neutral'];
  protected readonly contrastPairs: readonly { label: string; fg: string; bg: string; min: number }[] = [
    { label: 'Text primary on surface', fg: '--paep-color-text-primary', bg: '--paep-color-surface', min: 4.5 },
    { label: 'Text secondary on page background', fg: '--paep-color-text-secondary', bg: '--paep-color-bg-page', min: 4.5 },
    { label: 'Control border on surface', fg: '--paep-color-border-default', bg: '--paep-color-surface', min: 3 },
    { label: 'Focus ring on surface', fg: '--paep-color-focus-ring', bg: '--paep-color-surface', min: 3 },
    { label: 'On-primary on brand primary', fg: '--paep-brand-on-primary', bg: '--paep-brand-primary', min: 4.5 },
    { label: 'Selected text on selected background', fg: '--paep-brand-primary', bg: '--paep-brand-primary-subtle', min: 4.5 },
    { label: 'On-accent on brand accent', fg: '--paep-brand-on-accent', bg: '--paep-brand-accent', min: 4.5 },
    { label: 'Error text on surface', fg: '--paep-color-status-error-fg', bg: '--paep-color-surface', min: 4.5 },
    { label: 'Disabled text on disabled background (legibility target)', fg: '--paep-color-disabled-fg', bg: '--paep-color-disabled-bg', min: 3 },
  ];
  protected readonly focusRing = value('--paep-color-focus-ring');
  protected ratio(fg: string, bg: string): string {
    return contrastRatio(value(fg), value(bg)).toFixed(2);
  }
  protected passes(fg: string, bg: string, min: number): boolean {
    return contrastRatio(value(fg), value(bg)) >= min;
  }
}
