/** Cursor-first page request (PAEP-IB-01 §7.3). */
export interface PageRequest {
  readonly cursor?: string;
  readonly limit?: number;
}

/** Page metadata attached to bounded results. */
export interface PageInfo {
  readonly nextCursor?: string;
}

/** Common paged result shape (PAEP-IR-01 Code Block 3). */
export interface PageResult<T> {
  readonly items: readonly T[];
  readonly nextCursor?: string;
}

/** Sort direction. */
export type SortDirection = 'asc' | 'desc';

/** Sort by a semantic field key, never a column or DocType field name (PAEP-IB-01 §7.1(ii)). */
export interface SortSpec {
  readonly field: string;
  readonly direction: SortDirection;
}
