import { TestBed } from '@angular/core/testing';
import { PAEP_DEFAULT_MESSAGES, PAEP_MESSAGES, paepFormat, providePaepMessages } from './messages';

describe('PAEP messages', () => {
  it('formats named placeholders and leaves unknown placeholders visible', () => {
    expect(paepFormat(PAEP_DEFAULT_MESSAGES['paep.pagination.summary'], { page: 2, pageCount: 9 })).toBe('Page 2 of 9');
    expect(paepFormat(PAEP_DEFAULT_MESSAGES['paep.table.detailsFor'], { rowName: 'Record 4' })).toBe('Details for Record 4');
    expect(paepFormat('Hello {name}', {})).toBe('Hello {name}');
  });

  it('selects ICU plural forms with the locale plural rules and substitutes #', () => {
    const t = PAEP_DEFAULT_MESSAGES['paep.form.errorSummaryTitle'];
    expect(paepFormat(t, { count: 1 })).toBe('There is 1 problem with this form');
    expect(paepFormat(t, { count: 3 })).toBe('There are 3 problems with this form');
    expect(paepFormat(PAEP_DEFAULT_MESSAGES['paep.form.containsErrors'], { count: 1200 }, 'en')).toBe('Contains 1,200 errors');
  });

  it('formats plain numeric placeholders and plural forms with the given locale', () => {
    expect(paepFormat(PAEP_DEFAULT_MESSAGES['paep.table.count'], { shown: 1234, total: 5000 }, 'en-US')).toBe('1,234 of 5,000 records');
    expect(paepFormat('{shown}', { shown: 1234 }, 'de')).toBe('1.234');
    expect(paepFormat('{page}', { page: 12 }, 'ar-EG')).toBe('١٢');
    const pl = '{count, plural, one {# błąd} few {# błędy} many {# błędów} other {# błędu}}';
    expect(paepFormat(pl, { count: 3 }, 'pl')).toBe('3 błędy');
    expect(paepFormat(pl, { count: 5 }, 'pl')).toBe('5 błędów');
  });

  it('formats percentages through Intl and the given locale', () => {
    expect(paepFormat(PAEP_DEFAULT_MESSAGES['paep.progress.percent'], { value: 0.42 })).toBe('42%');
    expect(paepFormat(PAEP_DEFAULT_MESSAGES['paep.progress.percent'], { value: 0.42 }, 'de')).toBe('42\u00a0%');
  });

  it('defaults to English and lets an application replace messages', () => {
    expect(TestBed.inject(PAEP_MESSAGES)['paep.common.close']).toBe('Close');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [providePaepMessages({ 'paep.common.close': 'Schließen' })] });
    const m = TestBed.inject(PAEP_MESSAGES);
    expect(m['paep.common.close']).toBe('Schließen');
    expect(m['paep.common.cancel']).toBe('Cancel');
  });
});
