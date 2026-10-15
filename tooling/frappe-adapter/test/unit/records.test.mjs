// IB4 records: compiled resource map, typed list and detail reads (AC-IB4-03).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { json, makeAdapter, RESOURCE_DEFINITION, sdk, X } from '../support/backend.mjs';

const LIST_PATH = '/api/resource/PMRA%20Inspection';
const row = (n, over = {}) => ({ name: `INS-000${n}`, modified: `2026-10-15 09:00:0${n}.000000`, title: `Site ${n}`, status: 'Open', score: n, site_code: null, ...over });
const listX = (rows) => ({ request: { method: 'GET', path: LIST_PATH }, response: json(200, { data: rows }) });

test('the resource map rejects unapproved shapes at compile time', () => {
  const base = RESOURCE_DEFINITION.inspection;
  const bad = [
    { 'Not A Key': base },
    { inspection: { ...base, doctype: 'tab Inspection; drop' } },
    { inspection: { ...base, doctype: 'File' } },
    { inspection: base, other: { ...base } },
    { inspection: { ...base, fields: { title: 'Title' } } },
    { inspection: { ...base, fields: { id: 'title' } } },
    { inspection: { ...base, fields: { owner: 'owner' } } },
    { inspection: { ...base, sortable: ['unknown'] } },
    { inspection: { ...base, filterable: { title: ['regex'] } } },
    { inspection: { ...base, filterable: { unknown: ['eq'] } } },
    { inspection: { ...base, workflow: { ...base.workflow, actions: {} } } },
    { inspection: { ...base, workflow: { ...base.workflow, actions: { A: { id: 'x', labelKey: 'Free text label' } } } } },
  ];
  for (const def of bad) assert.throws(() => sdk.compileResourceMap(def), TypeError);
  const compiled = sdk.compileResourceMap(RESOURCE_DEFINITION);
  assert.deepEqual(compiled.recordTypes, ['inspection', 'site']);
  assert.ok(Object.isFrozen(compiled));
  assert.ok(!JSON.stringify(compiled).includes('PMRA'), 'no DocType name leaves the compiled map');
});

test('list builds an allowlisted, cursor-paged Frappe query', async () => {
  const { adapter, backend } = makeAdapter([X.compatible, listX([row(1), row(2), row(3)])]);
  const result = await adapter.records.list({
    recordType: 'inspection',
    query: { page: { limit: 2 }, sort: [{ field: 'score', direction: 'desc' }], filters: [{ field: 'status', operator: 'in', value: ['Open', 'Review'] }, { field: 'title', operator: 'contains', value: '50%_off' }, { field: 'site', operator: 'isNull' }, { field: 'score', operator: 'between', value: [1, 9] }] },
  });
  const q = backend.calls[1].query;
  assert.deepEqual(JSON.parse(q.fields), ['name', 'modified', 'title', 'status', 'score', 'site_code']);
  assert.deepEqual(JSON.parse(q.filters), [['status', 'in', ['Open', 'Review']], ['title', 'like', '%50\\%\\_off%'], ['site_code', 'is', 'not set'], ['score', 'between', [1, 9]]]);
  assert.equal(q.order_by, 'score desc, modified desc, name asc');
  assert.equal(q.limit_start, '0');
  assert.equal(q.limit_page_length, '3');
  assert.equal(result.items.length, 2);
  assert.equal(result.nextCursor, 'o:2');
  assert.deepEqual(result.items[0], { recordType: 'inspection', id: 'INS-0001', fields: { title: 'Site 1', status: 'Open', score: 1, site: null }, concurrency: { serverVersion: '2026-10-15 09:00:01.000000' } });
});

test('the next page uses the cursor; the last page has no cursor', async () => {
  const { adapter, backend } = makeAdapter([X.compatible, listX([row(3)])]);
  const result = await adapter.records.list({ recordType: 'inspection', query: { page: { limit: 2, cursor: 'o:2' } } });
  assert.equal(backend.calls[1].query.limit_start, '2');
  assert.equal(result.nextCursor, undefined);
  assert.equal(result.items.length, 1);
});

test('unknown resources, fields, operators, malformed values and cursors are refused before any request', async () => {
  const bad = [
    { recordType: 'unknown' },
    { recordType: 'Inspection' },
    { recordType: 'PMRA Inspection' },
    { recordType: 'inspection', query: { filters: [{ field: 'owner', operator: 'eq', value: 'x' }] } },
    { recordType: 'inspection', query: { filters: [{ field: 'title', operator: 'eq', value: 'x' }] } },
    { recordType: 'inspection', query: { filters: [{ field: 'status', operator: 'in', value: [] }] } },
    { recordType: 'inspection', query: { filters: [{ field: 'status', operator: 'eq', value: { $ne: 1 } }] } },
    { recordType: 'inspection', query: { filters: [{ field: 'score', operator: 'between', value: [1] }] } },
    { recordType: 'inspection', query: { filters: [{ field: 'site', operator: 'isNull', value: 'x' }] } },
    { recordType: 'inspection', query: { sort: [{ field: 'status', direction: 'asc' }] } },
    { recordType: 'inspection', query: { sort: [{ field: 'title', direction: 'sideways' }] } },
    { recordType: 'inspection', query: { page: { limit: 0 } } },
    { recordType: 'inspection', query: { page: { limit: 101 } } },
    { recordType: 'inspection', query: { page: { cursor: '20' } } },
    { recordType: 'inspection', query: { page: { cursor: 'o:-1' } } },
    { recordType: 'inspection', query: { filters: Array.from({ length: 21 }, () => ({ field: 'status', operator: 'eq', value: 'Open' })) } },
  ];
  for (const request of bad) {
    const { adapter, backend } = makeAdapter([]);
    await assert.rejects(adapter.records.list(request), (e) => e.category === 'validation', JSON.stringify(request));
    assert.equal(backend.calls.length, 0, JSON.stringify(request));
  }
  for (const ref of [{ recordType: 'nope', id: 'x' }, { recordType: 'inspection', id: '' }, { recordType: 'inspection', id: '../File/x' }, { recordType: 'inspection', id: 'a\\b' },
    { recordType: 'inspection', id: 'INV//1' }, { recordType: 'inspection', id: './x' }, { recordType: 'inspection', id: 'INV/..' }, { recordType: 'inspection', id: '/INV' }, { recordType: 'inspection', id: 'INV/' }]) {
    const { adapter, backend } = makeAdapter([]);
    await assert.rejects(adapter.records.get(ref), (e) => e.category === 'validation');
    assert.equal(backend.calls.length, 0);
  }
});

test('detail returns the mapped fields and the server modified value as concurrency token', async () => {
  const { adapter, backend } = makeAdapter([X.compatible, { request: { method: 'GET', path: '/api/resource/PMRA%20Inspection/INS%200001' }, response: json(200, { data: row(1, { name: 'INS 0001', secret_internal: 'x' }) }) }]);
  const detail = await adapter.records.get({ recordType: 'inspection', id: 'INS 0001' });
  assert.equal(backend.calls[1].path, '/api/resource/PMRA%20Inspection/INS%200001');
  assert.deepEqual(detail.fields, { title: 'Site 1', status: 'Open', score: 1, site: null });
  assert.deepEqual(detail.concurrency, { serverVersion: '2026-10-15 09:00:01.000000' });
  assert.ok(Object.isFrozen(detail) && Object.isFrozen(detail.fields));
  // Frappe naming series may contain "/": such an id is one encoded path segment.
  const series = makeAdapter([X.compatible, { request: { method: 'GET', path: '/api/resource/PMRA%20Inspection/INV%2F24-25%2F0001' }, response: json(200, { data: row(2, { name: 'INV/24-25/0001' }) }) }]);
  const named = await series.adapter.records.get({ recordType: 'inspection', id: 'INV/24-25/0001' });
  assert.equal(named.id, 'INV/24-25/0001');
  assert.equal(series.backend.calls[1].path, '/api/resource/PMRA%20Inspection/INV%2F24-25%2F0001');
});

test('malformed list and detail responses are rejected, not partially mapped', async () => {
  const cases = [
    listX({ not: 'an array' }),
    listX([{ modified: 'x' }]),
    listX([row(1, { title: { nested: true } })]),
    listX([{ name: 'INS-0001' }]),
    listX([row(1, { title: [{ a: 1 }] })]),
    listX(Array.from({ length: 22 }, (_, i) => row(i))),
  ];
  for (const x of cases) {
    const { adapter } = makeAdapter([X.compatible, x]);
    await assert.rejects(adapter.records.list({ recordType: 'inspection' }), (e) => e.code === 'MALFORMED_RESPONSE');
  }
  const mismatch = makeAdapter([X.compatible, { request: { method: 'GET', path: `${LIST_PATH}/INS-0001` }, response: json(200, { data: row(2) }) }]);
  await assert.rejects(mismatch.adapter.records.get({ recordType: 'inspection', id: 'INS-0001' }), (e) => e.code === 'MALFORMED_RESPONSE');
});
