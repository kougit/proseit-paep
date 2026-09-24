/**
 * PAEP IB0-WP05 minimal YAML reader for the CI policy checks.
 *
 * Reads the block-style subset used by .github/workflows/paep-ci.yml and
 * .github/actions/paep-setup/action.yml: mappings, sequences (including
 * "- key: value" items), plain and quoted scalars, [a, b] and {} flow values,
 * "|" block scalars and comments. Anything else (tabs, anchors, aliases, tags,
 * folded scalars, flow mappings, duplicate keys, backslash escapes, any
 * character outside printable ASCII and \n) throws, so the policy checks in
 * verify-ib0-wp05.mjs fail closed instead of misreading a workflow.
 * Node.js built-ins only; no YAML dependency is added.
 */

export function parseYaml(text) {
  if (text.includes('\t')) throw new Error('tab characters are not supported');
  // Printable ASCII and \n only: YAML parsers treat \r, U+0085, U+2028 and U+2029 as line breaks, and a
  // line break this reader missed could hide a key inside what looks like a comment (independent QA, NEL).
  const bad = /[^\x20-\x7e\n]/.exec(text);
  if (bad) throw new Error(`character U+${bad[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} at offset ${bad.index} is not supported (printable ASCII and \\n only)`);
  const raw = text.split(/\r?\n/);
  let i = 0;
  const blank = (l) => /^\s*(#.*)?$/.test(l);
  const ind = (l) => l.match(/^ */)[0].length;
  const isItem = (l) => /^ *-( |$)/.test(l);
  const skip = () => { while (i < raw.length && blank(raw[i])) i++; };
  const KEY = /^ *([A-Za-z0-9_.\-/]+):(?: +(.*))?$/;
  function scalar(s) {
    s = s.trim();
    if (s.startsWith('"') || s.startsWith("'")) {
      const q = s[0];
      let j = 1; let v = '';
      for (; j < s.length; j++) {
        const c = s[j];
        if (q === "'" && c === "'" && s[j + 1] === "'") { v += "'"; j++; continue; }
        // Escape sequences (\x24, \u0024, \t, ...) are not decoded; reject them so a value can never
        // read differently here than on GitHub.
        if (q === '"' && c === '\\') throw new Error(`escape sequence in double-quoted scalar is not supported: ${s}`);
        if (c === q) break;
        v += c;
      }
      if (j >= s.length) throw new Error(`unterminated quoted scalar: ${s}`);
      const restStr = s.slice(j + 1).trim();
      if (restStr && !restStr.startsWith('#')) throw new Error(`text after quoted scalar: ${s}`);
      return v;
    }
    const c = s.search(/(^| )#/);
    if (c >= 0) s = s.slice(0, c).trim();
    if (s === '' || s === 'null' || s === '~') return null;
    if (s === '{}') return {};
    if (s === '[]') return [];
    if (/^\[.*\]$/.test(s)) return s.slice(1, -1).split(',').map((x) => scalar(x));
    if (/^[{&*!>|%@`]/.test(s)) throw new Error(`unsupported YAML value: ${s}`);
    // A plain scalar may not contain ": " (YAML reads it as a nested mapping and rejects the file).
    if (/: /.test(s) || s.endsWith(':')) throw new Error(`plain scalar contains ": " (quote it): ${s}`);
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (/^-?\d+$/.test(s)) return Number(s);
    return s;
  }
  function node(indent) {
    skip();
    if (i >= raw.length) return null;
    if (ind(raw[i]) !== indent) throw new Error(`line ${i + 1}: unexpected indentation`);
    return isItem(raw[i]) ? seq(indent) : map(indent);
  }
  function block(indent) {
    const out = [];
    let j = i;
    while (j < raw.length && (raw[j].trim() === '' || ind(raw[j]) > indent)) out.push(raw[j++]);
    while (out.length && out[out.length - 1].trim() === '') out.pop();
    i = j;
    if (!out.length) return '';
    const bi = ind(out.find((l) => l.trim() !== ''));
    return out.map((l) => l.slice(Math.min(bi, ind(l)))).join('\n') + '\n';
  }
  function value(rest, indent) {
    if (rest === undefined || rest === '' || /^#/.test(rest)) {
      skip();
      if (i < raw.length && ind(raw[i]) > indent) return node(ind(raw[i]));
      if (i < raw.length && ind(raw[i]) === indent && isItem(raw[i])) return seq(indent);
      return null;
    }
    if (/^\|-?\s*(#.*)?$/.test(rest)) {
      const strip = rest.startsWith('|-');
      const v = block(indent);
      return strip ? v.replace(/\n$/, '') : v;
    }
    return scalar(rest);
  }
  function map(indent) {
    const o = {};
    for (;;) {
      skip();
      if (i >= raw.length || ind(raw[i]) < indent) break;
      if (ind(raw[i]) > indent) throw new Error(`line ${i + 1}: unexpected indentation`);
      if (isItem(raw[i])) break;
      const m = KEY.exec(raw[i]);
      if (!m) throw new Error(`line ${i + 1}: cannot parse "${raw[i].trim()}"`);
      if (Object.prototype.hasOwnProperty.call(o, m[1])) throw new Error(`line ${i + 1}: duplicate key ${m[1]}`);
      i++;
      o[m[1]] = value(m[2], indent);
    }
    return o;
  }
  function seq(indent) {
    const a = [];
    for (;;) {
      skip();
      if (i >= raw.length || ind(raw[i]) !== indent || !isItem(raw[i])) break;
      const rest = raw[i].slice(indent + 1).replace(/^ /, '');
      if (rest.trim() === '' || rest.trim().startsWith('#')) { i++; a.push(value(undefined, indent)); continue; }
      if (KEY.test(rest)) { raw[i] = ' '.repeat(indent + 2) + rest; a.push(map(indent + 2)); continue; }
      i++;
      a.push(scalar(rest));
    }
    return a;
  }
  const out = node(0);
  skip();
  if (i < raw.length) throw new Error(`line ${i + 1}: unparsed content`);
  return out;
}
