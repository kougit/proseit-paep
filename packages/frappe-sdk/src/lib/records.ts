/**
 * Record list and detail reads (AC-IB4-03): typed, cursor-paged, through the compiled resource map only. Unknown
 * resources, fields, sort keys, operators or malformed queries are refused before any request.
 */
import type {
  FieldFilter, FilterValue, ListQuery, RecordDetail, RecordFieldValue, RecordListRequest, RecordListResult, RecordRef,
  RecordSummary, RecordTypeKey, RecordsGateway, ScalarValue,
} from '@proseit/paep-contracts';
import { adapterError } from './errors.js';
import { collectionPath, documentPath, validEntityId, type CompiledResource } from './resources.js';
import type { Transport } from './transport.js';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
const MAX_FILTERS = 20;
const MAX_LIST_VALUES = 100;
const CURSOR = /^o:(0|[1-9]\d{0,8})$/;

export type ResourceLookup = (recordType: RecordTypeKey) => CompiledResource;
export type ServerDocument = Readonly<Record<string, unknown>>;

const isScalar = (v: unknown): v is ScalarValue => v === null || typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v));

/** Server document → semantic fields of the map. A value of any other shape is a malformed response. */
export function mapFields(r: CompiledResource, doc: ServerDocument, correlationId: string): Readonly<Record<string, RecordFieldValue>> {
  const out: Record<string, RecordFieldValue> = {};
  for (const [key, server] of r.fields) {
    if (!Object.hasOwn(doc, server)) continue;
    const v = doc[server];
    if (isScalar(v)) out[key] = v;
    else if (Array.isArray(v) && v.length <= MAX_LIST_VALUES && v.every(isScalar)) out[key] = Object.freeze([...v]);
    else throw adapterError('MALFORMED_RESPONSE', correlationId);
  }
  return Object.freeze(out);
}

/** The server document's name and modified token, both required. */
export function identityOf(doc: unknown, correlationId: string): { doc: ServerDocument; id: string; version: string } {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) throw adapterError('MALFORMED_RESPONSE', correlationId);
  const d = doc as ServerDocument;
  const id = d['name'];
  const version = d['modified'];
  if (!validEntityId(id) || typeof version !== 'string' || !version.length || version.length > 64) throw adapterError('MALFORMED_RESPONSE', correlationId);
  return { doc: d, id, version };
}

/** `data` of a Frappe resource response. */
export const resourceData = (body: unknown): unknown => (body && typeof body === 'object' && 'data' in body ? (body as { data: unknown }).data : undefined);

const escapeLike = (s: string): string => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function serverFilter(r: CompiledResource, f: FieldFilter): readonly unknown[] {
  const server = r.fields.get(f.field);
  const ops = r.filterable.get(f.field);
  if (!server || !ops) throw adapterError('UNKNOWN_FIELD');
  if (!ops.has(f.operator)) throw adapterError('UNSUPPORTED_OPERATOR');
  const v: FilterValue | undefined = f.value;
  const scalar = () => { if (!isScalar(v)) throw adapterError('INVALID_QUERY'); return v; };
  const list = (min: number, max: number) => {
    if (!Array.isArray(v) || v.length < min || v.length > max || !v.every(isScalar)) throw adapterError('INVALID_QUERY');
    return [...v];
  };
  const text = () => { if (typeof v !== 'string' || !v.length || v.length > 140) throw adapterError('INVALID_QUERY'); return v; };
  switch (f.operator) {
    case 'eq': return [server, '=', scalar()];
    case 'neq': return [server, '!=', scalar()];
    case 'gt': return [server, '>', scalar()];
    case 'gte': return [server, '>=', scalar()];
    case 'lt': return [server, '<', scalar()];
    case 'lte': return [server, '<=', scalar()];
    case 'in': return [server, 'in', list(1, MAX_LIST_VALUES)];
    case 'notIn': return [server, 'not in', list(1, MAX_LIST_VALUES)];
    case 'between': return [server, 'between', list(2, 2)];
    case 'contains': return [server, 'like', `%${escapeLike(text())}%`];
    case 'startsWith': return [server, 'like', `${escapeLike(text())}%`];
    case 'isNull': if (v !== undefined) throw adapterError('INVALID_QUERY'); return [server, 'is', 'not set'];
    case 'isNotNull': if (v !== undefined) throw adapterError('INVALID_QUERY'); return [server, 'is', 'set'];
  }
}

/** Builds the Frappe list query; every part is validated against the map first. */
export function listQuery(r: CompiledResource, query: ListQuery | undefined): { params: Record<string, string>; offset: number; limit: number } {
  const limit = query?.page?.limit ?? DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) throw adapterError('INVALID_QUERY');
  const cursor = query?.page?.cursor;
  const match = cursor === undefined ? undefined : CURSOR.exec(cursor);
  if (cursor !== undefined && !match) throw adapterError('INVALID_CURSOR');
  const offset = match ? Number(match[1]) : 0;
  const filters = query?.filters ?? [];
  if (filters.length > MAX_FILTERS) throw adapterError('INVALID_QUERY');
  const sort = query?.sort ?? [];
  if (sort.length > r.sortable.size) throw adapterError('INVALID_QUERY');
  const order = sort.map((s) => {
    if (!r.sortable.has(s.field) || (s.direction !== 'asc' && s.direction !== 'desc')) throw adapterError('UNKNOWN_FIELD');
    return `${r.fields.get(s.field)} ${s.direction}`;
  });
  const params: Record<string, string> = {
    fields: JSON.stringify(['name', 'modified', ...r.fields.values()]),
    filters: JSON.stringify(filters.map((f) => serverFilter(r, f))),
    order_by: [...order, 'modified desc', 'name asc'].join(', '),
    limit_start: String(offset),
    limit_page_length: String(limit + 1),
  };
  return { params, offset, limit };
}

export function createRecordsGateway(transport: Transport, lookup: ResourceLookup, ready: () => Promise<void>): RecordsGateway {
  return Object.freeze({
    async list(request: RecordListRequest): Promise<RecordListResult> {
      const r = lookup(request.recordType);
      const q = listQuery(r, request.query);
      await ready();
      const response = await transport.send({ method: 'GET', path: collectionPath(r), query: q.params });
      const rows = resourceData(response.body);
      if (!Array.isArray(rows) || rows.length > q.limit + 1) throw adapterError('MALFORMED_RESPONSE', response.correlationId);
      const items: RecordSummary[] = rows.slice(0, q.limit).map((row) => {
        const { doc, id, version } = identityOf(row, response.correlationId);
        return Object.freeze({ recordType: r.recordType, id, fields: mapFields(r, doc, response.correlationId), concurrency: Object.freeze({ serverVersion: version }) });
      });
      return Object.freeze({
        items: Object.freeze(items),
        ...(rows.length > q.limit ? { nextCursor: `o:${q.offset + q.limit}` } : {}),
        correlationId: response.correlationId,
      });
    },

    async get(ref: RecordRef): Promise<RecordDetail> {
      const r = lookup(ref.recordType);
      if (!validEntityId(ref.id)) throw adapterError('INVALID_REFERENCE');
      await ready();
      const response = await transport.send({ method: 'GET', path: documentPath(r, ref.id) });
      const { doc, id, version } = identityOf(resourceData(response.body), response.correlationId);
      if (id !== ref.id) throw adapterError('MALFORMED_RESPONSE', response.correlationId);
      return Object.freeze({ recordType: r.recordType, id, fields: mapFields(r, doc, response.correlationId), concurrency: Object.freeze({ serverVersion: version }), correlationId: response.correlationId });
    },
  });
}
