import type { CorrelationId, IsoDateTime, MessageKey } from '../core/ids.js';
import type { PageInfo, SortSpec } from '../core/paging.js';
import type { FieldFilter, FilterValue } from '../core/query.js';
import type { MoneyValue, ScalarValue } from '../core/values.js';
import type { JobStatus } from '../core/jobs.js';

/*
 * Reporting contracts (PAEP-IB-01 §7.1(vii), Appendix D; PAEP-IR-01 §5.4). They describe governed datasets, metrics,
 * dimensions, filters, drill context, freshness and export intent. They never carry SQL, database locators,
 * analytical-store credentials or charting-library types. Tenant, row/field security and export authorisation
 * stay server-governed.
 */

/** Semantic data type of a dataset field. */
export type FieldDataType = 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'datetime' | 'currency' | 'percentage' | 'duration';

/** Declared aggregation of a governed metric; the formula stays server-side (PAEP-IR-01 Code Block 5). */
export type MetricAggregation = 'sum' | 'average' | 'min' | 'max' | 'count' | 'custom';

/** Neutral visual vocabulary; never a charting-library type (PAEP-IB-01 §3 "Visualization engine"). */
export type VisualType = 'kpi' | 'table' | 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'heatmap' | 'waterfall' | 'funnel' | 'combo';

export interface DimensionDefinition {
  readonly key: string;
  readonly labelKey: MessageKey;
  readonly dataType: FieldDataType;
  readonly hierarchy?: readonly string[];
  readonly filterable?: boolean;
}

export interface MetricDefinition {
  readonly key: string;
  readonly labelKey: MessageKey;
  readonly dataType: FieldDataType;
  readonly aggregation?: MetricAggregation;
  readonly format?: string;
  readonly descriptionKey?: MessageKey;
}

export interface FreshnessPolicy {
  readonly targetSeconds?: number;
  readonly displayedToUser?: boolean;
}

export interface DatasetDescriptor {
  readonly id: string;
  readonly version: string;
  readonly labelKey: MessageKey;
  readonly dimensions: readonly DimensionDefinition[];
  readonly metrics: readonly MetricDefinition[];
  readonly defaultTimeDimension?: string;
  readonly freshnessPolicy?: FreshnessPolicy;
}

export type ReportFilter = FieldFilter;
export type ReportSort = SortSpec;

/** Semantic query by dataset, metric and dimension keys; never SQL. */
export interface ReportQuery {
  readonly datasetId: string;
  readonly metrics: readonly string[];
  readonly dimensions?: readonly string[];
  readonly filters?: readonly ReportFilter[];
  readonly sort?: readonly ReportSort[];
  readonly cursor?: string;
  readonly limit?: number;
  /** Named parameters the dataset declares; the key set is server-declared per dataset, so a record map is the model. */
  readonly parameters?: Readonly<Record<string, ScalarValue>>;
}

export interface ReportColumn {
  readonly key: string;
  readonly label: string;
  readonly dataType: FieldDataType;
  readonly format?: string;
}

export type DataSource = 'operational' | 'analytical' | 'hybrid';

export interface DataFreshness {
  readonly asOf: IsoDateTime;
  readonly source: DataSource;
  readonly stale?: boolean;
}

/** One report cell: a scalar, or a money amount with its explicit currency (PAEP-IB-01 §7.3: never infer currency). */
export type ReportCellValue = ScalarValue | MoneyValue;

/** One result row keyed by column key; columns are dynamic per dataset, so a record map is the model. */
export type ReportRow = Readonly<Record<string, ReportCellValue>>;

export interface ReportResult<Row extends ReportRow = ReportRow> {
  readonly columns: readonly ReportColumn[];
  readonly rows: readonly Row[];
  readonly page?: PageInfo;
  /** Totals keyed by metric key. */
  readonly totals?: Readonly<Record<string, ReportCellValue>>;
  readonly freshness: DataFreshness;
  readonly correlationId: CorrelationId;
}

export interface DrillRequest {
  readonly reportId: string;
  readonly visualId: string;
  /** Selected dimension values keyed by dimension key. */
  readonly sourceContext: Readonly<Record<string, FilterValue>>;
  readonly target: string;
}

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ExportRequest {
  readonly reportId: string;
  readonly format: ExportFormat;
  readonly query: ReportQuery;
}

/** Asynchronous, server-authorised export job. */
export interface ExportJob extends JobStatus {
  readonly downloadUrl?: string;
  readonly expiresAt?: IsoDateTime;
}

export interface VisualDefinition {
  readonly id: string;
  readonly type: VisualType;
  readonly titleKey: MessageKey;
  readonly query: ReportQuery;
  readonly crossFilter?: boolean;
  readonly drillTargets?: readonly string[];
}

export interface DashboardDefinition {
  readonly id: string;
  readonly version: string;
  readonly titleKey: MessageKey;
  readonly visuals: readonly VisualDefinition[];
  readonly globalFilters?: readonly ReportFilter[];
}

/** Reporting port implemented by adapters (PAEP-IR-01 Code Block 5; PAEP-IB-01 Appendix D). */
export interface ReportingGateway {
  getDataset(id: string): Promise<DatasetDescriptor>;
  execute(query: ReportQuery): Promise<ReportResult>;
  drill(request: DrillRequest): Promise<ReportResult>;
  requestExport(request: ExportRequest): Promise<ExportJob>;
  getExportJob(id: string): Promise<ExportJob>;
}
