/**
 * Approved, compiled resource map (ADR-011 §2.4, AC-IB4-03). The only adapter file that knows the Frappe REST resource
 * path. Callers pass a semantic record-type key; the map names the DocType, its allowlisted fields, sort keys, filter
 * operators, workflow vocabulary and whether files are exposed. Anything not in the map is refused before a request.
 */
import type { EntityId, FilterOperator, MessageKey, RecordTypeKey } from '@proseit/paep-contracts';

/** Workflow vocabulary: server state and action names mapped to semantic keys and message keys. */
export interface WorkflowDefinition {
  /** Server field holding the workflow state (Frappe default: workflow_state). */
  readonly stateField: string;
  readonly states: Readonly<Record<string, { readonly key: string; readonly labelKey: MessageKey }>>;
  readonly actions: Readonly<Record<string, { readonly id: string; readonly labelKey: MessageKey }>>;
}

/** One approved resource. `fields` maps semantic field keys to server field names. */
export interface ResourceDefinition {
  readonly doctype: string;
  readonly fields: Readonly<Record<string, string>>;
  readonly sortable?: readonly string[];
  readonly filterable?: Readonly<Record<string, readonly FilterOperator[]>>;
  readonly workflow?: WorkflowDefinition;
  readonly files?: boolean;
}

export type ResourceMapDefinition = Readonly<Record<RecordTypeKey, ResourceDefinition>>;

/** A validated resource. The DocType name stays inside the adapter. */
export interface CompiledResource {
  readonly recordType: RecordTypeKey;
  readonly doctype: string;
  readonly fields: ReadonlyMap<string, string>;
  readonly sortable: ReadonlySet<string>;
  readonly filterable: ReadonlyMap<string, ReadonlySet<FilterOperator>>;
  readonly workflow?: {
    readonly stateField: string;
    readonly states: ReadonlyMap<string, { readonly key: string; readonly labelKey: MessageKey }>;
    readonly actions: ReadonlyMap<string, { readonly id: string; readonly labelKey: MessageKey }>;
  };
  readonly files: boolean;
}

/** Opaque compiled map; only compileResourceMap creates one. */
export interface CompiledResourceMap {
  readonly recordTypes: readonly RecordTypeKey[];
}

const OPERATORS: readonly FilterOperator[] = ['eq', 'neq', 'in', 'notIn', 'gt', 'gte', 'lt', 'lte', 'between', 'contains', 'startsWith', 'isNull', 'isNotNull'];
const RECORD_TYPE = /^[a-z][a-z0-9.-]{0,63}$/;
const DOCTYPE = /^[A-Z][A-Za-z0-9 _-]{0,139}$/;
const SEMANTIC = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const SERVER_FIELD = /^[a-z][a-z0-9_]{0,63}$/;
const ACTION_ID = /^[a-z][a-z0-9-]{0,63}$/;
const MESSAGE_KEY = /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+){1,7}$/;
const SERVER_NAME = /^[^\u0000-\u001f\u007f]{1,140}$/;
/** Server fields the adapter reads itself; they are never mapped as record fields. */
const RESERVED = new Set(['name', 'modified', 'creation', 'owner', 'modified_by', 'docstatus', 'idx', 'doctype']);
const ENTITY_ID = /^[^\u0000-\u001f\u007f/\\]{1,140}$/;

const compiled = new WeakMap<CompiledResourceMap, ReadonlyMap<RecordTypeKey, CompiledResource>>();

function fail(message: string): never {
  throw new TypeError(`Frappe resource map: ${message}`);
}

/** Validates and freezes a resource map. Construction fails on any unapproved shape. */
export function compileResourceMap(definition: ResourceMapDefinition): CompiledResourceMap {
  const out = new Map<RecordTypeKey, CompiledResource>();
  const doctypes = new Set<string>();
  for (const [recordType, r] of Object.entries(definition)) {
    if (!RECORD_TYPE.test(recordType)) fail(`record type key "${recordType}" is not a semantic key`);
    if (!DOCTYPE.test(r.doctype) || r.doctype === 'File') fail(`${recordType}: DocType name rejected`);
    if (doctypes.has(r.doctype)) fail(`${recordType}: DocType mapped twice`);
    doctypes.add(r.doctype);
    const fields = new Map<string, string>();
    for (const [key, server] of Object.entries(r.fields)) {
      if (!SEMANTIC.test(key) || key === 'id') fail(`${recordType}: field key "${key}" rejected`);
      if (!SERVER_FIELD.test(server) || RESERVED.has(server)) fail(`${recordType}.${key}: server field rejected`);
      fields.set(key, server);
    }
    const sortable = new Set(r.sortable ?? []);
    for (const key of sortable) if (!fields.has(key)) fail(`${recordType}: sort key "${key}" is not a mapped field`);
    const filterable = new Map<string, ReadonlySet<FilterOperator>>();
    for (const [key, ops] of Object.entries(r.filterable ?? {})) {
      if (!fields.has(key)) fail(`${recordType}: filter key "${key}" is not a mapped field`);
      if (!ops.length || ops.some((op) => !OPERATORS.includes(op))) fail(`${recordType}.${key}: filter operators rejected`);
      filterable.set(key, new Set(ops));
    }
    let workflow: CompiledResource['workflow'];
    if (r.workflow) {
      const w = r.workflow;
      if (!SERVER_FIELD.test(w.stateField)) fail(`${recordType}: workflow state field rejected`);
      const states = new Map<string, { key: string; labelKey: MessageKey }>();
      for (const [server, s] of Object.entries(w.states)) {
        if (!SERVER_NAME.test(server) || !ACTION_ID.test(s.key) || !MESSAGE_KEY.test(s.labelKey)) fail(`${recordType}: workflow state "${server}" rejected`);
        states.set(server, Object.freeze({ key: s.key, labelKey: s.labelKey }));
      }
      const actions = new Map<string, { id: string; labelKey: MessageKey }>();
      const ids = new Set<string>();
      for (const [server, a] of Object.entries(w.actions)) {
        if (!SERVER_NAME.test(server) || !ACTION_ID.test(a.id) || !MESSAGE_KEY.test(a.labelKey) || ids.has(a.id)) fail(`${recordType}: workflow action "${server}" rejected`);
        ids.add(a.id);
        actions.set(server, Object.freeze({ id: a.id, labelKey: a.labelKey }));
      }
      if (!states.size || !actions.size) fail(`${recordType}: workflow without states or actions`);
      workflow = Object.freeze({ stateField: w.stateField, states, actions });
    }
    out.set(recordType, Object.freeze({ recordType, doctype: r.doctype, fields, sortable, filterable, ...(workflow ? { workflow } : {}), files: r.files === true }));
  }
  const handle: CompiledResourceMap = Object.freeze({ recordTypes: Object.freeze([...out.keys()]) });
  compiled.set(handle, out);
  return handle;
}

/** The compiled resources of a map created by compileResourceMap; undefined for anything else. */
export function resourcesOf(map: CompiledResourceMap): ReadonlyMap<RecordTypeKey, CompiledResource> | undefined {
  return compiled.get(map);
}

/** A record identifier that can be placed in a path segment. */
export const validEntityId = (id: unknown): id is EntityId => typeof id === 'string' && ENTITY_ID.test(id);

const RESOURCE = '/api/resource/';

/** Collection path of a resource. */
export const collectionPath = (r: CompiledResource): string => `${RESOURCE}${encodeURIComponent(r.doctype)}`;
/** Document path of one record (the id is validated by the caller). */
export const documentPath = (r: CompiledResource, id: EntityId): string => `${collectionPath(r)}/${encodeURIComponent(id)}`;
/** Frappe's File resource: read only through the files port, filtered to one record's attachments. */
export const FILE_COLLECTION = `${RESOURCE}File`;
export const fileDocumentPath = (id: EntityId): string => `${FILE_COLLECTION}/${encodeURIComponent(id)}`;
