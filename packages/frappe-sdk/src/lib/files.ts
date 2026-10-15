/**
 * Files (AC-IB4-05): attachment metadata and server-provided, origin-checked access URLs only. The adapter never builds
 * a storage path; a foreign-origin, protocol-relative, script, data, credentialed, traversal or otherwise unexpected
 * URL is refused.
 */
import type { FileAccess, FileAccessRequest, FileMetadata, FilesGateway, RecordRef } from '@proseit/paep-contracts';
import { adapterError } from './errors.js';
import { resourceData, type ResourceLookup } from './records.js';
import { FILE_COLLECTION, fileDocumentPath, validEntityId, type CompiledResource } from './resources.js';
import type { Transport } from './transport.js';

export const MAX_FILES = 100;
const MD5 = /^[a-f0-9]{32}$/;
const FILE_PATH = /^\/(private\/)?files\/[^?#]+$/;
const CONTENT_TYPES: Readonly<Record<string, string>> = {
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  csv: 'text/csv', txt: 'text/plain', json: 'application/json', xml: 'application/xml',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/** Metadata label only (never used for access control). */
const contentTypeOf = (fileName: string): string => CONTENT_TYPES[(/\.([A-Za-z0-9]{1,8})$/.exec(fileName)?.[1] ?? '').toLowerCase()] ?? 'application/octet-stream';

/** The server's file URL as an absolute URL on the backend origin, or undefined when it is not acceptable. */
export function safeFileUrl(raw: unknown, origin: string): string | undefined {
  if (typeof raw !== 'string' || !raw.length || raw.length > 2048) return undefined;
  if (/[\\\s\u0000-\u001f\u007f]/.test(raw) || raw.startsWith('//') || /[?#]/.test(raw)) return undefined;
  let path = raw;
  if (!raw.startsWith('/')) {
    let url: URL;
    try { url = new URL(raw); } catch { return undefined; }
    if (url.origin !== origin || url.username || url.password || url.search || url.hash) return undefined;
    path = url.pathname;
  }
  let decoded: string;
  try { decoded = decodeURIComponent(path); } catch { return undefined; }
  if (!FILE_PATH.test(path) || !FILE_PATH.test(decoded) || /(^|\/)\.\.?(\/|$)/.test(decoded) || /[\\\u0000-\u001f\u007f]/.test(decoded) || decoded.includes('//')) return undefined;
  const url = new URL(path, origin);
  return url.origin === origin ? url.href : undefined;
}

function filesOf(r: CompiledResource): CompiledResource {
  if (!r.files) throw adapterError('FILES_UNSUPPORTED');
  return r;
}

export function createFilesGateway(transport: Transport, lookup: ResourceLookup, ready: () => Promise<void>): FilesGateway {
  return Object.freeze({
    async list(owner: RecordRef): Promise<readonly FileMetadata[]> {
      const r = filesOf(lookup(owner.recordType));
      if (!validEntityId(owner.id)) throw adapterError('INVALID_REFERENCE');
      await ready();
      const response = await transport.send({
        method: 'GET', path: FILE_COLLECTION,
        query: {
          fields: JSON.stringify(['name', 'file_name', 'file_size', 'content_hash']),
          filters: JSON.stringify([['attached_to_doctype', '=', r.doctype], ['attached_to_name', '=', owner.id]]),
          order_by: 'creation asc, name asc',
          limit_page_length: String(MAX_FILES),
        },
      });
      const rows = resourceData(response.body);
      if (!Array.isArray(rows) || rows.length > MAX_FILES) throw adapterError('MALFORMED_RESPONSE', response.correlationId);
      return Object.freeze(rows.map((row): FileMetadata => {
        const f = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
        const id = f['name'];
        const fileName = f['file_name'];
        const size = f['file_size'];
        const hash = f['content_hash'];
        if (!validEntityId(id) || typeof fileName !== 'string' || !fileName.length || fileName.length > 255 || /[\u0000-\u001f\u007f]/.test(fileName)) throw adapterError('MALFORMED_RESPONSE', response.correlationId);
        if (!(typeof size === 'number' && Number.isInteger(size) && size >= 0)) throw adapterError('MALFORMED_RESPONSE', response.correlationId);
        return Object.freeze({
          id, fileName, contentType: contentTypeOf(fileName), sizeBytes: size,
          ...(typeof hash === 'string' && MD5.test(hash) ? { checksum: Object.freeze({ algorithm: 'md5', value: hash }) } : {}),
        });
      }));
    },

    async requestAccess(request: FileAccessRequest): Promise<FileAccess> {
      const r = filesOf(lookup(request.owner.recordType));
      if (!validEntityId(request.owner.id) || !validEntityId(request.fileId)) throw adapterError('INVALID_REFERENCE');
      await ready();
      // The server checks permission on the File document; the adapter only confirms it belongs to the owner record.
      const response = await transport.send({ method: 'GET', path: fileDocumentPath(request.fileId) });
      const f = resourceData(response.body);
      if (!f || typeof f !== 'object') throw adapterError('MALFORMED_RESPONSE', response.correlationId);
      const doc = f as Record<string, unknown>;
      if (doc['name'] !== request.fileId) throw adapterError('MALFORMED_RESPONSE', response.correlationId);
      if (doc['attached_to_doctype'] !== r.doctype || doc['attached_to_name'] !== request.owner.id) throw adapterError('FILE_NOT_ATTACHED', response.correlationId);
      const url = safeFileUrl(doc['file_url'], transport.origin);
      if (!url) throw adapterError('FILE_URL_REJECTED', response.correlationId);
      return Object.freeze({ fileId: request.fileId, url });
    },
  });
}
