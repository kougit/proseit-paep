import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaepIcon } from '@proseit/paep-foundation';
import { PAEP_MESSAGES } from '../messages/messages';

/** One breadcrumb segment. Ancestors navigate with `link` (router) or `href`; the last item is the current page. */
export interface PaepBreadcrumbItem {
  readonly label: string;
  readonly href?: string;
  readonly link?: string | readonly unknown[];
}

/**
 * Location in a hierarchy: `<paep-breadcrumb [items]="path" />`. Renders nav > ol with the current page
 * (last item, aria-current="page", not a link). With more than 4 segments, or below a 36 rem container,
 * it collapses to first · "…" · parent · current; the "…" button expands the full path inline and moves
 * focus to the first revealed link. Separators are decorative and mirror in RTL.
 */
@Component({
  selector: 'paep-breadcrumb',
  imports: [PaepIcon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class PaepBreadcrumb {
  private readonly messages = inject(PAEP_MESSAGES);
  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  /** Path from the root to the current page (last). */
  readonly items = input.required<readonly PaepBreadcrumbItem[]>();
  /** Accessible name of the navigation landmark. */
  readonly label = input(this.messages['paep.breadcrumb.label']);
  /** Accessible name of the "…" button. */
  readonly showFullPathLabel = input(this.messages['paep.breadcrumb.showFullPath']);

  /** Whether there are middle segments that can be collapsed (first · … · parent · current). */
  protected readonly collapsible = computed(() => this.items().length > 3);
  /** More than 4 segments: collapsed regardless of width. */
  protected readonly many = computed(() => this.items().length > 4);
  protected readonly expanded = linkedSignal<readonly PaepBreadcrumbItem[], boolean>({
    source: this.items,
    computation: () => false,
  });

  protected isMiddle(index: number): boolean {
    return index > 0 && index < this.items().length - 2;
  }

  protected expand(): void {
    this.expanded.set(true);
    afterNextRender(() => this.host.querySelector<HTMLElement>('.paep-breadcrumb__middle a')?.focus(), {
      injector: this.injector,
    });
  }
}
