/** Freeze a value and everything reachable from it, bottom-up. Writes then throw in strict-mode code. */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const key of Object.getOwnPropertyNames(value)) deepFreeze((value as Record<string, unknown>)[key]);
    Object.freeze(value);
  }
  return value;
}
