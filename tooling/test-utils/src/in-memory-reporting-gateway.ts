import type {
  DatasetDescriptor,
  DrillRequest,
  ExportJob,
  ExportRequest,
  PaepError,
  ReportQuery,
  ReportResult,
  ReportingGateway
} from '@proseit/paep-contracts';
import { frozenCopy } from './deep-freeze.js';

/** A seeded result for one dataset; returned by execute() for any valid query on that dataset. */
export interface SeededReportResult {
  readonly datasetId: string;
  readonly result: ReportResult;
}

/** A seeded drill result, looked up by DrillRequest.target. */
export interface SeededDrillResult {
  readonly target: string;
  readonly result: ReportResult;
}

export interface InMemoryReportingSeed {
  readonly datasets: readonly DatasetDescriptor[];
  readonly results?: readonly SeededReportResult[];
  readonly drillResults?: readonly SeededDrillResult[];
  /** Fixed "as of" time for generated results; the fake never reads the clock. */
  readonly asOf?: string;
  /** Base URL of generated export download references (public, non-secret placeholder). */
  readonly downloadBaseUrl?: string;
}

/** Controlled error codes the fake rejects with (PaepError-shaped plain objects, never Error instances). */
export const REPORTING_FAKE_ERROR_CODES = Object.freeze({
  datasetUnknown: 'REPORT_DATASET_UNKNOWN',
  fieldUnknown: 'REPORT_FIELD_UNKNOWN',
  drillUnknown: 'REPORT_DRILL_TARGET_UNKNOWN',
  exportJobUnknown: 'REPORT_EXPORT_JOB_UNKNOWN'
} as const);

const DEFAULT_AS_OF = '2026-01-01T00:00:00Z';
const DEFAULT_DOWNLOAD_BASE = 'https://files.example.test/exports/';
/** Export job lifecycle: each getExportJob() call advances one step until succeeded. */
const LIFECYCLE: readonly (Pick<ExportJob, 'status' | 'progress'>)[] = [
  { status: 'queued', progress: 0 },
  { status: 'running', progress: 50 },
  { status: 'succeeded', progress: 100 }
];

interface JobRecord {
  readonly id: string;
  readonly request: ExportRequest;
  readonly correlationId: string;
  step: number;
}

/**
 * In-memory ReportingGateway for contract and component tests. Deterministic: identifiers and correlation
 * identifiers are sequence-based, times come from the seed, and every returned value is a deep-frozen copy.
 */
export class InMemoryReportingGateway implements ReportingGateway {
  private readonly datasets = new Map<string, DatasetDescriptor>();
  private readonly results = new Map<string, ReportResult>();
  private readonly drills = new Map<string, ReportResult>();
  private readonly jobs = new Map<string, JobRecord>();
  private readonly asOf: string;
  private readonly downloadBaseUrl: string;
  private sequence = 0;
  private jobSequence = 0;

  constructor(seed: InMemoryReportingSeed) {
    for (const d of seed.datasets) this.datasets.set(d.id, frozenCopy(d));
    for (const r of seed.results ?? []) this.results.set(r.datasetId, frozenCopy(r.result));
    for (const r of seed.drillResults ?? []) this.drills.set(r.target, frozenCopy(r.result));
    this.asOf = seed.asOf ?? DEFAULT_AS_OF;
    this.downloadBaseUrl = seed.downloadBaseUrl ?? DEFAULT_DOWNLOAD_BASE;
  }

  getDataset(id: string): Promise<DatasetDescriptor> {
    const dataset = this.datasets.get(id);
    return dataset ? Promise.resolve(dataset) : this.reject(REPORTING_FAKE_ERROR_CODES.datasetUnknown, 'paep.reporting.datasetUnknown');
  }

  execute(query: ReportQuery): Promise<ReportResult> {
    const problem = this.checkQuery(query);
    if (problem) return problem;
    const seeded = this.results.get(query.datasetId);
    if (seeded) return Promise.resolve(seeded);
    return Promise.resolve(frozenCopy<ReportResult>({
      columns: [],
      rows: [],
      freshness: { asOf: this.asOf, source: 'operational' },
      correlationId: this.nextCorrelationId()
    }));
  }

  drill(request: DrillRequest): Promise<ReportResult> {
    const result = this.drills.get(request.target);
    return result ? Promise.resolve(result) : this.reject(REPORTING_FAKE_ERROR_CODES.drillUnknown, 'paep.reporting.drillUnknown');
  }

  requestExport(request: ExportRequest): Promise<ExportJob> {
    const problem = this.checkQuery(request.query);
    if (problem) return problem;
    this.jobSequence += 1;
    const record: JobRecord = { id: `export-${String(this.jobSequence).padStart(4, '0')}`, request: frozenCopy(request), correlationId: this.nextCorrelationId(), step: 0 };
    this.jobs.set(record.id, record);
    return Promise.resolve(this.snapshot(record));
  }

  getExportJob(id: string): Promise<ExportJob> {
    const record = this.jobs.get(id);
    if (!record) return this.reject(REPORTING_FAKE_ERROR_CODES.exportJobUnknown, 'paep.reporting.exportJobUnknown');
    record.step = Math.min(record.step + 1, LIFECYCLE.length - 1);
    return Promise.resolve(this.snapshot(record));
  }

  private snapshot(record: JobRecord): ExportJob {
    const phase = LIFECYCLE[record.step] ?? { status: 'failed' };
    const job: ExportJob = phase.status === 'succeeded'
      ? { id: record.id, ...phase, correlationId: record.correlationId, downloadUrl: `${this.downloadBaseUrl}${record.id}.${record.request.format}`, expiresAt: this.asOf }
      : { id: record.id, ...phase, correlationId: record.correlationId };
    return frozenCopy(job);
  }

  private checkQuery(query: ReportQuery): Promise<never> | undefined {
    const dataset = this.datasets.get(query.datasetId);
    if (!dataset) return this.reject(REPORTING_FAKE_ERROR_CODES.datasetUnknown, 'paep.reporting.datasetUnknown');
    const metrics = new Set(dataset.metrics.map((m) => m.key));
    const dimensions = new Set(dataset.dimensions.map((d) => d.key));
    const fields = new Set([...metrics, ...dimensions]);
    const unknown = query.metrics.some((m) => !metrics.has(m))
      || (query.dimensions ?? []).some((d) => !dimensions.has(d))
      || (query.filters ?? []).some((f) => !fields.has(f.field))
      || (query.sort ?? []).some((s) => !fields.has(s.field));
    return unknown ? this.reject(REPORTING_FAKE_ERROR_CODES.fieldUnknown, 'paep.reporting.fieldUnknown') : undefined;
  }

  private reject(code: string, messageKey: string): Promise<never> {
    const error: PaepError = frozenCopy<PaepError>({ code, category: 'validation', messageKey, correlationId: this.nextCorrelationId(), retryable: false });
    return Promise.reject(error);
  }

  private nextCorrelationId(): string {
    this.sequence += 1;
    return `test-corr-${String(this.sequence).padStart(4, '0')}`;
  }
}
