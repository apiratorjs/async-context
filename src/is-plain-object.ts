export function isPlainObject(value: any): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && value.constructor === Object;
}
