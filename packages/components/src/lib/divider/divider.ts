import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, booleanAttribute, inject, input, signal } from '@angular/core';

/**
 * Horizontal divider on a native thematic break: `<hr paepDivider />` (implicit separator role).
 * `inset` indents it from both inline edges; `decorative` hides it from assistive technology.
 */
@Component({
  selector: 'hr[paepDivider]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'paep-divider',
    '[class.paep-divider--inset]': 'inset()',
    '[attr.aria-hidden]': 'decorative() || null',
  },
  template: '',
  styles: `
    :host {
      display: block;
      block-size: 0;
      margin: var(--paep-density-stack-gap) 0;
      border: 0;
      border-block-start: 1px solid var(--paep-color-border-subtle);
      overflow: visible;
    }
    :host(.paep-divider--inset) {
      margin-inline: var(--paep-space-4);
    }
  `,
})
export class PaepDivider {
  /** Indent from both inline edges. */
  readonly inset = input(false, { transform: booleanAttribute });
  /** Purely visual: aria-hidden instead of a thematic break. */
  readonly decorative = input(false, { transform: booleanAttribute });
}

/**
 * Vertical divider between inline groups: `<paep-divider vertical />`. Exposed as
 * role="separator" aria-orientation="vertical" when it separates groups meaningfully; `decorative`
 * makes it aria-hidden. It is hidden when the items on either side wrap onto different lines.
 */
@Component({
  selector: 'paep-divider[vertical]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'paep-divider-vertical',
    '[attr.role]': "decorative() ? null : 'separator'",
    '[attr.aria-orientation]': "decorative() ? null : 'vertical'",
    '[attr.aria-hidden]': 'decorative() || null',
    '[class.paep-divider-vertical--wrapped]': 'wrapped()',
  },
  template: '',
  styles: `
    :host {
      display: block;
      flex: none;
      align-self: stretch;
      inline-size: 0;
      min-block-size: var(--paep-size-icon-md);
      margin: 0 var(--paep-space-2);
      border-inline-start: 1px solid var(--paep-color-border-subtle);
    }
    :host(.paep-divider-vertical--wrapped) {
      visibility: hidden;
    }
  `,
})
export class PaepVerticalDivider {
  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /** Purely visual: aria-hidden instead of a separator. */
  readonly decorative = input(false, { transform: booleanAttribute });
  protected readonly wrapped = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const parent = this.host.parentElement;
      if (!parent) return;
      const observer = new ResizeObserver(() => this.checkWrap());
      observer.observe(parent);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Visibility (not display) changes, so hiding cannot change the wrapping it responds to. */
  private checkWrap(): void {
    const prev = this.host.previousElementSibling?.getBoundingClientRect();
    const next = this.host.nextElementSibling?.getBoundingClientRect();
    this.wrapped.set(!!prev && !!next && next.top >= prev.bottom - 1);
  }
}
