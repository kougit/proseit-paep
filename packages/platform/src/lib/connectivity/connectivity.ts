/**
 * Connectivity signal seam (IB3, HOF-IB3-001 SCR-SHELL-014). Framework-neutral: no Angular and no DOM types; the host
 * passes the browser objects structurally. It only reports what the platform observes. It never queues, replays or
 * syncs anything, and a state is presentation information, not a guarantee that a request will succeed.
 */

/** Observed connection state. `degraded` and `unknown` come from the host (for example its request layer). */
export type ConnectivityState = 'online' | 'offline' | 'degraded' | 'unknown';

export const CONNECTIVITY_STATES: readonly ConnectivityState[] = ['online', 'offline', 'degraded', 'unknown'];

/** A read-only connectivity source. `subscribe` returns its own unsubscribe function. */
export interface ConnectivitySource {
  current(): ConnectivityState;
  subscribe(listener: (state: ConnectivityState) => void): () => void;
}

/** The parts of `window` the browser source needs, typed structurally so this package needs no DOM library. */
export interface ConnectivityHost {
  readonly navigator: { readonly onLine?: boolean };
  addEventListener(type: 'online' | 'offline', listener: () => void): void;
  removeEventListener(type: 'online' | 'offline', listener: () => void): void;
}

/**
 * Source driven by the browser `online` / `offline` events. `navigator.onLine === false` is reliable; `true` only
 * means a network interface is up, so the host may report `degraded` or `unknown` through `report`.
 */
export function browserConnectivitySource(host: ConnectivityHost): ConnectivitySource & { report(state: ConnectivityState): void } {
  let state: ConnectivityState = host.navigator.onLine === false ? 'offline' : host.navigator.onLine === true ? 'online' : 'unknown';
  const listeners = new Set<(s: ConnectivityState) => void>();
  const set = (next: ConnectivityState) => {
    if (!CONNECTIVITY_STATES.includes(next) || next === state) return;
    state = next;
    for (const l of [...listeners]) l(state);
  };
  const onOnline = () => set('online');
  const onOffline = () => set('offline');
  return {
    current: () => state,
    subscribe(listener) {
      if (listeners.size === 0) {
        host.addEventListener('online', onOnline);
        host.addEventListener('offline', onOffline);
      }
      listeners.add(listener);
      return () => {
        if (!listeners.delete(listener) || listeners.size > 0) return;
        host.removeEventListener('online', onOnline);
        host.removeEventListener('offline', onOffline);
      };
    },
    report: set,
  };
}
