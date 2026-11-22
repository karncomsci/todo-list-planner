// Times of day, always in 24-hour form (D9). A time is "HH:MM" or "" for none.

/** The Thai name of the part of the day a "HH:MM" time (or "HH" hour) falls in. */
export function dayPeriod(time: string): string {
  const hour = Number(time.slice(0, 2));
  if (hour < 5) return "กลางดึก";
  if (hour < 12) return "เช้า";
  if (hour < 13) return "เที่ยง";
  if (hour < 16) return "บ่าย";
  if (hour < 19) return "เย็น";
  return "ค่ำ";
}

/** The 24 hours, "00" to "23". */
export const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));

/**
 * The minutes offered: every five minutes, plus the current minute when a
 * saved time is off that step, so it is never lost.
 */
export function minutesFor(current: string): string[] {
  const steps = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
  return current && !steps.includes(current) ? [...steps, current].sort() : steps;
}

/** Splits "HH:MM" into its hour and minute; "" gives two empty parts. */
export function splitTime(time: string): { hour: string; minute: string } {
  const [hour = "", minute = ""] = time ? time.split(":") : [];
  return { hour, minute };
}

/**
 * The time after choosing an hour or a minute. Choosing no hour clears the
 * time; an hour without a minute yet takes ":00".
 */
export function joinTime(hour: string, minute: string): string {
  return hour ? `${hour}:${minute || "00"}` : "";
}
