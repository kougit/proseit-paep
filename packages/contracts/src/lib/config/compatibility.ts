/** PAEP compatibility line, "major.minor" (for example "1.1"): the controlled PAEP architecture level a build conforms to. */
export type PaepVersion = string;

/** Public backend compatibility metadata carried by runtime configuration (PAEP-IB-01 §9.1, §9.3). */
export interface BackendCompatibility {
  /** Versioned backend API contract identifier, for example "pmra-api-v1". */
  readonly apiContract: string;
  /** Lowest PAEP compatibility line the backend deployment supports (inclusive). */
  readonly minimumPaep: PaepVersion;
  /** Highest PAEP compatibility line the backend deployment supports (inclusive); null or absent means no upper bound. */
  readonly maximumPaep?: PaepVersion | null;
}

/** Observable result of the startup compatibility check (PAEP-IB-01 §9.2(vi)). Present only on a successful startup, so it is always compatible. */
export interface CompatibilityReport {
  readonly status: 'compatible';
  readonly schemaVersion: string;
  readonly apiContract: string;
  readonly paepVersion: PaepVersion;
  readonly minimumPaep: PaepVersion;
  readonly maximumPaep: PaepVersion | null;
}
