// node:test suite for InMemoryReportingGateway. Run through tooling/test-utils/contracts-qa.mjs, which compiles
// tooling/test-utils/src to os.tmpdir() and passes the output directory in PAEP_TEST_UTILS_DIST.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dist = process.env.PAEP_TEST_UTILS_DIST;
assert.ok(dist, 'PAEP_TEST_UTILS_DIST must be set');
const { InMemoryReportingGateway, REPORTING_FAKE_ERROR_CODES } = await import(pathToFileURL(path.join(dist, 'index.js')).href);

const dataset = {
  id: 'orders',
  version: '1',
  labelKey: 'reports.orders',
  dimensions: [{ key: 'region', labelKey: 'dims.region', dataType: 'string' }],
  metrics: [{ key: 'count', labelKey: 'metrics.count', dataType: 'integer', aggregation: 'count' }]
};
const result = {
  columns: [{ key: 'region', label: 'Region', dataType: 'string' }, { key: 'count', label: 'Count', dataType: 'integer' }],
  rows: [{ region: 'north', count: 3 }],
  freshness: { asOf: '2026-01-01T00:00:00Z', source: 'operational' },
  correlationId: 'seeded-corr'
};
const drill = { ...result, rows: [{ region: 'north-east', count: 1 }], correlationId: 'drill-corr' };
const seed = () => ({ datasets: [dataset], results: [{ datasetId: 'orders', result }], drillResults: [{ target: 'orders-by-site', result: drill }] });
const query = { datasetId: 'orders', metrics: ['count'], dimensions: ['region'] };
const isPaepError = (code) => (e) => {
  assert.ok(!(e instanceof Error), 'rejection is a PaepError-shaped plain object');
  assert.deepEqual(Object.keys(e).sort(), ['category', 'code', 'correlationId', 'messageKey', 'retryable']);
  assert.equal(e.code, code);
  assert.equal(e.category, 'validation');
  assert.equal(e.retryable, false);
  assert.ok(Object.isFrozen(e));
  return true;
};

test('getDataset returns a frozen copy of the seeded descriptor', async () => {
  const gw = new InMemoryReportingGateway(seed());
  const d = await gw.getDataset('orders');
  assert.deepEqual(d, dataset);
  assert.notEqual(d, dataset);
  assert.ok(Object.isFrozen(d) && Object.isFrozen(d.dimensions[0]));
});

test('seed data is copied, so later mutation of the seed does not leak', async () => {
  const s = seed();
  const gw = new InMemoryReportingGateway(s);
  s.datasets[0].labelKey = 'mutated';
  assert.equal((await gw.getDataset('orders')).labelKey, 'reports.orders');
});

test('getDataset rejects an unknown dataset with a PaepError', async () => {
  await assert.rejects(new InMemoryReportingGateway(seed()).getDataset('nope'), isPaepError(REPORTING_FAKE_ERROR_CODES.datasetUnknown));
});

test('execute returns the seeded result for a valid query', async () => {
  const r = await new InMemoryReportingGateway(seed()).execute(query);
  assert.deepEqual(r, result);
  assert.ok(Object.isFrozen(r.rows[0]));
});

test('execute rejects an unknown dataset', async () => {
  await assert.rejects(new InMemoryReportingGateway(seed()).execute({ ...query, datasetId: 'other' }), isPaepError('REPORT_DATASET_UNKNOWN'));
});

test('execute rejects unknown metric, dimension, filter and sort fields', async () => {
  const gw = new InMemoryReportingGateway(seed());
  for (const q of [
    { ...query, metrics: ['revenue'] },
    { ...query, dimensions: ['site'] },
    { ...query, filters: [{ field: 'site', operator: 'eq', value: 'a' }] },
    { ...query, sort: [{ field: 'site', direction: 'asc' }] }
  ]) await assert.rejects(gw.execute(q), isPaepError('REPORT_FIELD_UNKNOWN'));
});

test('execute on a dataset without a seeded result returns an empty, fixed-time result', async () => {
  const gw = new InMemoryReportingGateway({ datasets: [dataset], asOf: '2026-02-02T00:00:00Z' });
  const r = await gw.execute(query);
  assert.deepEqual(r, { columns: [], rows: [], freshness: { asOf: '2026-02-02T00:00:00Z', source: 'operational' }, correlationId: 'test-corr-0001' });
});

test('drill returns the seeded drill result and rejects an unknown target', async () => {
  const gw = new InMemoryReportingGateway(seed());
  const request = { reportId: 'r1', visualId: 'v1', sourceContext: { region: 'north' }, target: 'orders-by-site' };
  assert.deepEqual(await gw.drill(request), drill);
  await assert.rejects(gw.drill({ ...request, target: 'missing' }), isPaepError('REPORT_DRILL_TARGET_UNKNOWN'));
});

test('export job lifecycle is queued -> running -> succeeded and then stays succeeded', async () => {
  const gw = new InMemoryReportingGateway(seed());
  const job = await gw.requestExport({ reportId: 'r1', format: 'csv', query });
  assert.deepEqual(job, { id: 'export-0001', status: 'queued', progress: 0, correlationId: 'test-corr-0001' });
  assert.deepEqual(await gw.getExportJob(job.id), { id: 'export-0001', status: 'running', progress: 50, correlationId: 'test-corr-0001' });
  const done = await gw.getExportJob(job.id);
  assert.deepEqual(done, {
    id: 'export-0001', status: 'succeeded', progress: 100, correlationId: 'test-corr-0001',
    downloadUrl: 'https://files.example.test/exports/export-0001.csv', expiresAt: '2026-01-01T00:00:00Z'
  });
  assert.deepEqual(await gw.getExportJob(job.id), done);
  assert.ok(Object.isFrozen(done));
});

test('export jobs advance independently', async () => {
  const gw = new InMemoryReportingGateway(seed());
  const a = await gw.requestExport({ reportId: 'r1', format: 'csv', query });
  const b = await gw.requestExport({ reportId: 'r1', format: 'xlsx', query });
  assert.equal(b.id, 'export-0002');
  await gw.getExportJob(a.id);
  await gw.getExportJob(a.id);
  assert.equal((await gw.getExportJob(b.id)).status, 'running');
  assert.equal((await gw.getExportJob(a.id)).downloadUrl, 'https://files.example.test/exports/export-0001.csv');
});

test('requestExport rejects an unknown dataset and getExportJob rejects an unknown job', async () => {
  const gw = new InMemoryReportingGateway(seed());
  await assert.rejects(gw.requestExport({ reportId: 'r1', format: 'pdf', query: { ...query, datasetId: 'other' } }), isPaepError('REPORT_DATASET_UNKNOWN'));
  await assert.rejects(gw.getExportJob('export-9999'), isPaepError('REPORT_EXPORT_JOB_UNKNOWN'));
});

test('two gateways fed the same calls produce identical outputs (determinism)', async () => {
  const script = async (gw) => {
    const out = [];
    out.push(await gw.execute(query));
    out.push(await gw.execute({ ...query, datasetId: 'orders' }));
    await gw.getDataset('x').catch((e) => out.push(e));
    const j = await gw.requestExport({ reportId: 'r', format: 'csv', query });
    out.push(j, await gw.getExportJob(j.id), await gw.getExportJob(j.id));
    return JSON.stringify(out);
  };
  assert.equal(await script(new InMemoryReportingGateway(seed())), await script(new InMemoryReportingGateway(seed())));
});
