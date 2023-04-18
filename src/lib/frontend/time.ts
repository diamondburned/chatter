export function relativeTime(date: Date): string {
  // TODO
  return date.toLocaleString();
}

export const Minute = 60 * 1000;
export const Hour = 60 * Minute;
export const Day = 24 * Hour;
export const Week = 7 * Day;
export const Month = 30 * Day; // estimate
export const Year = 365 * Day; // estimate

export function shortTime(date: Date): string {
  const now = new Date();

  if (date.getFullYear() == now.getFullYear()) {
    if (date.getMonth() == now.getMonth()) {
      const time = date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "numeric",
      });

      if (date.getDay() == now.getDay()) {
        return `Today at ${time}`;
      }

      if (date.getDay() == now.getDay() - 1) {
        return `Yesterday at ${time}`;
      }

      if (date.getDay() > now.getDay() - 7) {
        return `${date.toLocaleDateString(undefined, {
          weekday: "long",
        })} at ${time}`;
      }
    }

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

// untilMidnight returns the number of milliseconds until midnight.
export function untilMidnight(now = Date.now()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now;
}

// onMidnight calls the given callback everytime midnight is reached.
// The returned function can be used to stop the callback.
export function onMidnight(f: () => void): () => void {
  let timer: number;
  const schedule = () => {
    f();
    timer = window.setTimeout(schedule, Day);
  };
  timer = window.setTimeout(schedule, untilMidnight());
  return () => clearTimeout(timer);
}
