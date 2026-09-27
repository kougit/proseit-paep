/**
 * PAEP-owned icon set (HOF-IB2-001 assets/icons, 24x24 grid, 2px round stroke, currentColor).
 * Drawing data only; metadata and titles were stripped. Icons are decorative (aria-hidden); meaning is always carried by text.
 */

export interface PaepIconShape {
  readonly type: 'path' | 'circle';
  readonly d?: string;
  readonly cx?: number;
  readonly cy?: number;
  readonly r?: number;
  /** Filled dot rather than stroked outline. */
  readonly filled?: boolean;
}

export const PAEP_ICONS = {
  check: [{ type: 'path', d: 'M5 12.5l5 5L19 7' }],
  'chevron-down': [{ type: 'path', d: 'M5 9l7 7 7-7' }],
  'chevron-end': [{ type: 'path', d: 'M9 5l7 7-7 7' }],
  'chevron-start': [{ type: 'path', d: 'M15 5l-7 7 7 7' }],
  'chevron-up': [{ type: 'path', d: 'M5 15l7-7 7 7' }],
  close: [{ type: 'path', d: 'M6 6l12 12M18 6L6 18' }],
  contents: [{ type: 'path', d: 'M4 7h16M4 12h16M4 17h10' }],
  delete: [{ type: 'path', d: 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5' }],
  empty: [{ type: 'path', d: 'M3 13h5l1.5 3h5l1.5-3h5' }, { type: 'path', d: 'M5.5 5h13L21 13v6H3v-6z' }],
  error: [{ type: 'path', d: 'M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z' }, { type: 'path', d: 'M12 7.5V13' }, { type: 'circle', cx: 12, cy: 16.4, r: 1.2, filled: true }],
  external: [{ type: 'path', d: 'M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5' }],
  info: [{ type: 'circle', cx: 12, cy: 12, r: 9 }, { type: 'path', d: 'M12 11v5.5' }, { type: 'circle', cx: 12, cy: 7.8, r: 1.2, filled: true }],
  minus: [{ type: 'path', d: 'M6 12h12' }],
  more: [{ type: 'circle', cx: 5.5, cy: 12, r: 1.6, filled: true }, { type: 'circle', cx: 12, cy: 12, r: 1.6, filled: true }, { type: 'circle', cx: 18.5, cy: 12, r: 1.6, filled: true }],
  neutral: [{ type: 'circle', cx: 12, cy: 12, r: 8 }, { type: 'path', d: 'M8.5 12h7' }],
  'no-results': [{ type: 'circle', cx: 10.5, cy: 10.5, r: 6.5 }, { type: 'path', d: 'M15.5 15.5L20 20M8.3 8.3l4.4 4.4M12.7 8.3l-4.4 4.4' }],
  'page-first': [{ type: 'path', d: 'M6 5v14M17 5l-7 7 7 7' }],
  'page-last': [{ type: 'path', d: 'M18 5v14M7 5l7 7-7 7' }],
  pending: [{ type: 'circle', cx: 12, cy: 12, r: 9 }, { type: 'path', d: 'M12 7v5l3.5 2' }],
  plus: [{ type: 'path', d: 'M12 6v12M6 12h12' }],
  retry: [{ type: 'path', d: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3' }, { type: 'path', d: 'M19.5 4.5V9H15' }],
  search: [{ type: 'circle', cx: 10.5, cy: 10.5, r: 6.5 }, { type: 'path', d: 'M15.5 15.5L20 20' }],
  spinner: [{ type: 'path', d: 'M12 3a9 9 0 1 1-9 9' }],
  success: [{ type: 'circle', cx: 12, cy: 12, r: 9 }, { type: 'path', d: 'M8 12.5l3 3 5.5-6' }],
  warning: [{ type: 'path', d: 'M12 3.5L21.5 20h-19z' }, { type: 'path', d: 'M12 10v4' }, { type: 'circle', cx: 12, cy: 17.1, r: 1.2, filled: true }],
} as const satisfies Record<string, readonly PaepIconShape[]>;

export type PaepIconName = keyof typeof PAEP_ICONS;

/** Icons that point along the inline axis and are mirrored in right-to-left layouts. */
export const PAEP_DIRECTIONAL_ICONS: readonly PaepIconName[] = ['chevron-start', 'chevron-end', 'page-first', 'page-last', 'external'];
