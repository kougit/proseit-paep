/**
 * Polling freshness (D4, ADR-011 §2.9, AC-IB4-08). A bounded poll reads one lightweight change token (newest name and
 * modified value) per subscribed scope and emits invalidation signals only: no field value ever travels with a signal,
 * and consumers reconcile through an authoritative read. The first poll of a scope sets its baseline; an unreadable
 * cursor, a recovery after a failed poll, or a reconnection emits `resync` for every scope.
 */
import type {
  ConnectivitySource,
} from '@proseit/paep-platform';
import type {
  FreshnessBatch, FreshnessGateway, FreshnessPollRequest, FreshnessScope, InvalidationSignal,
} from '@proseit/paep-contracts';
import { adapterError } from './errors.js';
import { identityOf, resourceData, type ResourceLookup } from './records.js';
import { collectionPath, validEntityId, validRecordTypeKey } from './resources.js';
import type { Transport } from './transport.js';

export const MAX_SCOPES = 20;
export const MIN_POLL_INTERVAL_MS = 5_000;
export const DEFAULT_POLL_INTERVAL_MS = 15_000;
export const MAX_POLL_INTERVAL_MS = 300_000;
const NONE = '-';
const TOKEN = /^[^\u0000-\u001f\u007f]{1,220}$/;

const scopeKey = (s: FreshnessScope): string => (s.kind === 'record' ? `r|${s.recordType}|${s.id ?? ''}` : `t|${s.recordType}`);

function parseCursor(cursor: string | undefined): Map<string, string> | undefined {
  if (cursor === undefined) return new Map();
  try {
    const o: unknown = JSON.parse(cursor);
    if (!o || typeof o !== 'object' || Array.isArray(o)) return undefined;
    const entries = Object.entries(o as Record<string, unknown>);
    if (entries.length > MAX_SCOPES || entries.some(([k, v]) => k.length > 220 || typeof v !== 'string' || !TOKEN.test(v))) return undefined;
    return new Map(entries as [string, string][]);
  } catch {
    return undefined;
  }
}

export function createFreshnessGateway(transport: Transport, lookup: ResourceLookup, ready: () => Promise<void>, now: () => Date): FreshnessGateway {
  return Object.freeze({
    async poll(request: FreshnessPollRequest): Promise<FreshnessBatch> {
      const scopes = request.scopes;
      if (!scopes.length || scopes.length > MAX_SCOPES) throw adapterError('INVALID_QUERY');
      const resources = scopes.map((s) => {
        const r = lookup(s.recordType);
        if (s.kind === 'record' ? !validEntityId(s.id) : s.kind !== 'record-type' || s.id !== undefined) throw adapterError('INVALID_REFERENCE');
        return r;
      });
      const previous = parseCursor(request.cursor);
      await ready();
      const next = new Map<string, string>();
      const signals: InvalidationSignal[] = [];
      for (const [i, scope] of scopes.entries()) {
        const key = scopeKey(scope);
        if (next.has(key)) continue;
        const r = resources[i];
        if (!r) continue;
        const response = await transport.send({
          method: 'GET', path: collectionPath(r),
          query: {
            fields: JSON.stringify(['name', 'modified']),
            filters: JSON.stringify(scope.kind === 'record' ? [['name', '=', scope.id]] : []),
            order_by: 'modified desc, name asc',
            limit_page_length: '1',
          },
        });
        const rows = resourceData(response.body);
        if (!Array.isArray(rows) || rows.length > 1) throw adapterError('MALFORMED_RESPONSE', response.correlationId);
        const token = rows[0] === undefined ? NONE : (({ id, version }) => `${version}|${id}`)(identityOf(rows[0], response.correlationId));
        next.set(key, token);
        const reason = previous === undefined ? 'resync' : previous.has(key) && previous.get(key) !== token ? 'changed' : undefined;
        if (reason) signals.push(Object.freeze({ scope: Object.freeze({ ...scope }), reason, observedAt: now().toISOString() }));
      }
      return Object.freeze({ signals: Object.freeze(signals), cursor: JSON.stringify(Object.fromEntries(next)) });
    },
  });
}

/** Receives invalidation signals. It must reconcile through an authoritative read and never treat a signal as data. */
export type InvalidationListener = (signal: InvalidationSignal) => void;

export interface FreshnessPollerOptions {
  readonly gateway: FreshnessGateway;
  /** Poll interval; values below MIN_POLL_INTERVAL_MS are raised to it, above MAX_POLL_INTERVAL_MS lowered. */
  readonly intervalMs?: number;
  /** Reconnection source: going online after offline triggers a resync. */
  readonly connectivity?: ConnectivitySource;
  readonly now?: () => Date;
  readonly timers?: { setTimeout(fn: () => void, ms: number): unknown; clearTimeout(handle: unknown): void };
}

export interface FreshnessPoller {
  /** Starts polling on the first subscription; returns the unsubscribe function (polling stops with the last one). */
  subscribe(scope: FreshnessScope, listener: InvalidationListener): () => void;
}

/** Bounded polling driver: one poll in flight, an enforced minimum interval, bounded backoff after failures. */
export function createFreshnessPoller(options: FreshnessPollerOptions): FreshnessPoller {
  const interval = Math.min(MAX_POLL_INTERVAL_MS, Math.max(MIN_POLL_INTERVAL_MS, Number.isFinite(options.intervalMs) ? (options.intervalMs as number) : DEFAULT_POLL_INTERVAL_MS));
  const timers = options.timers ?? { setTimeout: (fn: () => void, ms: number) => globalThis.setTimeout(fn, ms), clearTimeout: (h: unknown) => globalThis.clearTimeout(h as ReturnType<typeof setTimeout>) };
  const now = options.now ?? (() => new Date());
  const subs = new Map<string, { scope: FreshnessScope; listeners: Set<InvalidationListener> }>();
  let cursor: string | undefined;
  let failures = 0;
  let recovering = false;
  let inFlight = false;
  let timer: unknown;
  let disconnect: (() => void) | undefined;
  let lastConnectivity = options.connectivity?.current();

  const deliver = (signal: InvalidationSignal) => {
    for (const { scope, listeners } of subs.values()) {
      const match = signal.scope.recordType === scope.recordType && (signal.scope.kind === 'record-type' || scopeKey(signal.scope) === scopeKey(scope));
      if (!match) continue;
      for (const l of [...listeners]) { try { l(signal); } catch { /* a listener failure never stops polling */ } }
    }
  };
  const resyncAll = () => {
    for (const { scope } of subs.values()) deliver(Object.freeze({ scope, reason: 'resync', observedAt: now().toISOString() }));
  };
  const schedule = (ms: number) => {
    if (timer !== undefined) timers.clearTimeout(timer);
    timer = subs.size ? timers.setTimeout(() => { timer = undefined; void tick(); }, ms) : undefined;
  };
  async function tick(): Promise<void> {
    if (inFlight || !subs.size) return;
    inFlight = true;
    try {
      const batch = await options.gateway.poll({ scopes: [...subs.values()].map((s) => s.scope), ...(cursor !== undefined ? { cursor } : {}) });
      cursor = batch.cursor;
      failures = 0;
      if (recovering) { recovering = false; resyncAll(); }
      for (const s of batch.signals) deliver(s);
      schedule(interval);
    } catch {
      failures += 1;
      recovering = true;
      schedule(Math.min(MAX_POLL_INTERVAL_MS, interval * 2 ** Math.min(failures, 6)));
    } finally {
      inFlight = false;
    }
  }
  const start = () => {
    disconnect = options.connectivity?.subscribe((state) => {
      if (state === 'online' && lastConnectivity === 'offline') { recovering = true; schedule(0); }
      lastConnectivity = state;
    });
    schedule(0);
  };
  const stop = () => {
    if (timer !== undefined) timers.clearTimeout(timer);
    timer = undefined;
    disconnect?.();
    disconnect = undefined;
    cursor = undefined;
    failures = 0;
    recovering = false;
  };

  return Object.freeze({
    subscribe(scope: FreshnessScope, listener: InvalidationListener): () => void {
      // A malformed scope is refused here, so it cannot make every later poll fail for the other subscribers.
      const shapeOk = validRecordTypeKey(scope.recordType)
        && (scope.kind === 'record' ? validEntityId(scope.id) : scope.kind === 'record-type' && scope.id === undefined);
      if (!shapeOk) throw adapterError('INVALID_REFERENCE');
      const key = scopeKey(scope);
      if (!subs.has(key) && subs.size >= MAX_SCOPES) throw adapterError('INVALID_QUERY');
      const first = subs.size === 0;
      const entry = subs.get(key) ?? { scope: Object.freeze({ ...scope }), listeners: new Set<InvalidationListener>() };
      entry.listeners.add(listener);
      subs.set(key, entry);
      if (first) start();
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        entry.listeners.delete(listener);
        if (!entry.listeners.size) subs.delete(key);
        if (!subs.size) stop();
      };
    },
  });
}
