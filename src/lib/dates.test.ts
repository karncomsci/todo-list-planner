import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  formatThaiDate,
  isoToLocalDate,
  localDateToIso,
  startOfMonth,
  todayIso,
  weekdayFromMonday,
} from "./dates";

describe("formatThaiDate", () => {
  it("writes Thai dates with BE years", () => {
    expect(formatThaiDate("2026-11-21")).toBe("21 พฤศจิกายน 2569");
    expect(formatThaiDate("2026-11-21", "short")).toBe("21 พ.ย. 2569");
    expect(formatThaiDate("2026-11-21", "weekday")).toBe("วันเสาร์ที่ 21 พฤศจิกายน 2569");
    expect(formatThaiDate("2026-11-21", "monthYear")).toBe("พฤศจิกายน 2569");
  });

  it("changes BE year with the CE year at New Year", () => {
    expect(formatThaiDate("2026-12-31", "short")).toBe("31 ธ.ค. 2569");
    expect(formatThaiDate("2027-01-01", "short")).toBe("1 ม.ค. 2570");
  });

  it("shows 29 February of a leap year (2567 = 2024)", () => {
    expect(formatThaiDate("2024-02-29", "short")).toBe("29 ก.พ. 2567");
  });
});

describe("calendar widget dates", () => {
  it("round-trips a date through a local Date", () => {
    for (const iso of ["2026-11-21", "2024-02-29", "2026-12-31", "2027-01-01"]) {
      expect(localDateToIso(isoToLocalDate(iso))).toBe(iso);
    }
  });

  it("takes the calendar day of a local Date, not its UTC day", () => {
    expect(localDateToIso(new Date(2026, 10, 21, 23, 59))).toBe("2026-11-21");
    expect(localDateToIso(new Date(2026, 10, 21, 0, 0))).toBe("2026-11-21");
  });
});

describe("todayIso", () => {
  it("uses the date in Thailand, not UTC", () => {
    // 20 Nov 2026, 17:30 UTC is 21 Nov, 00:30 in Thailand.
    expect(todayIso(new Date(Date.UTC(2026, 10, 20, 17, 30)))).toBe("2026-11-21");
    expect(todayIso(new Date(Date.UTC(2026, 10, 20, 16, 59)))).toBe("2026-11-20");
  });
});

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("month arithmetic", () => {
  it("finds the first day of a month", () => {
    expect(startOfMonth("2026-11-21")).toBe("2026-11-01");
  });

  it("moves by whole months across a year end, from any day", () => {
    expect(addMonths("2026-11-30", 1)).toBe("2026-12-01");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-01");
    expect(addMonths("2027-01-31", -1)).toBe("2026-12-01");
  });

  it("numbers weekdays from Monday", () => {
    expect(weekdayFromMonday("2026-11-23")).toBe(0); // Monday
    expect(weekdayFromMonday("2026-11-21")).toBe(5); // Saturday
    expect(weekdayFromMonday("2026-11-22")).toBe(6); // Sunday
  });
});
