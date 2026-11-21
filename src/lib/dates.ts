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
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

/**
 * A CE date in Thai with a BE year: long "21 พฤศจิกายน 2569", short "21 พ.ย. 2569",
 * weekday "วันเสาร์ที่ 21 พฤศจิกายน 2569", monthYear "พฤศจิกายน 2569".
 */
export function formatThaiDate(iso: IsoDate, style: keyof typeof thaiFormats = "long"): string {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { ...thaiFormats[style], timeZone: "UTC" }).format(toUtc(iso));
}
