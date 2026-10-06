import { describe, expect, it } from 'vitest';
import { consoleErrorReporter, createCorrelationId, safeRoutePath, sanitizeErrorReport } from './error-reporting';

describe('error-reporting seam', () => {
  it('creates a bounded random correlation reference', () => {
    const a = createCorrelationId();
    expect(a).toMatch(/^ERR-[A-Z0-9]{12}$/);
    expect(createCorrelationId()).not.toBe(a);
  });

  it('keeps only allowlisted fields and drops message, stack, query and unknown values', () => {
    const raw = { kind: 'render', correlationId: 'srv-1234abcd', route: '/orders/42?token=abc#x', retryable: true, message: 'secret', stack: 'at x', user: 'a@b' };
    const r = sanitizeErrorReport(raw, () => new Date('2026-10-06T00:00:00Z'));
    expect(r).toEqual({ kind: 'render', correlationId: 'srv-1234abcd', route: '/orders/42', retryable: true, at: '2026-10-06T00:00:00.000Z' });
    expect(Object.isFrozen(r)).toBe(true);
  });

  it('replaces a malformed correlation id, an unknown kind and an unsafe route', () => {
    const r = sanitizeErrorReport({ kind: 'sql', correlationId: 'john.doe@example.org', route: 'https://evil.example/x', retryable: 'yes' }, undefined, () => 'ERR-FIXED00000000');
    expect(r.kind).toBe('unknown');
    expect(r.correlationId).toBe('ERR-FIXED00000000');
    expect(r.route).toBeUndefined();
    expect(r.retryable).toBe(false);
    expect(safeRoutePath('//evil.example')).toBeUndefined();
    expect(safeRoutePath('/a/<b>')).toBeUndefined();
  });

  it('the default reporter writes only kind and reference', () => {
    const lines: unknown[][] = [];
    consoleErrorReporter({ error: (...a) => lines.push(a) }).report(sanitizeErrorReport({ kind: 'version', correlationId: 'ERR-ABCDEFGH1234' }));
    expect(lines).toEqual([['PAEP error version (ERR-ABCDEFGH1234)']]);
  });
});
