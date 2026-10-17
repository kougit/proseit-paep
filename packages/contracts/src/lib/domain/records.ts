import type { ConcurrencyMetadata } from '../core/concurrency.js';
import type { CorrelationId, EntityId, IsoDateTime } from '../core/ids.js';
import type { PageResult } from '../core/paging.js';
import type { MoneyValue, ScalarValue } from '../core/values.js';
import type { ListQuery } from './lists.js';

/** Server-declared semantic record-type key; never a backend table, model or document-type name (PAEP-IB-01 §7.1(ii)). */
export type RecordTypeKey = string;

/** A record field value at the UI boundary: a JSON scalar, money, or a list of scalars. */
export type RecordFieldValue = ScalarValue | MoneyValue | readonly ScalarValue[];

/** Product-neutral reference to one record. */
export interface RecordRef {
  readonly recordType: RecordTypeKey;
  readonly id: EntityId;
}

/** One row of a record list. The keys of fields are the record type's own semantic field keys, so a record map is the model. */
export interface RecordSummary {
  readonly recordType: RecordTypeKey;
  readonly id: EntityId;
  readonly fields: Readonly<Record<string, RecordFieldValue>>;
  readonly modifiedAt?: IsoDateTime;
  readonly concurrency?: ConcurrencyMetadata;
}

/** A record read in full from the server; the concurrency token protects any later write (PAEP-IB-01 §7.3). */
export interface RecordDetail {
  readonly recordType: RecordTypeKey;
  readonly id: EntityId;
  readonly fields: Readonly<Record<string, RecordFieldValue>>;
  readonly concurrency: ConcurrencyMetadata;
  readonly createdAt?: IsoDateTime;
  readonly modifiedAt?: IsoDateTime;
  readonly correlationId?: CorrelationId;
}

/** Typed list request: a record type plus the product-neutral list query. */
export interface RecordListRequest {
  readonly recordType: RecordTypeKey;
  readonly query?: ListQuery;
}

/** Cursor-paged list result. */
export interface RecordListResult extends PageResult<RecordSummary> {
  readonly correlationId?: CorrelationId;
}

/** Record read port implemented by backend adapters (PAEP v1.1 §10.1 "Lists/data grids"). Rejections carry a PaepError. */
export interface RecordsGateway {
  list(request: RecordListRequest): Promise<RecordListResult>;
  get(ref: RecordRef): Promise<RecordDetail>;
}
