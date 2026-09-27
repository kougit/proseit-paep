/** Breakpoint profiles (HOF-IB2-001 token-values §9); media queries use em so they follow zoom. */
export interface PaepBreakpoint {
  readonly name: 'narrow' | 'tablet' | 'desktop' | 'wide';
  readonly minEm: number;
  readonly minPx: number;
  readonly columns: number;
}

export const PAEP_BREAKPOINTS: readonly PaepBreakpoint[] = [
  { name: 'narrow', minEm: 0, minPx: 0, columns: 4 },
  { name: 'tablet', minEm: 37.5, minPx: 600, columns: 8 },
  { name: 'desktop', minEm: 64, minPx: 1024, columns: 12 },
  { name: 'wide', minEm: 90, minPx: 1440, columns: 12 },
];

/** Container-query thresholds used by components, in rem. */
export const PAEP_CONTAINER_THRESHOLDS = {
  actionGroup: 30,
  pagination: 36,
  breadcrumb: 36,
  tableCompact: 40,
  tableFull: 60,
} as const;

/** Media query for a breakpoint's lower bound, e.g. "(min-width: 37.5em)". */
export function paepMinWidthQuery(name: PaepBreakpoint['name']): string {
  const bp = PAEP_BREAKPOINTS.find((b) => b.name === name);
  if (!bp) throw new Error(`unknown breakpoint ${name}`);
  return `(min-width: ${bp.minEm}em)`;
}
