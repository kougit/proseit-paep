import type { EntityId, IsoDateTime } from '../core/ids.js';
import type { PaepError } from '../core/errors.js';

/** Content checksum recorded as provenance metadata. */
export interface FileChecksum {
  readonly algorithm: string;
  readonly value: string;
}

/** File / evidence metadata; never a private storage path (PAEP v1.1 §10.1 "Files/evidence", §13). */
export interface FileMetadata {
  readonly id: EntityId;
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly uploadedAt?: IsoDateTime;
  readonly checksum?: FileChecksum;
}

/** Authorised, expiring access reference issued by the server (PAEP-IB-01 §11.1(vi)). */
export interface FileAccess {
  readonly fileId: EntityId;
  readonly url: string;
  readonly expiresAt?: IsoDateTime;
}

/** Upload lifecycle. */
export type FileUploadState = 'uploading' | 'accepted' | 'failed';

/** Upload progress, failure and server acceptance (PAEP v1.1 §13). progress is 0-100. */
export interface FileUploadStatus {
  readonly state: FileUploadState;
  readonly progress?: number;
  readonly file?: FileMetadata;
  readonly error?: PaepError;
}
