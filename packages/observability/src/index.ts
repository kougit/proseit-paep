// Public entry point of @proseit/paep-observability. Consumers import this package only through this entry point.
// IB3 delivers the minimal error-reporting and correlation seam used by the enterprise shell; it is not a telemetry,
// tracing or logging system.
export { PAEP_ERROR_KINDS, consoleErrorReporter, createCorrelationId, safeRoutePath, sanitizeErrorReport } from './lib/error-reporting.js';
export type { PaepErrorKind, PaepErrorReport, PaepErrorReportInput, PaepErrorReporter } from './lib/error-reporting.js';
