export function isPrimitive(value: any) {
  return (value === null || (typeof value !== "object" && typeof value !== "function"));
}
