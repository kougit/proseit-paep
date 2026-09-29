import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';

/** `text`: N lines, the last one 60% wide. `item`: a list item (primary + secondary line). `cell`: one table-cell line. */
export type PaepSkeletonShape = 'text' | 'item' | 'cell';

/**
 * Loading placeholder for content with a known shape: `<paep-skeleton shape="text" [lines]="3" />`.
 * Hidden from assistive technology. The busy container (not the skeleton) carries aria-busy="true" and a
 * visually hidden "Loading…" text; the table shell and list do this themselves.
 */
@Component({
  selector: 'paep-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'paep-skeleton', 'aria-hidden': 'true', '[attr.data-shape]': 'shape()' },
  template: `
    @for (w of widths(); track $index) {
      <span class="paep-skeleton__block" [style.inline-size.%]="w"></span>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--paep-space-2);
      min-inline-size: 0;
    }
    .paep-skeleton__block {
      display: block;
      block-size: calc(var(--paep-space-3) + var(--paep-space-0-5));
      background: var(--paep-ref-color-neutral-100);
      border-radius: var(--paep-radius-sm);
      animation: paep-skeleton-pulse var(--paep-motion-loop-skeleton-pulse) var(--paep-motion-easing-standard) infinite alternate;
      animation-play-state: var(--paep-motion-loop-state);
    }
    @keyframes paep-skeleton-pulse {
      from {
        opacity: 1;
      }
      to {
        opacity: 0.5;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .paep-skeleton__block {
        animation: none;
      }
    }
    :host-context([data-paep-motion='reduce']) .paep-skeleton__block {
      animation: none;
    }
  `,
})
export class PaepSkeleton {
  readonly shape = input<PaepSkeletonShape>('text');
  /** Number of lines for the text shape (1-10). */
  readonly lines = input(3, { transform: (v: unknown) => Math.min(10, Math.max(1, numberAttribute(v, 3))) });

  protected readonly widths = computed<readonly number[]>(() => {
    switch (this.shape()) {
      case 'item':
        return [60, 40];
      case 'cell':
        return [70];
      default:
        return Array.from({ length: this.lines() }, (_, i) => (i === this.lines() - 1 ? 60 : 100));
    }
  });
}
