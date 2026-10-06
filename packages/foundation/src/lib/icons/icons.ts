/**
 * PAEP-owned icon set (24x24 grid, 2px round stroke, currentColor): the 25 accepted icons of HOF-IB2-001
 * assets/icons and the 24 shell icons of HOF-IB3-001 assets/icons (P-08). Drawing data only; metadata, content
 * credentials and titles were stripped, and each rounded <rect> is written as the equivalent path. Icons are
 * decorative (aria-hidden); meaning is always carried by text.
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
  // Shell icons (HOF-IB3-001 P-08, ICON-SHELL-*), in the order of the asset register.
  menu: [{ type: 'path', d: 'M4 6.5h16M4 12h16M4 17.5h16' }],
  'panel-start': [{ type: 'path', d: 'M5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1 -2 2h-13a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2z' }, { type: 'path', d: 'M9.5 4.5v15M15.5 10l-2 2 2 2' }],
  bell: [{ type: 'path', d: 'M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z' }, { type: 'path', d: 'M10 21h4' }],
  user: [{ type: 'circle', cx: 12, cy: 8.5, r: 3.5 }, { type: 'path', d: 'M5 20a7 7 0 0 1 14 0' }],
  help: [{ type: 'circle', cx: 12, cy: 12, r: 9 }, { type: 'path', d: 'M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.4v.6' }, { type: 'circle', cx: 12, cy: 16.9, r: 1.2, filled: true }],
  globe: [{ type: 'circle', cx: 12, cy: 12, r: 9 }, { type: 'path', d: 'M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9M12 3c-2.6 2.6-3.8 5.6-3.8 9s1.2 6.4 3.8 9' }],
  building: [{ type: 'path', d: 'M3 21h18M5 21V5.5L12 3.5V21M12 8.5h7V21' }, { type: 'path', d: 'M8 8.5h1M8 12h1M8 15.5h1M15 12h1M15 15.5h1' }],
  lock: [{ type: 'path', d: 'M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1 -1.5 1.5h-11a1.5 1.5 0 0 1 -1.5 -1.5v-7a1.5 1.5 0 0 1 1.5 -1.5z' }, { type: 'path', d: 'M8 10.5V8a4 4 0 0 1 8 0v2.5' }, { type: 'path', d: 'M12 14.5v2.5' }],
  edition: [{ type: 'path', d: 'M12 3.5l8.5 4.5L12 12.5 3.5 8z' }, { type: 'path', d: 'M3.5 12L12 16.5 20.5 12M3.5 16l8.5 4.5 8.5-4.5' }],
  sliders: [{ type: 'path', d: 'M4 7h8M17 7h3M4 17h3M12 17h8' }, { type: 'circle', cx: 14.5, cy: 7, r: 2.5 }, { type: 'circle', cx: 9.5, cy: 17, r: 2.5 }],
  device: [{ type: 'path', d: 'M8.5 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2z' }, { type: 'path', d: 'M10.5 17.5h3' }],
  signal: [{ type: 'path', d: 'M5 19.5v-3M10 19.5v-6.5M15 19.5v-10M20 19.5v-14' }],
  'signal-low': [{ type: 'path', d: 'M5 19.5v-3M10 19.5v-6.5' }, { type: 'circle', cx: 15, cy: 19, r: 1.1, filled: true }, { type: 'circle', cx: 20, cy: 19, r: 1.1, filled: true }],
  'cloud-off': [{ type: 'path', d: 'M7.5 18.5h9.8a3.7 3.7 0 0 0 1.3-7.2A6 6 0 0 0 7.3 9 4.8 4.8 0 0 0 7.5 18.5z' }, { type: 'path', d: 'M4 4l16 16' }],
  unknown: [{ type: 'path', d: 'M6.5 3.5h11a3 3 0 0 1 3 3v11a3 3 0 0 1 -3 3h-11a3 3 0 0 1 -3 -3v-11a3 3 0 0 1 3 -3z' }, { type: 'path', d: 'M9.8 9.6a2.3 2.3 0 1 1 3.1 2.2c-.6.3-.9.7-.9 1.3v.4' }, { type: 'circle', cx: 12, cy: 16.6, r: 1.1, filled: true }],
  impersonate: [{ type: 'circle', cx: 9, cy: 8, r: 3.2 }, { type: 'path', d: 'M3 19.5a6 6 0 0 1 10.5-4' }, { type: 'path', d: 'M16 13.5l3 3-3 3M19 16.5h-6' }],
  environment: [{ type: 'path', d: 'M4 20V5.5M4 5.5h12l-2 3.5 2 3.5H4' }],
  home: [{ type: 'path', d: 'M3.5 11L12 4l8.5 7M6 9v11h12V9' }, { type: 'path', d: 'M10 20v-5h4v5' }],
  list: [{ type: 'path', d: 'M9 6.5h11M9 12h11M9 17.5h11' }, { type: 'circle', cx: 4.8, cy: 6.5, r: 1.2, filled: true }, { type: 'circle', cx: 4.8, cy: 12, r: 1.2, filled: true }, { type: 'circle', cx: 4.8, cy: 17.5, r: 1.2, filled: true }],
  tasks: [{ type: 'path', d: 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2z' }, { type: 'path', d: 'M8 12l2.5 2.5L16 9' }],
  document: [{ type: 'path', d: 'M6 3.5h8l4 4V20.5H6z' }, { type: 'path', d: 'M14 3.5V8h4M9 12.5h6M9 16h6' }],
  shield: [{ type: 'path', d: 'M12 3l7.5 3v5.5c0 4.4-3.2 8-7.5 9.5-4.3-1.5-7.5-5.1-7.5-9.5V6z' }],
  'sign-out': [{ type: 'path', d: 'M10 4.5H5.5v15H10' }, { type: 'path', d: 'M15 8l4 4-4 4M19 12H9.5' }],
  keyboard: [{ type: 'path', d: 'M4.5 6h15a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-15a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2z' }, { type: 'path', d: 'M6 10h1M9.5 10h1M13 10h1M16.5 10h1M8 14h8' }],
} as const satisfies Record<string, readonly PaepIconShape[]>;

export type PaepIconName = keyof typeof PAEP_ICONS;

/** Icons that point along the inline axis and are mirrored in right-to-left layouts (HOF-IB3-001: panel-start, sign-out). */
export const PAEP_DIRECTIONAL_ICONS: readonly PaepIconName[] = ['chevron-start', 'chevron-end', 'page-first', 'page-last', 'external', 'panel-start', 'sign-out'];
