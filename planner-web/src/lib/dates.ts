// Dates in the web. The API speaks CE dates as "YYYY-MM-DD"; the Owner sees
// BE years (D9). Every conversion between the two happens in this file.

/** The one time zone of the system (D9). */
export const TIME_ZONE = "Asia/Bangkok";

/** A CE date as the API sends and receives it, "YYYY-MM-DD". */
export type IsoDate = string;

function toUtc(iso: IsoDate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

/** Today's date in Thailand, whatever the device's time zone. */
export function todayIso(now: Date = new Date()): IsoDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = toUtc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtc(date);
}

/** The first day of the month that holds this date. */
export function startOfMonth(iso: IsoDate): IsoDate {
  return `${iso.slice(0, 7)}-01`;
}

/** The first day of the month `months` away from this date's month. */
export function addMonths(iso: IsoDate, months: number): IsoDate {
  const date = toUtc(startOfMonth(iso));
  date.setUTCMonth(date.getUTCMonth() + months);
  return fromUtc(date);
}

/** Day of the week with Monday as 0 and Sunday as 6 (weeks start on Monday, D9). */
export function weekdayFromMonday(iso: IsoDate): number {
  return (toUtc(iso).getUTCDay() + 6) % 7;
}

/** A date as a local-midnight Date, the form calendar widgets work in. */
export function isoToLocalDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** The calendar day of a local Date, ignoring its time. */
export function localDateToIso(date: Date): IsoDate {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const thaiFormats = {
  long: { day: "numeric", month: "long", year: "numeric" },
  short: { day: "numeric", month: "short", year: "numeric" },
  weekday: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  monthYear: { month: "long", year: "numeric" },
  dayMonth: { day: "numeric", month: "long" },
  dayMonthShort: { day: "numeric", month: "short" },
  year: { year: "numeric" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

/**
 * A CE date in Thai with a BE year: long "21 พฤศจิกายน 2569", short "21 พ.ย. 2569",
 * weekday "วันเสาร์ที่ 21 พฤศจิกายน 2569", monthYear "พฤศจิกายน 2569", dayMonth "21 พฤศจิกายน", year "พ.ศ. 2569".
 */
export function formatThaiDate(iso: IsoDate, style: keyof typeof thaiFormats = "long"): string {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { ...thaiFormats[style], timeZone: "UTC" }).format(toUtc(iso));
}

/**
 * An inclusive range of days in Thai with BE years, naming the month and year
 * only once where both ends share them: "16 – 22 พฤศจิกายน 2569",
 * "28 กันยายน – 4 ตุลาคม 2569", "29 ธันวาคม 2568 – 4 มกราคม 2569".
 */
export function formatThaiDateRange(first: IsoDate, last: IsoDate): string {
  const end = formatThaiDate(last);
  if (first.slice(0, 7) === last.slice(0, 7)) return `${Number(first.slice(8))} – ${end}`;
  if (first.slice(0, 4) === last.slice(0, 4)) return `${formatThaiDate(first, "dayMonth")} – ${end}`;
  return `${formatThaiDate(first)} – ${end}`;
}
