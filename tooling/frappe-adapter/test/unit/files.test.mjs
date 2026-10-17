// IB4 files (AC-IB4-05): server-provided, origin-checked URLs only; attachment metadata with the server checksum.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { json, makeAdapter, ORIGIN, X } from '../support/backend.mjs';

const OWNER = { recordType: 'inspection', id: 'INS-0001' };
const FILE = (over = {}) => ({ name: 'f-0001', file_name: 'report.pdf', file_url: '/private/files/report.pdf', attached_to_doctype: 'PMRA Inspection', attached_to_name: 'INS-0001', ...over });
const GET_FILE = (doc) => ({ request: { method: 'GET', path: '/api/resource/File/f-0001' }, response: json(200, { data: doc }) });

test('list returns attachment metadata of the owner record with the server checksum when present', async () => {
  const { adapter, backend } = makeAdapter([X.compatible, { request: { method: 'GET', path: '/api/resource/File' }, response: json(200, { data: [
    { name: 'f-0001', file_name: 'report.pdf', file_size: 2048, content_hash: '0123456789abcdef0123456789abcdef' },
    { name: 'f-0002', file_name: 'photo.JPG', file_size: 0, content_hash: null },
    { name: 'f-0003', file_name: 'notes', file_size: 12 },
  ] }) }]);
  const files = await adapter.files.list(OWNER);
  assert.deepEqual(files, [
    { id: 'f-0001', fileName: 'report.pdf', contentType: 'application/pdf', sizeBytes: 2048, checksum: { algorithm: 'md5', value: '0123456789abcdef0123456789abcdef' } },
    { id: 'f-0002', fileName: 'photo.JPG', contentType: 'image/jpeg', sizeBytes: 0 },
    { id: 'f-0003', fileName: 'notes', contentType: 'application/octet-stream', sizeBytes: 12 },
  ]);
  assert.deepEqual(JSON.parse(backend.calls[1].query.filters), [['attached_to_doctype', '=', 'PMRA Inspection'], ['attached_to_name', '=', 'INS-0001']]);
  assert.ok(files.every((f) => !('url' in f) && !('path' in f)), 'metadata never carries a storage path');
});

test('requestAccess returns the server URL on the backend origin', async () => {
  for (const [file_url, expected] of [['/private/files/report.pdf', `${ORIGIN}/private/files/report.pdf`], ['/files/public%20plan.pdf', `${ORIGIN}/files/public%20plan.pdf`], [`${ORIGIN}/files/a.pdf`, `${ORIGIN}/files/a.pdf`]]) {
    const { adapter } = makeAdapter([X.compatible, GET_FILE(FILE({ file_url }))]);
    assert.deepEqual(await adapter.files.requestAccess({ owner: OWNER, fileId: 'f-0001' }), { fileId: 'f-0001', url: expected });
  }
});

test('foreign-origin, protocol-relative, script, data, credentialed, traversal and unexpected URLs are refused', async () => {
  const bad = [
    'https://evil.example/files/a.pdf', 'http://backend.example.test/files/a.pdf', '//evil.example/files/a.pdf', 'javascript:alert(1)', 'data:application/pdf;base64,AAAA',
    'https://user:pw@backend.example.test/files/a.pdf', '/private/files/../../etc/passwd', '/files/%2e%2e/secret', '/files/a%2f..%2f..%2fb', '/files/a\\b.pdf',
    '/api/resource/User', '/files/', '/files/a.pdf?download=1', '/files/a.pdf#x', ' /files/a.pdf', '/files//a.pdf', '/files/%00a', 'files/a.pdf', '', null, 42, `/files/${'a'.repeat(2100)}`,
  ];
  for (const file_url of bad) {
    const { adapter } = makeAdapter([X.compatible, GET_FILE(FILE({ file_url }))]);
    await assert.rejects(adapter.files.requestAccess({ owner: OWNER, fileId: 'f-0001' }), (e) => e.code === 'FILE_URL_REJECTED', String(file_url));
  }
});

test('a file attached to another record is refused', async () => {
  for (const over of [{ attached_to_name: 'INS-0002' }, { attached_to_doctype: 'PMRA Site' }]) {
    const { adapter } = makeAdapter([X.compatible, GET_FILE(FILE(over))]);
    await assert.rejects(adapter.files.requestAccess({ owner: OWNER, fileId: 'f-0001' }), (e) => e.code === 'FILE_NOT_ATTACHED' && e.category === 'authorization');
  }
});

test('the server decides permission: a denied file read maps to an authorization error', async () => {
  const { adapter } = makeAdapter([X.compatible, { request: GET_FILE(FILE()).request, response: json(403, { exc_type: 'PermissionError' }) }]);
  await assert.rejects(adapter.files.requestAccess({ owner: OWNER, fileId: 'f-0001' }), (e) => e.code === 'PERMISSION_DENIED');
});

test('resources without files and invalid references are refused before any request', async () => {
  const { adapter, backend } = makeAdapter([]);
  await assert.rejects(adapter.files.list({ recordType: 'site', id: 'S-1' }), (e) => e.code === 'FILES_UNSUPPORTED');
  await assert.rejects(adapter.files.requestAccess({ owner: OWNER, fileId: '../x' }), (e) => e.code === 'INVALID_REFERENCE');
  await assert.rejects(adapter.files.list({ recordType: 'inspection', id: '' }), (e) => e.code === 'INVALID_REFERENCE');
  assert.equal(backend.calls.length, 0);
});

test('malformed file metadata is rejected', async () => {
  for (const data of [[{ name: 'f', file_name: 'a', file_size: -1 }], [{ name: 'f', file_name: 'a', file_size: '12' }], [{ file_name: 'a', file_size: 1 }], { not: 'list' }]) {
    const { adapter } = makeAdapter([X.compatible, { request: { method: 'GET', path: '/api/resource/File' }, response: json(200, { data }) }]);
    await assert.rejects(adapter.files.list(OWNER), (e) => e.code === 'MALFORMED_RESPONSE');
  }
});
