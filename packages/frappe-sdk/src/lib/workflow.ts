/**
 * Workflow (AC-IB4-04). Allowed actions are the server's latest transition set, filtered to the approved vocabulary of
 * the resource map. A transition outside that set, or against a stale concurrency token, is refused before any write;
 * the server still decides, and a server denial maps to an authorization error.
 */
import type {
  RecordRef, RecordTypeKey, WorkflowAction, WorkflowGateway, WorkflowState, WorkflowTransitionRequest, WorkflowTransitionResult,
} from '@proseit/paep-contracts';
import { adapterError } from './errors.js';
import { METHOD, methodMessage } from './methods.js';
import { identityOf, resourceData, type ResourceLookup, type ServerDocument } from './records.js';
import { documentPath, validEntityId, type CompiledResource } from './resources.js';
import type { Transport } from './transport.js';

type Workflow = NonNullable<CompiledResource['workflow']>;
interface Latest { readonly doc: ServerDocument; readonly version: string; readonly state: WorkflowState; readonly serverActions: ReadonlyMap<string, string> }

function workflowOf(r: CompiledResource): Workflow {
  if (!r.workflow) throw adapterError('WORKFLOW_UNSUPPORTED');
  return r.workflow;
}

function stateOf(w: Workflow, doc: ServerDocument, correlationId: string): { key: string; labelKey: string } {
  const server = doc[w.stateField];
  const state = typeof server === 'string' ? w.states.get(server) : undefined;
  if (!state) throw adapterError('MALFORMED_RESPONSE', correlationId);
  return state;
}

export function createWorkflowGateway(transport: Transport, lookup: ResourceLookup, ready: () => Promise<void>, newKey: () => string): WorkflowGateway {
  async function latest(r: CompiledResource, id: string): Promise<Latest> {
    const w = workflowOf(r);
    await ready();
    const read = await transport.send({ method: 'GET', path: documentPath(r, id) });
    const { doc, id: name, version } = identityOf(resourceData(read.body), read.correlationId);
    if (name !== id) throw adapterError('MALFORMED_RESPONSE', read.correlationId);
    const state = stateOf(w, doc, read.correlationId);
    // Only the record reference is sent: the server loads the document itself, so no field value enters the URL.
    const t = await transport.send({ method: 'GET', path: METHOD.workflowTransitions, query: { doc: JSON.stringify({ doctype: r.doctype, name: id }) } });
    const list = methodMessage(t.body);
    if (!Array.isArray(list)) throw adapterError('MALFORMED_RESPONSE', t.correlationId);
    const allowed: WorkflowAction[] = [];
    const serverActions = new Map<string, string>();
    for (const item of list) {
      const action = item && typeof item === 'object' ? (item as { action?: unknown }).action : undefined;
      // Only actions of the approved vocabulary are offered; an unknown server action is never surfaced.
      const known = typeof action === 'string' ? w.actions.get(action) : undefined;
      if (!known || serverActions.has(known.id)) continue;
      serverActions.set(known.id, action as string);
      allowed.push(Object.freeze({ id: known.id, labelKey: known.labelKey }));
    }
    return {
      doc, version, serverActions,
      state: Object.freeze({ stateKey: state.key, labelKey: state.labelKey, allowedActions: Object.freeze(allowed), concurrency: Object.freeze({ serverVersion: version }) }),
    };
  }

  return Object.freeze({
    async getState(ref: RecordRef): Promise<WorkflowState> {
      const r = lookup(ref.recordType);
      workflowOf(r);
      if (!validEntityId(ref.id)) throw adapterError('INVALID_REFERENCE');
      return (await latest(r, ref.id)).state;
    },

    async transition(recordType: RecordTypeKey, request: WorkflowTransitionRequest): Promise<WorkflowTransitionResult> {
      const r = lookup(recordType);
      const w = workflowOf(r);
      if (!validEntityId(request.recordId)) throw adapterError('INVALID_REFERENCE');
      // pmra-api-v1 carries no transition reason or evidence: refusing them is safer than dropping them silently.
      if (request.reason !== undefined || request.evidenceFileIds !== undefined) throw adapterError('WORKFLOW_UNSUPPORTED_INPUT');
      const token = request.concurrency.serverVersion;
      if (typeof token !== 'string' || !token.length) throw adapterError('CONCURRENCY_TOKEN_MISSING');
      const current = await latest(r, request.recordId);
      if (current.version !== token) throw adapterError('RECORD_CONFLICT');
      const serverAction = current.serverActions.get(request.actionId);
      if (serverAction === undefined) throw adapterError('WORKFLOW_ACTION_NOT_ALLOWED');
      const response = await transport.send({
        method: 'POST', path: METHOD.applyWorkflow,
        // The record reference and the caller's version only; no other field value is sent. The version check above is
        // the adapter's; whether the server re-checks it atomically depends on the backend method (see the design §6).
        body: { doc: { doctype: r.doctype, name: request.recordId, modified: token }, action: serverAction },
        idempotencyKey: request.idempotencyKey ?? newKey(),
      });
      const { doc, version } = identityOf(methodMessage(response.body), response.correlationId);
      const state = stateOf(w, doc, response.correlationId);
      return Object.freeze({
        state: Object.freeze({ stateKey: state.key, labelKey: state.labelKey, allowedActions: Object.freeze([]), concurrency: Object.freeze({ serverVersion: version }) }),
        concurrency: Object.freeze({ serverVersion: version }),
        correlationId: response.correlationId,
      });
    },
  });
}
