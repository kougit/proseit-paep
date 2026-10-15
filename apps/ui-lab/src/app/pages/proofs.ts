import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PaepActionGroup,
  PaepAlert,
  PaepBreadcrumb,
  PaepBreadcrumbItem,
  PaepButton,
  PaepCard,
  PaepCheckbox,
  PaepField,
  PaepInput,
  PaepPagination,
  PaepPanel,
  PaepProgress,
  PaepRadio,
  PaepRadioGroup,
  PaepSelect,
  PaepStatusBadge,
  PaepStatusTone,
  PaepTab,
  PaepTable,
  PaepTableCell,
  PaepTableColumn,
  PaepTableRow,
  PaepTabs,
  providePaepMessages,
} from '@proseit/paep-components';
import { PAEP_DEFAULT_BRAND, PAEP_TOKENS, PaepIcon, validateBrandProfile } from '@proseit/paep-foundation';
import { LabSettings } from '../lab/lab-settings';

/*
 * Proof pages (HOF-IB2-001 SCR-IB2-R01, R02, R03, F09 and C03N). Each composes the real components with neutral
 * synthetic content; nothing here is a product workflow.
 */

const TONES: Readonly<Record<string, PaepStatusTone>> = { Approved: 'success', 'Awaiting review': 'warning', Rejected: 'error', Draft: 'neutral' };

const COLUMNS: readonly PaepTableColumn[] = [
  { key: 'name', header: 'Record', secondaryKey: 'ref' },
  { key: 'location', header: 'Location', priority: 3 },
  { key: 'quantity', header: 'Quantity', priority: 2, numeric: true },
  { key: 'updated', header: 'Updated', priority: 3 },
  { key: 'status', header: 'Status' },
];

const ROWS: readonly PaepTableRow[] = [
  { id: '184', name: 'Sample item Alpha', ref: 'REC-2026-000184', location: 'Site 3 · Store B', quantity: '1,250.00', updated: '2026-09-21', status: 'Approved' },
  { id: '185', name: 'Sample item Beta with a longer descriptive name', ref: 'REC-2026-000185', location: 'Site 1 · Yard', quantity: '87.50', updated: '2026-09-20', status: 'Awaiting review' },
  { id: '186', name: 'Sample item Gamma', ref: 'REC-2026-000186', location: 'Site 2', quantity: '0.00', updated: '2026-09-19', status: 'Rejected' },
];

const TRAIL: readonly PaepBreadcrumbItem[] = [
  { label: 'Home', link: '/proofs/responsive' },
  { label: 'Operations', link: '/proofs/responsive' },
  { label: 'Records', link: '/proofs/responsive' },
  { label: 'Site 3', link: '/proofs/responsive' },
  { label: 'REC-2026-000184' },
];

function tone(row: PaepTableRow): PaepStatusTone {
  return TONES[String(row['status'])] ?? 'neutral';
}

const PROOF_STYLES = `
  .stack { display: grid; gap: var(--paep-space-4); }
  .row { display: flex; flex-wrap: wrap; gap: var(--paep-space-3); }
  .frame { max-inline-size: 20rem; }
  .frames { display: grid; gap: var(--paep-space-5); grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr)); align-items: start; }
`;

@Component({
  selector: 'lab-proof-reflow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepActionGroup, PaepAlert, PaepBreadcrumb, PaepButton, PaepCard, PaepField, PaepInput, PaepPagination, PaepPanel, PaepStatusBadge, PaepTab, PaepTable, PaepTableCell, PaepTabs, RouterLink],
  styles: PROOF_STYLES,
  template: `
    <div class="lab-page">
      <header>
        <h1 tabindex="-1">Responsive and 320 CSS px reflow</h1>
        <p class="lab-lead">
          Every material pattern on one page, readable at 320 CSS px (1280 px at 400% zoom). Nothing disappears and the
          page never scrolls horizontally; the browser gate audits this page at 320, 834 and 1440 px in both directions.
        </p>
      </header>
      <section class="lab-panel" aria-labelledby="rf-actions">
        <h2 id="rf-actions">Action group</h2>
        <paep-action-group label="Record actions">
          <button paepButton>Edit</button>
          <button paepButton>Duplicate</button>
          <button paepButton>Export</button>
          <button paepButton variant="destructive" icon="delete">Delete record</button>
          <button paepButton variant="primary">Approve</button>
        </paep-action-group>
      </section>
      <section class="lab-panel" aria-labelledby="rf-field">
        <h2 id="rf-field">Field with error</h2>
        <paep-field label="Quantity" required help="Whole units only." error="Quantity must be 0 or more.">
          <input paepInput inputmode="numeric" value="-4" />
        </paep-field>
      </section>
      <section class="lab-panel" aria-labelledby="rf-alert">
        <h2 id="rf-alert">Alert</h2>
        <paep-alert status="error" heading="The record could not be submitted">Correct the 2 errors below, then submit again.</paep-alert>
      </section>
      <section class="lab-panel" aria-labelledby="rf-tabs">
        <h2 id="rf-tabs">Tabs</h2>
        <paep-tabs label="Record sections">
          <paep-tab label="Summary"><p>Panel content for the selected view.</p></paep-tab>
          <paep-tab label="History"><p>History panel.</p></paep-tab>
          <paep-tab label="Attachments" [count]="3"><p>Attachments panel.</p></paep-tab>
          <paep-tab label="Audit"><p>Audit panel.</p></paep-tab>
        </paep-tabs>
      </section>
      <section class="lab-panel" aria-labelledby="rf-bc">
        <h2 id="rf-bc">Breadcrumb</h2>
        <paep-breadcrumb [items]="trail" />
      </section>
      <section class="lab-panel" aria-labelledby="rf-table" data-r03-section="table-action">
        <h2 id="rf-table">Table shell with header action and pagination</h2>
        <paep-table #records caption="Records" [columns]="columns" [rows]="rows" [total]="184" [headingLevel]="3">
          <button paepButton paepTableActions variant="primary" icon="plus">Create record</button>
          <ng-template paepTableCell="status" let-row>
            <paep-status-badge [tone]="tone(row)">{{ row['status'] }}</paep-status-badge>
          </ng-template>
          <paep-pagination paepTableFooter [(page)]="page" [pageCount]="20" [focusTarget]="records.captionElement()" />
        </paep-table>
      </section>
      <section class="lab-panel" aria-labelledby="rf-pagination" data-r03-section="pagination">
        <h2 id="rf-pagination">Pagination</h2>
        <paep-pagination [(page)]="standalonePage" [pageCount]="20" />
      </section>
      <section class="lab-panel" aria-labelledby="rf-card" data-r03-section="card-panel">
        <h2 id="rf-card">Card and panel</h2>
        <div class="stack">
          <paep-card heading="Stock position for the current reporting period across all sites" description="A two-line title wraps; actions wrap below it under 30 rem.">
            <paep-action-group paepCardActions label="Card actions">
              <button paepButton>Export</button>
              <button paepButton variant="primary">Refresh</button>
            </paep-action-group>
            <p>Body content grows with its content. Cards are not click targets.</p>
            <button paepButton paepCardFooter variant="tertiary">View details</button>
          </paep-card>
          <paep-panel heading="Delivery details">
            <button paepButton paepPanelActions>Edit</button>
            <p>Static panel with a header action.</p>
          </paep-panel>
        </div>
      </section>
      <section class="lab-panel" aria-labelledby="rf-overlays" data-r03-section="overlays">
        <h2 id="rf-overlays">Overlays at 320</h2>
        <ul class="lab-list">
          <li><a routerLink="/components/dialog">Dialog (inset 16 px, stacked actions)</a></li>
          <li><a routerLink="/components/dialog">Large dialog (full screen below 600 px)</a></li>
          <li><a routerLink="/components/drawer">Drawer (full width)</a></li>
          <li><a routerLink="/components/popover">Popover (viewport-bounded)</a></li>
        </ul>
      </section>
    </div>
  `,
})
export class LabProofReflow {
  protected readonly columns = COLUMNS;
  protected readonly rows = ROWS;
  protected readonly trail = TRAIL;
  protected readonly page = signal(8);
  protected readonly standalonePage = signal(8);
  protected readonly tone = tone;
}

@Component({
  selector: 'lab-proof-long-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepAlert, PaepButton, PaepCard, PaepField, PaepInput, PaepStatusBadge, PaepTab, PaepTable, PaepTableCell, PaepTabs],
  styles: PROOF_STYLES,
  template: `
    <div class="lab-page">
      <header>
        <h1 tabindex="-1">Long content and translation</h1>
        <p class="lab-lead">
          Nothing essential truncates. Text wraps, unbroken identifiers and addresses break anywhere, and containers grow.
          Labels are about twice their English length, as translated text can be.
        </p>
      </header>
      <section class="lab-panel" aria-labelledby="lc-actions">
        <h2 id="lc-actions">Buttons and tabs at about twice the length</h2>
        <div class="stack">
          <div><button paepButton variant="primary">Save changes and notify every reviewer</button></div>
          <div><button paepButton>Discard every unsaved change on this page</button></div>
          <paep-tabs label="Long tab labels">
            <paep-tab label="Summary"><p>Panel content for the selected view.</p></paep-tab>
            <paep-tab label="Supporting documents and attachments"><p>Supporting documents panel.</p></paep-tab>
            <paep-tab label="Change history and approvals"><p>Change history panel.</p></paep-tab>
          </paep-tabs>
        </div>
      </section>
      <section class="lab-panel" aria-labelledby="lc-field">
        <h2 id="lc-field">Three-line label, help and error</h2>
        <paep-field
          label="Registered business address used for statutory correspondence, including the building, street and district as they appear on the registration certificate"
          required
          help="Use the address exactly as it is written on the certificate issued by the registering authority. If the certificate lists more than one address, use the one marked as the principal place of business for the current period."
          error="The address could not be matched to the address on the registration certificate. Check the building name and district, correct any abbreviations, and make sure the district is one of the districts recognised for the selected region."
        >
          <input paepInput value="Building 4, Sample Street, District 7" />
        </paep-field>
      </section>
      <section class="lab-panel" aria-labelledby="lc-alert">
        <h2 id="lc-alert">Alert, status badge and card</h2>
        <div class="stack">
          <paep-alert status="warning" heading="Some records in this import were skipped because their quantities or units could not be matched to the catalogue">
            Rows 12, 18, 40, 41 and 97 were skipped. The import reference https://records.example.org/imports/2026/09/REC-2026-000184-ATTACHMENT-ARCHIVE-0001 lists every skipped row.
          </paep-alert>
          <div><paep-status-badge tone="warning">Awaiting review by the second approver on the regional finance team</paep-status-badge></div>
          <paep-card heading="A card title that is long enough to wrap onto a second line in a narrow container" description="Card descriptions wrap as well; actions move below the title when there is no room beside it.">
            <button paepButton paepCardActions>Open the complete record history</button>
            <p>Card body content.</p>
          </paep-card>
        </div>
      </section>
      <section class="lab-panel" aria-labelledby="lc-table">
        <h2 id="lc-table">Long identifiers, addresses and statuses in a table</h2>
        <paep-table caption="Records with long values" [columns]="columns" [rows]="rows" [total]="184" [headingLevel]="3">
          <ng-template paepTableCell="status" let-row>
            <paep-status-badge [tone]="tone(row)">{{ row['status'] }}</paep-status-badge>
          </ng-template>
        </paep-table>
      </section>
    </div>
  `,
})
export class LabProofLongContent {
  protected readonly columns = COLUMNS;
  protected readonly rows: readonly PaepTableRow[] = [
    ...ROWS.slice(0, 1),
    {
      id: '187',
      name: 'Sample item Delta with an exceptionally long descriptive name that needs several lines',
      ref: 'REC-2026-000187-ATTACHMENT-ARCHIVE-0001-SUPPLEMENTARY',
      location: 'Site 3 · Store A · Bay 14 · https://records.example.org/locations/site-3/store-a/bay-14',
      quantity: '12,904.75',
      updated: '2026-09-18',
      status: 'Awaiting review',
    },
    ROWS[2],
  ];
  protected readonly tone = tone;
}

/** Illustrative Arabic strings from HOF-IB2-001 SCR-IB2-R02, pending translation review. */
const AR_MESSAGES = {
  'paep.pagination.label': 'ترقيم الصفحات',
  'paep.pagination.previous': 'السابق',
  'paep.pagination.next': 'التالي',
  'paep.pagination.summary': 'الصفحة {page} من {pageCount}',
  'paep.table.details': 'التفاصيل',
  'paep.table.detailsFor': 'التفاصيل لـ {rowName}',
  'paep.table.count': '{shown} من {total} سجلًا',
  'paep.breadcrumb.label': 'مسار التنقل',
} as const;

@Component({
  selector: 'lab-proof-rtl-sample',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [providePaepMessages(AR_MESSAGES)],
  imports: [PaepAlert, PaepBreadcrumb, PaepButton, PaepCheckbox, PaepField, PaepIcon, PaepInput, PaepPagination, PaepRadio, PaepRadioGroup, PaepSelect, PaepStatusBadge, PaepTab, PaepTable, PaepTableCell, PaepTabs],
  styles: `${PROOF_STYLES} .icons { display: flex; flex-wrap: wrap; gap: var(--paep-space-4); } .icons span { display: inline-flex; gap: var(--paep-space-1); align-items: center; }`,
  template: `
    <div dir="rtl" lang="ar" class="stack">
      <section class="lab-panel" aria-labelledby="rtl-form">
        <h2 id="rtl-form">نموذج</h2>
        <div class="stack">
          <paep-field label="رقم المرجع" required help="يظهر على المستندات المطبوعة.">
            <input paepInput dir="ltr" value="REC-2026-000184" />
          </paep-field>
          <paep-field label="الكمية" suffix="كغ" error="يجب أن تكون الكمية 0 أو أكثر.">
            <input paepInput inputmode="numeric" value="-4" />
          </paep-field>
          <paep-field label="المنطقة">
            <select paepSelect><option>الوسطى</option><option>الشمالية</option></select>
          </paep-field>
          <paep-radio-group legend="طريقة التسليم">
            <label><input type="radio" paepRadio name="rtl-delivery" value="pickup" checked /> الاستلام من الموقع</label>
            <label><input type="radio" paepRadio name="rtl-delivery" value="standard" /> التسليم العادي</label>
          </paep-radio-group>
          <label><input type="checkbox" paepCheckbox /> أوافق على الشروط</label>
          <div class="icons">
            <button paepButton variant="primary">حفظ التغييرات</button>
            <button paepButton>إلغاء</button>
            <button paepButton variant="destructive" icon="delete">حذف السجل</button>
          </div>
        </div>
      </section>
      <section class="lab-panel" aria-labelledby="rtl-tabs">
        <h2 id="rtl-tabs">علامات التبويب</h2>
        <paep-tabs label="أقسام السجل">
          <paep-tab label="الملخص"><p>محتوى علامة التبويب المحددة.</p></paep-tab>
          <paep-tab label="سجل التغييرات"><p>سجل التغييرات.</p></paep-tab>
          <paep-tab label="المرفقات" [count]="3"><p>المرفقات.</p></paep-tab>
        </paep-tabs>
      </section>
      <section class="lab-panel" aria-labelledby="rtl-bc">
        <h2 id="rtl-bc">مسار التنقل</h2>
        <paep-breadcrumb [items]="trail" />
      </section>
      <section class="lab-panel" aria-labelledby="rtl-pg">
        <h2 id="rtl-pg">ترقيم الصفحات والأيقونات الاتجاهية</h2>
        <div class="stack">
          <paep-pagination [(page)]="page" [pageCount]="20" />
          <div class="icons">
            @for (i of icons; track i) {
              <span><svg [paepIcon]="i"></svg><code dir="ltr">{{ i }}</code></span>
            }
          </div>
        </div>
      </section>
      <section class="lab-panel" aria-labelledby="rtl-table">
        <h2 id="rtl-table">تنبيه وجدول</h2>
        <div class="stack">
          <paep-alert status="success">تم حفظ السجل.</paep-alert>
          <paep-table caption="السجلات" [columns]="columns" [rows]="rows" [total]="184" [headingLevel]="3">
            <ng-template paepTableCell="status" let-row>
              <paep-status-badge [tone]="toneOf(row)">{{ row['status'] }}</paep-status-badge>
            </ng-template>
          </paep-table>
        </div>
      </section>
    </div>
  `,
})
export class LabProofRtlSample {
  protected readonly page = signal(8);
  protected readonly icons = ['chevron-start', 'chevron-end', 'page-first', 'page-last', 'external', 'retry', 'success'] as const;
  protected readonly trail: readonly PaepBreadcrumbItem[] = [
    { label: 'الرئيسية', link: '/proofs/responsive' },
    { label: 'العمليات', link: '/proofs/responsive' },
    { label: 'السجلات', link: '/proofs/responsive' },
    { label: 'الموقع 3', link: '/proofs/responsive' },
    { label: 'REC-2026-000184' },
  ];
  protected readonly columns: readonly PaepTableColumn[] = [
    { key: 'name', header: 'السجل', secondaryKey: 'ref' },
    { key: 'location', header: 'الموقع', priority: 3 },
    { key: 'quantity', header: 'الكمية', priority: 2, numeric: true },
    { key: 'updated', header: 'آخر تحديث', priority: 3 },
    { key: 'status', header: 'الحالة' },
  ];
  protected readonly rows: readonly PaepTableRow[] = [
    { ...ROWS[0], status: 'معتمد', tone: 'success' },
    { ...ROWS[1], status: 'بانتظار المراجعة', tone: 'warning' },
  ];
  protected toneOf(row: PaepTableRow): PaepStatusTone {
    return row['tone'] as PaepStatusTone;
  }
}

@Component({
  selector: 'lab-proof-rtl',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LabProofRtlSample],
  template: `
    <div class="lab-page">
      <header>
        <h1 tabindex="-1">Right-to-left</h1>
        <p class="lab-lead">
          The samples below render with <code>dir="rtl"</code> and <code>lang="ar"</code> whatever the lab direction, using a
          translated message catalogue supplied through <code>providePaepMessages()</code>. The Arabic strings are
          illustrative samples from the design handoff, pending translation review. Identifiers keep <code>dir="ltr"</code>;
          directional icons mirror; numeric columns align to the inline end. The drawer's RTL behaviour is shown on the
          drawer page with the lab direction set to RTL.
        </p>
      </header>
      <lab-proof-rtl-sample />
    </div>
  `,
})
export class LabProofRtl {}

@Component({
  selector: 'lab-proof-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepAlert, PaepButton, PaepCheckbox, PaepPagination, PaepProgress, PaepStatusBadge, PaepTab, PaepTabs, RouterLink],
  styles: PROOF_STYLES,
  template: `
    <div class="lab-page">
      <header>
        <h1 tabindex="-1">Brand override</h1>
        <p class="lab-lead">
          Products express identity through the seven brand tokens only. Status, focus, disabled, validation, surface and
          text colours are protected and never change. Current profile: <strong>{{ settings.brand() }}</strong>.
        </p>
        <p>
          <a routerLink="/proofs/brand" [queryParams]="{ brand: settings.brand() === 'proseit-default' ? 'synthetic-demo-petrol' : null }" queryParamsHandling="merge">
            {{ settings.brand() === 'proseit-default' ? 'View with the synthetic petrol profile' : 'View with the ProSEIT default profile' }}
          </a>
          (synthetic petrol is a non-product demonstration profile).
        </p>
      </header>
      <section class="lab-panel" aria-labelledby="br-same">
        <h2 id="br-same">Components under the current profile</h2>
        <div class="stack">
          <div class="row">
            <button paepButton variant="primary">Save changes</button>
            <button paepButton>Cancel</button>
            <button paepButton variant="destructive" icon="delete">Delete record</button>
          </div>
          <label><input type="checkbox" paepCheckbox checked /> Checked option</label>
          <paep-tabs label="Brand sample sections">
            <paep-tab label="Summary"><p>Panel content for the selected view.</p></paep-tab>
            <paep-tab label="History"><p>History panel.</p></paep-tab>
          </paep-tabs>
          <paep-pagination [(page)]="page" [pageCount]="5" />
          <paep-progress label="Import" [value]="60" />
          <paep-alert status="error">Status colours stay identical under every brand profile.</paep-alert>
          <div><paep-status-badge tone="success">Approved</paep-status-badge></div>
        </div>
      </section>
      <section class="lab-panel" aria-labelledby="br-protected">
        <h2 id="br-protected">Protected tokens (live values)</h2>
        <p>Read from the page now. The browser gate (B1) checks every one against its approved value under the petrol profile.</p>
        <div class="lab-scroll" role="region" aria-label="Protected token values, scrollable" tabindex="0">
          <table class="lab-table">
            <caption class="paep-visually-hidden">Protected tokens and their live values</caption>
            <thead><tr><th scope="col">Token</th><th scope="col">Approved</th><th scope="col">Live</th></tr></thead>
            <tbody>
              @for (t of protectedTokens(); track t.name) {
                <tr><th scope="row"><code>{{ t.name }}</code></th><td><code>{{ t.value }}</code></td><td><code>{{ t.live }}</code></td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
      <section class="lab-panel" aria-labelledby="br-validate">
        <h2 id="br-validate">Fail-closed validation</h2>
        <p>
          <code>applyBrandProfile()</code> validates first and applies nothing when any rule fails. These rejected sample
          profiles are validated live:
        </p>
        <ul class="lab-list">
          @for (c of rejected; track c.name) {
            <li>
              <strong>{{ c.name }}:</strong>
              {{ c.valid ? 'accepted (unexpected)' : 'rejected' }}
              @if (!c.valid) {
                ({{ c.reasons }})
              }
            </li>
          }
        </ul>
      </section>
    </div>
  `,
})
export class LabProofBrand {
  protected readonly settings = inject(LabSettings);
  protected readonly page = signal(2);
  protected readonly protectedTokens = signal(
    PAEP_TOKENS.filter((t) => t.protected && t.name.startsWith('--paep-color-')).map((t) => ({ name: t.name, value: t.value, live: '' })),
  );
  protected readonly rejected = [
    { name: 'White text on the gold accent', profile: { ...PAEP_DEFAULT_BRAND, accent: '#D4A62A', 'on-accent': '#FFFFFF' } },
    { name: 'Low-contrast primary', profile: { ...PAEP_DEFAULT_BRAND, primary: '#9FB3C8' } },
    { name: 'Attempt to override a status token', profile: { ...PAEP_DEFAULT_BRAND, 'status-error-fg': '#00AA00' } },
  ].map((c) => {
    const result = validateBrandProfile(c.profile);
    return { name: c.name, valid: result.valid, reasons: result.violations.map((v) => `rule ${v.rule}: ${v.message}`).join('; ') };
  });

  constructor() {
    // Re-read after every profile change (the lab applies the profile to the root element synchronously).
    effect(() => {
      this.settings.brand();
      queueMicrotask(() => this.readLive());
    });
  }

  private readLive(): void {
    const cs = getComputedStyle(document.documentElement);
    this.protectedTokens.update((list) => list.map((t) => ({ ...t, live: cs.getPropertyValue(t.name).trim() })));
  }
}

@Component({
  selector: 'lab-proof-table-strategies',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaepCard, PaepPagination, PaepStatusBadge, PaepTable, PaepTableCell],
  styles: PROOF_STYLES,
  template: `
    <div class="lab-page">
      <header>
        <h1 tabindex="-1">Table narrow strategies</h1>
        <p class="lab-lead">
          Design decision OD-14 (D1) at 320 CSS px. Strategy A, priority columns with a row detail, is the table shell's
          primary behaviour. Strategy C, a bounded inner horizontal scroll, is the controlled fallback for genuinely
          two-dimensional comparison. Strategy B, turning rows into cards, was rejected as a table mode; products may
          use a list or cards for browse views instead.
        </p>
      </header>
      <div class="frames">
        <section class="lab-panel" aria-labelledby="ts-a">
          <h2 id="ts-a">A · Priority columns and row detail (primary)</h2>
          <div class="frame">
            <paep-table #a caption="Records" [columns]="columns" [rows]="rows" [total]="184" [headingLevel]="3">
              <ng-template paepTableCell="status" let-row>
                <paep-status-badge [tone]="tone(row)">{{ row['status'] }}</paep-status-badge>
              </ng-template>
              <paep-pagination paepTableFooter [(page)]="page" [pageCount]="20" [focusTarget]="a.captionElement()" />
            </paep-table>
          </div>
        </section>
        <section class="lab-panel" aria-labelledby="ts-c">
          <h2 id="ts-c">C · Bounded inner scroll (controlled fallback)</h2>
          <div class="frame">
            <paep-table caption="Comparison" variant="scroll" [columns]="scrollColumns" [rows]="rows" [headingLevel]="3">
              <ng-template paepTableCell="status" let-row>
                <paep-status-badge [tone]="tone(row)">{{ row['status'] }}</paep-status-badge>
              </ng-template>
            </paep-table>
          </div>
        </section>
        <section class="lab-panel" aria-labelledby="ts-b">
          <h2 id="ts-b">B · Card summary (rejected as a table mode)</h2>
          <p>Shown with the card component, the pattern products may use for browse views.</p>
          <div class="frame stack">
            @for (row of rows; track row['id']) {
              <paep-card [heading]="row['name'] + ''" [description]="row['ref'] + ''" [headingLevel]="3">
                <paep-status-badge [tone]="tone(row)">{{ row['status'] }}</paep-status-badge>
                <p>{{ row['location'] }} · {{ row['quantity'] }} · {{ row['updated'] }}</p>
              </paep-card>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class LabProofTableStrategies {
  protected readonly columns = COLUMNS;
  protected readonly scrollColumns: readonly PaepTableColumn[] = [
    { key: 'ref', header: 'Reference', identifier: true },
    { key: 'name', header: 'Name' },
    { key: 'location', header: 'Location' },
    { key: 'quantity', header: 'Quantity', numeric: true },
    { key: 'updated', header: 'Updated' },
    { key: 'status', header: 'Status' },
  ];
  protected readonly rows = ROWS;
  protected readonly page = signal(8);
  protected readonly tone = tone;
}
