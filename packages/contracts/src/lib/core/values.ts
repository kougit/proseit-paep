import type { CurrencyCode, DecimalString, TimeZoneId } from './ids.js';

/** Money as transport amount plus explicit currency; never inferred from the browser locale (PAEP-IB-01 §7.3; PAEP-IR-01 Code Block 4). */
export interface MoneyValue {
  readonly amount: DecimalString;
  readonly currency: CurrencyCode;
}

/** JSON-safe scalar used where keys are server-declared semantic keys. */
export type ScalarValue = string | number | boolean | null;

/** Explicit business time-zone context accompanying ISO transport strings (PAEP-IB-01 §7.3). */
export interface BusinessTimeContext {
  readonly timeZone: TimeZoneId;
}
