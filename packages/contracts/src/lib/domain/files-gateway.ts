import type { EntityId } from '../core/ids.js';
import type { FileAccess, FileMetadata } from './files.js';
import type { RecordRef } from './records.js';

/** Request for a server-authorised access reference to one file of a record. */
export interface FileAccessRequest {
  readonly owner: RecordRef;
  readonly fileId: EntityId;
}

/** File port (PAEP v1.1 §10.1 "Files/evidence"): metadata and server-issued access references only, never a client-built path. */
export interface FilesGateway {
  list(owner: RecordRef): Promise<readonly FileMetadata[]>;
  requestAccess(request: FileAccessRequest): Promise<FileAccess>;
}
