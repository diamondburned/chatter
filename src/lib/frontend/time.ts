export function relativeTime(date: Date): string {
  // TODO
  return date.toLocaleString();
}

export function shortTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "numeric",
  });
}
