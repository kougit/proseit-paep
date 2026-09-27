import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { PaepIcon } from '@proseit/paep-foundation';
import { PaepAlert } from '../alert/alert';
import { PaepEmptyState, PaepHeadingLevel } from '../empty-state/empty-state';
import { PaepCollectionState } from '../list/list';
import { PAEP_MESSAGES, paepFormat } from '../messages/messages';
import { PaepSkeleton } from '../skeleton/skeleton';

/** A row: a plain record keyed by column key. Domain types stay in the consumer. */
export type PaepTableRow = Readonly<Record<string, unknown>>;

/** Column definition. The first column is the key column (row header) and never hides. */
export interface PaepTableColumn {
  /** Row property shown in this column; also the key for a custom cell template. */
  readonly key: string;
  /** Visible column header (repeated as <dt> in the row detail when the column is hidden). */
  readonly header: string;
  /** 1 never hides; 3 moves to the row detail below 60 rem; 2 also moves below 40 rem. Default 1. */
  readonly priority?: 1 | 2 | 3;
  /** Numeric data: tabular numbers, aligned to the inline end. */
  readonly numeric?: boolean;
  /** Identifier or URL: monospace, dir="ltr", breaks anywhere. */
  readonly identifier?: boolean;
  /** Optional secondary line under the value (for example the record identifier under its name). */
  readonly secondaryKey?: string;
}

export type PaepTableVariant = 'standard' | 'scroll';

/** Context of a custom cell template. */
export interface PaepTableCellContext {
  readonly $implicit: PaepTableRow;
  readonly value: unknown;
}

/**
 * Custom cell content for one column (used in the cell and in the row detail):
 * `<ng-template paepTableCell="status" let-row><paep-status-badge …>{{ row['status'] }}</paep-status-badge></ng-template>`.
 */
@Directive({ selector: 'ng-template[paepTableCell]' })
export class PaepTableCell {
  /** Column key this template renders. */
  readonly paepTableCell = input.required<string>();
  readonly template = inject<TemplateRef<PaepTableCellContext>>(TemplateRef);

  static ngTemplateContextGuard(_dir: PaepTableCell, ctx: unknown): ctx is PaepTableCellContext {
    return true;
  }
}

type PaepTableMode = 'wide' | 'medium' | 'narrow';

/**
 * Table shell: a bounded, backend-neutral set of rows with caption, column headers and complete state handling.
 * `<paep-table caption="Records" [columns]="cols" [rows]="rows" state="populated" rowIdKey="id" />`.
 *
 * Standard variant: container-width priority columns. At ≥ 60 rem every column shows; below 60 rem priority-3
 * columns move into a per-row detail (a <dl>) opened by a "Details" disclosure button; below 40 rem priority-2
 * columns move too. Scroll variant (fallback, for genuinely two-dimensional comparison only): every column stays
 * in a focusable, named, horizontally scrollable region with a sticky first column.
 *
 * Data volume: the shell renders every row it is given (no virtualisation). Keep a page bounded (IB2 guidance:
 * at most 100 rows per page) and page larger collections with paep-pagination in the footer slot
 * (`<paep-pagination paepTableFooter …>`).
 */
@Component({
  selector: 'paep-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, PaepIcon, PaepAlert, PaepEmptyState, PaepSkeleton],
  host: { class: 'paep-table', '[attr.data-variant]': 'variant()', '[attr.data-mode]': 'mode()' },
  templateUrl: './table.html',
  styleUrl: './table.css',
})
export class PaepTable {
  private static nextId = 0;
  private readonly messages = inject(PAEP_MESSAGES);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private retryPending = false;
  protected readonly uid = `paep-table-${PaepTable.nextId++}`;

  /** Table caption (visible title and accessible name). Required. */
  readonly caption = input.required<string>();
  readonly columns = input.required<readonly PaepTableColumn[]>();
  readonly rows = input<readonly PaepTableRow[]>([]);
  readonly state = input<PaepCollectionState>('populated');
  readonly variant = input<PaepTableVariant>('standard');
  /** Row property holding a stable identity (falls back to the row index). */
  readonly rowIdKey = input<string>('id');
  /** Row property naming the row in "Details for {rowName}" (defaults to the key column). */
  readonly rowNameKey = input<string>('');
  /** Total number of records for the count "{shown} of {total} records"; no count when null. */
  readonly total = input<number | null>(null);
  /** Skeleton rows while loading: the expected page size, 1-10. */
  readonly loadingRows = input(5, { transform: (v: unknown) => Math.min(10, Math.max(1, numberAttribute(v, 5))) });
  /** Heading level of the empty and no-results states. */
  readonly headingLevel = input<PaepHeadingLevel>(3);
  /** Correlation reference shown in the error alert (never secrets). */
  readonly errorReference = input<string>('');
  /** Text overrides (defaults from paep.table.*, paep.empty.*, paep.noResults.*). */
  readonly countLabel = input<string>('');
  readonly loadingLabel = input<string>('');
  readonly emptyHeading = input<string>('');
  readonly emptyDescription = input<string | undefined>(undefined);
  /** Empty-state action text (for example "Create record"); no action when empty. */
  readonly emptyActionLabel = input<string>('');
  readonly noResultsHeading = input<string>('');
  readonly noResultsDescription = input<string | undefined>(undefined);
  readonly errorHeading = input<string>('');
  readonly errorMessage = input<string>('');

  readonly retry = output<void>();
  readonly emptyAction = output<void>();
  readonly clearFilters = output<void>();

  private readonly cellTemplates = contentChildren(PaepTableCell);
  private readonly captionRef = viewChild<ElementRef<HTMLElement>>('captionEl');
  private readonly shellRef = viewChild.required<ElementRef<HTMLElement>>('shell');
  /** The caption element; pass it to paep-pagination's focusTarget. */
  readonly captionElement = computed(() => this.captionRef()?.nativeElement ?? null);

  private readonly widthRem = signal<number | null>(null);
  protected readonly viewportPx = signal<number | null>(null);
  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  protected readonly mode = computed<PaepTableMode>(() => {
    const w = this.widthRem();
    if (w === null || w >= 60) return 'wide';
    return w >= 40 ? 'medium' : 'narrow';
  });
  protected readonly visibleColumns = computed(() => {
    if (this.variant() === 'scroll') return this.columns();
    const limit = this.mode() === 'wide' ? 3 : this.mode() === 'medium' ? 2 : 1;
    return this.columns().filter((c, i) => i === 0 || (c.priority ?? 1) <= limit);
  });
  protected readonly hiddenColumns = computed(() => {
    const visible = new Set(this.visibleColumns());
    return this.columns().filter((c) => !visible.has(c));
  });
  protected readonly hasDetails = computed(() => this.hiddenColumns().length > 0);
  protected readonly colspan = computed(() => this.visibleColumns().length + (this.hasDetails() ? 1 : 0));
  protected readonly effectiveState = computed<PaepCollectionState>(() =>
    this.state() === 'populated' && this.rows().length === 0 ? 'empty' : this.state(),
  );
  protected readonly skeletonRows = computed(() => Array.from({ length: this.loadingRows() }, (_, i) => i));
  protected readonly templates = computed(() => new Map(this.cellTemplates().map((t) => [t.paepTableCell(), t.template])));

  protected readonly countText = computed(() => {
    if (this.countLabel()) return this.countLabel();
    const total = this.total();
    if (total === null) return '';
    const shown = this.effectiveState() === 'populated' ? this.rows().length : 0;
    return paepFormat(this.messages['paep.table.count'], { shown, total });
  });
  protected readonly scrollLabel = computed(() => paepFormat(this.messages['paep.table.scrollRegion'], { caption: this.caption() }));
  protected readonly detailsText = computed(() => this.messages['paep.table.details']);
  protected readonly retryText = computed(() => this.messages['paep.common.retry']);
  protected readonly errorHeadingText = computed(() => this.errorHeading() || this.messages['paep.table.errorTitle']);
  protected readonly errorMessageText = computed(() => this.errorMessage() || this.messages['paep.table.errorBody']);
  protected readonly errorReferenceText = computed(() =>
    this.errorReference() ? paepFormat(this.messages['paep.table.errorReference'], { reference: this.errorReference() }) : '',
  );
  protected readonly liveText = computed(() => {
    switch (this.effectiveState()) {
      case 'loading':
        return this.loadingLabel() || this.messages['paep.table.loading'];
      case 'empty':
        return this.emptyHeading() || this.messages['paep.empty.title'];
      case 'no-results':
        return this.noResultsHeading() || this.messages['paep.noResults.title'];
      default:
        return '';
    }
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const shell = this.shellRef().nativeElement;
      const doc = this.host.nativeElement.ownerDocument;
      const measure = (px: number) => {
        const rootPx = parseFloat(doc.defaultView?.getComputedStyle(doc.documentElement).fontSize ?? '') || 16;
        this.viewportPx.set(px);
        this.widthRem.set(px / rootPx);
      };
      measure(shell.getBoundingClientRect().width);
      const ro = new ResizeObserver((entries) => {
        const e = entries[entries.length - 1];
        measure(e.borderBoxSize?.[0]?.inlineSize ?? e.contentRect.width);
      });
      ro.observe(shell);
      destroyRef.onDestroy(() => ro.disconnect());
    });

    effect(() => {
      const s = this.effectiveState();
      untracked(() => {
        if (s === 'loading' || !this.retryPending) return;
        this.retryPending = false;
        afterNextRender(() => this.focusCaption(), { injector: this.injector });
      });
    });
  }

  /** Moves focus to the caption (used after Retry and by consumers after a page change). */
  focusCaption(): void {
    this.captionElement()?.focus();
  }

  protected rowId(row: PaepTableRow, index: number): string {
    const v = row[this.rowIdKey()];
    return v === undefined || v === null ? String(index) : String(v);
  }

  protected detailId(index: number): string {
    return `${this.uid}-detail-${index}`;
  }

  protected isExpanded(id: string): boolean {
    return this.expanded().has(id);
  }

  protected toggle(id: string): void {
    const next = new Set(this.expanded());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.expanded.set(next);
  }

  protected detailsName(row: PaepTableRow): string {
    const key = this.rowNameKey() || this.columns()[0]?.key || '';
    return paepFormat(this.messages['paep.table.detailsFor'], { rowName: this.text(row[key]) });
  }

  protected text(v: unknown): string {
    return v === undefined || v === null ? '' : String(v);
  }

  protected onRetry(): void {
    this.retryPending = true;
    this.retry.emit();
  }
}
