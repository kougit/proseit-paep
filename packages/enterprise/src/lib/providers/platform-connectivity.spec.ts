// The platform package stays framework- and test-runner-neutral (lib ES2022, no test files), so its browser
// connectivity source is exercised here, where the shell consumes it.
import { browserConnectivitySource, type ConnectivityHost } from '@proseit/paep-platform';

function fakeHost(onLine: boolean | undefined) {
  const handlers = { online: new Set<() => void>(), offline: new Set<() => void>() };
  const host: ConnectivityHost & { fire(t: 'online' | 'offline'): void; count(): number } = {
    navigator: onLine === undefined ? {} : { onLine },
    addEventListener: (t, l) => void handlers[t].add(l),
    removeEventListener: (t, l) => void handlers[t].delete(l),
    fire: (t) => handlers[t].forEach((l) => l()),
    count: () => handlers.online.size + handlers.offline.size,
  };
  return host;
}

describe('browserConnectivitySource', () => {
  it('starts from navigator.onLine, and unknown when the browser does not say', () => {
    expect(browserConnectivitySource(fakeHost(true)).current()).toBe('online');
    expect(browserConnectivitySource(fakeHost(false)).current()).toBe('offline');
    expect(browserConnectivitySource(fakeHost(undefined)).current()).toBe('unknown');
  });

  it('notifies on change only, and only while subscribed', () => {
    const host = fakeHost(true);
    const source = browserConnectivitySource(host);
    const seen: string[] = [];
    const stop = source.subscribe((s) => seen.push(s));
    host.fire('online');
    host.fire('offline');
    host.fire('offline');
    host.fire('online');
    expect(seen).toEqual(['offline', 'online']);
    stop();
    expect(host.count()).toBe(0);
    host.fire('offline');
    expect(seen).toEqual(['offline', 'online']);
  });

  it('lets the host report degraded or unknown, and ignores values outside the vocabulary', () => {
    const source = browserConnectivitySource(fakeHost(true));
    const seen: string[] = [];
    source.subscribe((s) => seen.push(s));
    source.report('degraded');
    source.report('queued' as never);
    source.report('unknown');
    expect(seen).toEqual(['degraded', 'unknown']);
    expect(source.current()).toBe('unknown');
  });
});
