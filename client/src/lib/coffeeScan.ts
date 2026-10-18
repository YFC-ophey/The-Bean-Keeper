export function clearAutoFilledValues<T extends Record<string, string>>(
  form: T,
  autoFilled: Partial<T>,
): T {
  const next = { ...form };
  for (const [key, value] of Object.entries(autoFilled)) {
    if (next[key] === value) next[key as keyof T] = "" as T[keyof T];
  }
  return next;
}

export function applyScanValues<T extends Record<string, string>>(
  form: T,
  extracted: object,
): { form: T; autoFilled: Partial<T> } {
  const next = { ...form };
  const autoFilled: Partial<T> = {};
  for (const [key, value] of Object.entries(extracted)) {
    if (!(key in next) || typeof value !== "string" || !value.trim() || next[key]) continue;
    next[key as keyof T] = value.trim() as T[keyof T];
    autoFilled[key as keyof T] = value.trim() as T[keyof T];
  }
  return { form: next, autoFilled };
}
