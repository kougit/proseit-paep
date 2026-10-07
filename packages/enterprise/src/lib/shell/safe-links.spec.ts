import { isExternalHelpHref, isInternalRoute, safeHelpLinks } from './safe-links';

describe('shell link policy', () => {
  it('accepts internal routes with a query or fragment', () => {
    for (const r of ['/', '/records', '/records/42?tab=open#top', '/locked/no-permission']) expect(isInternalRoute(r)).toBe(true);
  });

  it('rejects schemes, protocol-relative, relative, backslash, control and white-space routes', () => {
    for (const r of ['https://evil.example', 'javascript:alert(1)', '//evil.example', '/\\evil.example', 'records', '', ' /records', '/a\nb', '/a\tb', '/a\u0000b', '/a\u007fb', '/a b']) {
      expect(isInternalRoute(r)).toBe(false);
    }
    for (const r of [undefined, null, 42, {}]) expect(isInternalRoute(r)).toBe(false);
  });

  it('treats only absolute https: addresses without credentials as external help links', () => {
    expect(isExternalHelpHref('https://help.example/docs?q=1')).toBe(true);
    for (const h of ['http://help.example', 'javascript:alert(1)', 'data:text/html,x', 'vbscript:x', 'file:///etc/passwd', 'ftp://help.example', '//help.example', 'https://user:pw@help.example', 'https://help.example/a b', 'https:\\\\help.example', '/support', undefined]) {
      expect(isExternalHelpHref(h)).toBe(false);
    }
  });

  it('keeps run requests, internal routes and https: links; drops every other href and empty entries', () => {
    const run = () => undefined;
    const links = safeHelpLinks([
      { label: 'Run', run },
      { label: 'Internal', href: '/support' },
      { label: 'External', href: 'https://help.example' },
      { label: 'Script', href: 'javascript:alert(1)' },
      { label: 'Plain', href: 'http://help.example' },
      { label: 'Nothing' },
    ]);
    expect(links.map((l) => l.label)).toEqual(['Run', 'Internal', 'External']);
    expect(safeHelpLinks(undefined)).toEqual([]);
  });
});
