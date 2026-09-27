# Content keys

> HOF-IB2-001 v1.1 (brand revision; this document unchanged from v1.0) · READY_FOR_FINAL_PO_SA_APPROVAL. Reusable platform strings used by IB2 components. Components receive resolved strings through inputs (the i18n runtime arrives later, 02-TECHNICAL-ANALYSIS §A); these keys are the stable identifiers the implementation and the future `paep-i18n` catalogue must use. `{…}` = ICU-style parameter. English is the source text; all strings must tolerate ~2× expansion and RTL.

| Key | English source | Used by | Notes |
| --- | --- | --- | --- |
| paep.common.close | Close | Dialog, Drawer, icon button | Accessible name |
| paep.common.cancel | Cancel | Dialog footer | |
| paep.common.dismiss | Dismiss | Alert | Accessible name |
| paep.common.retry | Retry | Table shell, List, Alert | |
| paep.common.loading | Loading… | Skeleton host, busy regions | Visually hidden |
| paep.common.inProgress | In progress | Indeterminate progress (reduced motion) | |
| paep.common.required | required | Field wrapper | Programmatic only; asterisk is visual |
| paep.common.optional | (optional) | Field wrapper meta | When product marks optional fields |
| paep.common.readOnly | (read only) | Field wrapper meta | |
| paep.common.unsavedChange | Unsaved change | Field wrapper dirty meta | |
| paep.status.info | Information | Alert hidden status word | |
| paep.status.success | Success | Alert | |
| paep.status.warning | Warning | Alert | |
| paep.status.error | Error | Alert | |
| paep.action.more | More | Action group | Visible text |
| paep.action.moreActions | More actions | Action group menu / button name suffix | |
| paep.form.errorSummaryTitle | {count, plural, one {There is # problem} other {There are # problems}} with this form | Error summary alert | |
| paep.form.containsErrors | {count, plural, one {Contains # error} other {Contains # errors}} | Collapsed panel, tab label | |
| paep.table.details | Details | Table shell row disclosure | Visible (hidden at < 40 rem) |
| paep.table.detailsFor | Details for {rowName} | Table shell | Accessible name |
| paep.table.loading | Loading records | Table shell live region | Consumer may override noun |
| paep.table.count | {shown} of {total} records | Table shell header | |
| paep.table.errorTitle | Records could not be loaded | Table shell error | |
| paep.table.errorBody | The service did not respond. Nothing was changed. | Table shell error | |
| paep.table.errorReference | Reference: {reference} | Table shell error | Correlation ID from the backend; never secrets |
| paep.table.scrollRegion | {caption}, scrollable | Table fallback region | |
| paep.empty.title | No records yet | Empty state (empty) | Consumer overrides noun |
| paep.empty.body | Records you create will appear here. | Empty state | |
| paep.noResults.title | No records match the current filters | Empty state (no-results) | |
| paep.noResults.body | Try removing a filter or changing the search text. | Empty state | |
| paep.noResults.clear | Clear filters | Empty state action | |
| paep.pagination.label | Pagination | Pagination nav | |
| paep.pagination.previous | Previous | Pagination | |
| paep.pagination.next | Next | Pagination | |
| paep.pagination.previousPage | Previous page | Pagination (compact) name | |
| paep.pagination.nextPage | Next page | Pagination (compact) name | |
| paep.pagination.page | Page {page} | Page link name | |
| paep.pagination.currentPage | Page {page}, current page | Current page name | |
| paep.pagination.summary | Page {page} of {pageCount} | Pagination summary | |
| paep.pagination.compact | {page} / {pageCount} | Pagination compact status | Numbers via locale formatter |
| paep.breadcrumb.label | Breadcrumb | Breadcrumb nav | |
| paep.breadcrumb.showFullPath | Show full path | Breadcrumb "…" | |
| paep.tabs.scrollStart | Scroll tabs back | Tabs scroll button | aria-hidden button; kept for tooltip-free pointer users only if later exposed |
| paep.tabs.scrollEnd | Scroll tabs forward | Tabs scroll button | as above |
| paep.progress.percent | {value, number, percent} | Progress value | |
| paep.progress.step | Step {step} of {total} | Progress value | |
| paep.button.busy | {label}… | Loading button progressive label pattern | Consumer supplies verb ("Saving…") |
| paep.announce.saved | Saved | Transient live-region example | |

Rules: no concatenated sentences; plurals via ICU; numbers, dates and currency formatted by the locale layer, never inside components; product nouns ("records") are parameters or consumer overrides, never hard-coded domain terms.
