/** "Nov 26" or "26 nov.", with the year when it is not the current one. */
export function formatDay(timestamp: number, locale: string, now = Date.now()): string {
  const date = new Date(timestamp);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
  });
}
