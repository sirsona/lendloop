export type ClassValue = string | false | null | undefined | 0;

/** Join conditional class names without pulling in a dependency. */
export function cn(...values: ClassValue[]) {
  return values.filter(Boolean).join(" ");
}
