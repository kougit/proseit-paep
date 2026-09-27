import { InjectionToken, Provider } from '@angular/core';

/**
 * Reusable platform strings (HOF-IB2-001 content-keys.md). Components never hard-code user-facing text:
 * they read these English defaults, which an application replaces with providePaepMessages() once its
 * locale layer exists. Product nouns are parameters, never built into sentences.
 */
export const PAEP_DEFAULT_MESSAGES = {
  'paep.common.close': 'Close',
  'paep.common.cancel': 'Cancel',
  'paep.common.dismiss': 'Dismiss',
  'paep.common.retry': 'Retry',
  'paep.common.loading': 'Loading…',
  'paep.common.inProgress': 'In progress',
  'paep.common.required': 'required',
  'paep.common.optional': '(optional)',
  'paep.common.readOnly': '(read only)',
  'paep.common.unsavedChange': 'Unsaved change',
  'paep.status.info': 'Information',
  'paep.status.success': 'Success',
  'paep.status.warning': 'Warning',
  'paep.status.error': 'Error',
  'paep.action.more': 'More',
  'paep.action.moreActions': 'More actions',
  'paep.form.errorSummaryTitle': '{count, plural, one {There is # problem} other {There are # problems}} with this form',
  'paep.form.containsErrors': '{count, plural, one {Contains # error} other {Contains # errors}}',
  'paep.table.details': 'Details',
  'paep.table.detailsFor': 'Details for {rowName}',
  'paep.table.loading': 'Loading records',
  'paep.table.count': '{shown} of {total} records',
  'paep.table.errorTitle': 'Records could not be loaded',
  'paep.table.errorBody': 'The service did not respond. Nothing was changed.',
  'paep.table.errorReference': 'Reference: {reference}',
  'paep.table.scrollRegion': '{caption}, scrollable',
  'paep.empty.title': 'No records yet',
  'paep.empty.body': 'Records you create will appear here.',
  'paep.noResults.title': 'No records match the current filters',
  'paep.noResults.body': 'Try removing a filter or changing the search text.',
  'paep.noResults.clear': 'Clear filters',
  'paep.pagination.label': 'Pagination',
  'paep.pagination.previous': 'Previous',
  'paep.pagination.next': 'Next',
  'paep.pagination.previousPage': 'Previous page',
  'paep.pagination.nextPage': 'Next page',
  'paep.pagination.page': 'Page {page}',
  'paep.pagination.currentPage': 'Page {page}, current page',
  'paep.pagination.summary': 'Page {page} of {pageCount}',
  'paep.pagination.compact': '{page} / {pageCount}',
  'paep.breadcrumb.label': 'Breadcrumb',
  'paep.breadcrumb.showFullPath': 'Show full path',
  'paep.tabs.scrollStart': 'Scroll tabs back',
  'paep.tabs.scrollEnd': 'Scroll tabs forward',
  'paep.progress.percent': '{value, number, percent}',
  'paep.progress.step': 'Step {step} of {total}',
  'paep.button.busy': '{label}…',
  'paep.announce.saved': 'Saved',
} as const;

export type PaepMessageKey = keyof typeof PAEP_DEFAULT_MESSAGES;
export type PaepMessages = { readonly [K in PaepMessageKey]: string };

/** The active message catalogue; defaults to English. */
export const PAEP_MESSAGES = new InjectionToken<PaepMessages>('PAEP_MESSAGES', {
  providedIn: 'root',
  factory: () => PAEP_DEFAULT_MESSAGES,
});

/** Replaces some or all messages (for example with a translated catalogue). */
export function providePaepMessages(messages: Partial<PaepMessages>): Provider {
  return { provide: PAEP_MESSAGES, useValue: { ...PAEP_DEFAULT_MESSAGES, ...messages } };
}

/**
 * Formats a message: {name} placeholders, "{n, plural, one {...} other {...}}" (# is the number) and
 * "{n, number, percent}". Every number, plain placeholders included, is formatted with Intl for the given
 * locale (components pass Angular's LOCALE_ID). Unknown placeholders stay visible.
 */
export function paepFormat(template: string, params: Readonly<Record<string, string | number>> = {}, locale = 'en'): string {
  const plural = /\{(\w+), plural, ((?:\w+ \{[^{}]*\}\s*)+)\}/g;
  let out = template.replace(plural, (_m, name: string, body: string) => {
    const n = Number(params[name]);
    const forms = new Map<string, string>();
    for (const f of body.matchAll(/(\w+) \{([^{}]*)\}/g)) forms.set(f[1], f[2]);
    const cat = new Intl.PluralRules(locale).select(n);
    const chosen = forms.get(`=${n}`) ?? forms.get(cat) ?? forms.get('other') ?? '';
    return chosen.replace(/#/g, new Intl.NumberFormat(locale).format(n));
  });
  out = out.replace(/\{(\w+), number, percent\}/g, (_m, name: string) =>
    new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(Number(params[name])),
  );
  return out.replace(/\{(\w+)\}/g, (m, name: string) => {
    if (!(name in params)) return m;
    const value = params[name];
    return typeof value === 'number' ? new Intl.NumberFormat(locale).format(value) : value;
  });
}
