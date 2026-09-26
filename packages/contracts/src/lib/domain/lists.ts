import type { PageRequest, SortSpec } from '../core/paging.js';
import type { FieldFilter } from '../core/query.js';

/** Product-neutral list / data-grid query (PAEP v1.1 §10.1 "Lists/data grids"). */
export interface ListQuery {
  readonly page?: PageRequest;
  readonly sort?: readonly SortSpec[];
  readonly filters?: readonly FieldFilter[];
}
