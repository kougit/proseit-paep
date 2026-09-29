import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PAEP_DIRECTIONAL_ICONS, PAEP_ICONS, PaepIconName, PaepIconShape } from './icons';

/**
 * Decorative PAEP icon: `<svg paepIcon="check"></svg>`. Always aria-hidden and not focusable; the
 * accessible name comes from visible or visually hidden text on the owning control.
 */
@Component({
  selector: 'svg[paepIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'paep-icon',
    '[class.paep-icon--directional]': 'directional()',
    '[class.paep-icon--spin]': 'paepIcon() === "spinner"',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  },
  template: `
    @for (s of shapes(); track $index) {
      @if (s.type === 'path') {
        <svg:path [attr.d]="s.d" />
      } @else {
        <svg:circle [attr.cx]="s.cx" [attr.cy]="s.cy" [attr.r]="s.r" [attr.fill]="s.filled ? 'currentColor' : null" [attr.stroke]="s.filled ? 'none' : null" />
      }
    }
  `,
  styles: `
    :host {
      display: inline-block;
      flex: none;
      inline-size: var(--paep-icon-size, var(--paep-size-icon-md));
      block-size: var(--paep-icon-size, var(--paep-size-icon-md));
      vertical-align: middle;
    }
    :host(.paep-icon--directional:dir(rtl)) {
      transform: scaleX(-1);
    }
    :host(.paep-icon--spin) {
      animation: paep-icon-spin var(--paep-motion-loop-spinner) linear infinite;
      animation-play-state: var(--paep-motion-loop-state);
    }
    @keyframes paep-icon-spin {
      to {
        transform: rotate(1turn);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :host(.paep-icon--spin) {
        animation: none;
      }
    }
  `,
})
export class PaepIcon {
  /** Icon name from the PAEP icon set. */
  readonly paepIcon = input.required<PaepIconName>();
  protected readonly shapes = computed<readonly PaepIconShape[]>(() => PAEP_ICONS[this.paepIcon()] ?? []);
  protected readonly directional = computed(() => PAEP_DIRECTIONAL_ICONS.includes(this.paepIcon()));
}
