import type { ScalarValue } from './values.js';

/** Approved filter operators; the server validates every use. */
export type FilterOperator = 'eq' | 'neq' | 'in' | 'notIn' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'contains' | 'startsWith' | 'isNull' | 'isNotNull';

/** Filter operand: a scalar, or a list for in/notIn/between. */
export type FilterValue = ScalarValue | readonly ScalarValue[];

/** Filter on a semantic field key; never a column, table or DocType name, never SQL (PAEP-IB-01 §7.1(vii)). */
export interface FieldFilter {
  readonly field: string;
  readonly operator: FilterOperator;
  readonly value?: FilterValue;
}
