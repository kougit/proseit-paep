/** Opaque identifier at the UI boundary (PAEP-IB-01 §7.3). */
export type EntityId = string;
/** Correlation identifier retained for support evidence (PAEP-IB-01 §7.3). */
export type CorrelationId = string;
/** i18n message key; UI code never parses backend prose (PAEP-IB-01 §7.1(iv)). */
export type MessageKey = string;
/** ISO-8601 date-time transport string with offset (PAEP-IB-01 §7.3). */
export type IsoDateTime = string;
/** ISO-8601 calendar date (YYYY-MM-DD). */
export type IsoDate = string;
/** IANA time-zone identifier. */
export type TimeZoneId = string;
/** BCP 47 locale tag. */
export type LocaleTag = string;
/** ISO 4217 alphabetic currency code. */
export type CurrencyCode = string;
/** Decimal number serialised as a string, so no binary floating-point loss crosses the boundary. */
export type DecimalString = string;
