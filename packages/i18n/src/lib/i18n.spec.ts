import { describe, expect, it } from 'vitest';
import { applyLocale, resolveLocale, validateLocaleTag } from './locale';
import { createMessageResolver, formatMessage } from './messages';

describe('locale seam', () => {
  it('validates and canonicalises tags, rejecting unsafe values', () => {
    expect(validateLocaleTag('en')).toBe('en');
    expect(validateLocaleTag('pt_br')).toBe('pt-BR');
    expect(validateLocaleTag('zh-hant-tw')).toBe('zh-Hant-TW');
    for (const bad of ['', 'e', 'english', 'en-<script>', '../ar', 'ar‮', 42, null, 'a'.repeat(40)]) expect(validateLocaleTag(bad)).toBeNull();
  });

  it('resolves direction from rtlLocales first, then the built-in language list', () => {
    expect(resolveLocale('ar')?.direction).toBe('rtl');
    expect(resolveLocale('he-IL')?.direction).toBe('rtl');
    expect(resolveLocale('fr')?.direction).toBe('ltr');
    expect(resolveLocale('ar', ['ar'])?.direction).toBe('rtl');
    expect(resolveLocale('he', ['ar'])?.direction).toBe('ltr');
    expect(resolveLocale('x-bad')).toBeNull();
  });

  it('applies lang and dir to the root', () => {
    const attrs: Record<string, string> = {};
    applyLocale({ setAttribute: (n, v) => void (attrs[n] = v) }, resolveLocale('ar')!);
    expect(attrs).toEqual({ lang: 'ar', dir: 'rtl' });
  });
});

describe('message seam', () => {
  it('formats placeholders as plain text and leaves unknown placeholders visible', () => {
    expect(formatMessage('{title} page', { title: '<b>Orders</b>' })).toBe('<b>Orders</b> page');
    expect(formatMessage('In {tenant}')).toBe('In {tenant}');
  });

  it('lets overrides win key by key and shows the key for missing copy', () => {
    const r = createMessageResolver('fr', { a: 'Alpha', b: 'Beta' }, { b: 'Bêta', c: 1 as unknown as string });
    expect(r.resolve('a')).toBe('Alpha');
    expect(r.resolve('b')).toBe('Bêta');
    expect(r.has('c')).toBe(false);
    expect(r.resolve('missing.key')).toBe('missing.key');
  });

  it('selects plural forms through Intl.PluralRules', () => {
    const r = createMessageResolver('en', { 'n.more': '{count} more status messages', 'n.more#one': '{count} more status message' });
    expect(r.resolve('n.more', { count: 1 })).toBe('1 more status message');
    expect(r.resolve('n.more', { count: 3 })).toBe('3 more status messages');
    const ar = createMessageResolver('ar', { k: 'other {count}', 'k#two': 'two {count}' });
    expect(ar.resolve('k', { count: 2 })).toBe('two 2');
  });
});
