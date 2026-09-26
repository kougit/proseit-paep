import type { RuntimeConfigErrorCode, RuntimeConfigIssue } from '@proseit/paep-contracts';
import { MAX_RUNTIME_CONFIG_DEPTH } from './constants.js';

/*
 * Strict UTF-8 decoding and JSON parsing for runtime configuration. The platform does not use JSON.parse: it silently keeps the
 * last of duplicate keys (so two readers can disagree about one file) and creates own "__proto__" properties. This parser rejects
 * duplicate keys, prototype-shaped keys, excessive nesting and non-finite numbers, and builds null-prototype objects.
 */

export type JsonValue = string | number | boolean | null | JsonArray | JsonObject;
export type JsonArray = JsonValue[];
export interface JsonObject { [key: string]: JsonValue }

export type StrictJsonResult =
  | { readonly ok: true; readonly value: JsonValue }
  | { readonly ok: false; readonly issue: RuntimeConfigIssue };

const FORBIDDEN_KEYS: readonly string[] = ['__proto__', 'constructor', 'prototype'];

/** RFC 6901 pointer segment. */
export function pointerSegment(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1');
}

/** Decode UTF-8 strictly: invalid sequences, overlong forms, surrogates and a byte-order mark all fail. */
export function decodeUtf8Strict(bytes: Uint8Array): { readonly ok: true; readonly text: string } | { readonly ok: false; readonly code: RuntimeConfigErrorCode } {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return { ok: false, code: 'CFG_DECODE_BOM' };
  const parts: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i] as number;
    let cp: number;
    let len: number;
    if (b0 < 0x80) { cp = b0; len = 1; }
    else if (b0 >= 0xc2 && b0 <= 0xdf) { cp = b0 & 0x1f; len = 2; }
    else if (b0 >= 0xe0 && b0 <= 0xef) { cp = b0 & 0x0f; len = 3; }
    else if (b0 >= 0xf0 && b0 <= 0xf4) { cp = b0 & 0x07; len = 4; }
    else return { ok: false, code: 'CFG_DECODE_UTF8' };
    if (i + len > bytes.length) return { ok: false, code: 'CFG_DECODE_UTF8' };
    for (let k = 1; k < len; k += 1) {
      const b = bytes[i + k] as number;
      if ((b & 0xc0) !== 0x80) return { ok: false, code: 'CFG_DECODE_UTF8' };
      cp = (cp << 6) | (b & 0x3f);
    }
    if ((len === 3 && cp < 0x800) || (len === 4 && (cp < 0x10000 || cp > 0x10ffff)) || (cp >= 0xd800 && cp <= 0xdfff)) return { ok: false, code: 'CFG_DECODE_UTF8' };
    parts.push(String.fromCodePoint(cp));
    i += len;
  }
  return { ok: true, text: parts.join('') };
}

class ParseFailure {
  constructor(readonly code: RuntimeConfigErrorCode, readonly path: string) {}
}

/** Parse one JSON document (RFC 8259) strictly. Never throws. */
export function parseStrictJson(text: string): StrictJsonResult {
  let pos = 0;
  const fail = (code: RuntimeConfigErrorCode, path: string): never => { throw new ParseFailure(code, path); };
  const ws = (): void => { while (pos < text.length && (text[pos] === ' ' || text[pos] === '\t' || text[pos] === '\n' || text[pos] === '\r')) pos += 1; };

  const parseString = (path: string): string => {
    pos += 1;
    let out = '';
    for (;;) {
      if (pos >= text.length) fail('CFG_PARSE_SYNTAX', path);
      const c = text.charCodeAt(pos);
      if (c === 0x22) { pos += 1; return out; }
      if (c < 0x20) fail('CFG_PARSE_SYNTAX', path);
      if (c === 0x5c) {
        const e = text[pos + 1];
        const simple: Record<string, string> = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
        if (e !== undefined && Object.hasOwn(simple, e)) { out += simple[e]; pos += 2; continue; }
        if (e === 'u') {
          const hex = text.slice(pos + 2, pos + 6);
          if (!/^[0-9A-Fa-f]{4}$/.test(hex)) fail('CFG_PARSE_SYNTAX', path);
          out += String.fromCharCode(parseInt(hex, 16));
          pos += 6;
          continue;
        }
        fail('CFG_PARSE_SYNTAX', path);
      }
      out += text[pos];
      pos += 1;
    }
  };

  const parseNumber = (path: string): number => {
    const m = /^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/.exec(text.slice(pos));
    if (!m) return fail('CFG_PARSE_SYNTAX', path);
    pos += m[0].length;
    const n = Number(m[0]);
    if (!Number.isFinite(n)) fail('CFG_PARSE_NUMBER', path);
    return n;
  };

  const parseValue = (path: string, depth: number): JsonValue => {
    ws();
    const c = text[pos];
    if (c === '{' || c === '[') {
      if (depth >= MAX_RUNTIME_CONFIG_DEPTH) fail('CFG_PARSE_DEPTH', path);
      pos += 1;
      ws();
      if (c === '[') {
        const arr: JsonArray = [];
        if (text[pos] === ']') { pos += 1; return arr; }
        for (;;) {
          arr.push(parseValue(`${path}/${arr.length}`, depth + 1));
          ws();
          if (text[pos] === ',') { pos += 1; continue; }
          if (text[pos] === ']') { pos += 1; return arr; }
          return fail('CFG_PARSE_SYNTAX', path);
        }
      }
      const obj = Object.create(null) as JsonObject;
      const seen = new Set<string>();
      if (text[pos] === '}') { pos += 1; return obj; }
      for (;;) {
        ws();
        if (text[pos] !== '"') fail('CFG_PARSE_SYNTAX', path);
        const key = parseString(path);
        if (FORBIDDEN_KEYS.includes(key)) fail('CFG_PARSE_FORBIDDEN_KEY', path);
        if (seen.has(key)) fail('CFG_PARSE_DUPLICATE_KEY', path);
        seen.add(key);
        ws();
        if (text[pos] !== ':') fail('CFG_PARSE_SYNTAX', path);
        pos += 1;
        obj[key] = parseValue(`${path}/${pointerSegment(key)}`, depth + 1);
        ws();
        if (text[pos] === ',') { pos += 1; continue; }
        if (text[pos] === '}') { pos += 1; return obj; }
        return fail('CFG_PARSE_SYNTAX', path);
      }
    }
    if (c === '"') return parseString(path);
    if (c === '-' || (c !== undefined && c >= '0' && c <= '9')) return parseNumber(path);
    for (const [word, value] of [['true', true], ['false', false], ['null', null]] as const) {
      if (text.startsWith(word, pos)) { pos += word.length; return value; }
    }
    return fail('CFG_PARSE_SYNTAX', path);
  };

  try {
    const value = parseValue('', 0);
    ws();
    if (pos !== text.length) fail('CFG_PARSE_SYNTAX', '');
    return { ok: true, value };
  } catch (e) {
    if (e instanceof ParseFailure) return { ok: false, issue: { stage: 'parse', code: e.code, path: e.path } };
    return { ok: false, issue: { stage: 'parse', code: 'CFG_PARSE_SYNTAX', path: '' } };
  }
}
