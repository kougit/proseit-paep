/** Deep-freeze a JSON-shaped value in place and return it (test doubles hand out immutable data only). */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key]);
    Object.freeze(value);
  }
  return value;
}

/** Structural copy of a JSON-shaped value; seeded data is never shared with callers. */
export function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Deep-frozen structural copy. */
export function frozenCopy<T>(value: T): T {
  return deepFreeze(jsonClone(value));
}
