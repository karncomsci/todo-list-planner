import { addDays, addMonths, type IsoDate, startOfMonth, weekdayFromMonday } from "./dates";

/** The four period choices of Reports (D31). */
export type Period = "week" | "month" | "year" | "custom";

/** The most days one report covers; the API refuses longer ranges. */
export const maxReportDays = 400;

/**
 * The CE range, both ends inclusive, of this week (Monday to Sunday, D9),
 * this month or this year around `today`. Custom ranges are chosen by the Owner.
 */
export function periodRange(period: Exclude<Period, "custom">, today: IsoDate): { from: IsoDate; to: IsoDate } {
  switch (period) {
    case "week": {
      const from = addDays(today, -weekdayFromMonday(today));
      return { from, to: addDays(from, 6) };
    }
    case "month": {
      const from = startOfMonth(today);
      return { from, to: addDays(addMonths(from, 1), -1) };
    }
    case "year": {
      const year = today.slice(0, 4);
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    }
  }
}

/** Why a custom range cannot be reported, in Thai, or null when it can. */
export function customRangeProblem(from: IsoDate | "", to: IsoDate | ""): string | null {
  if (!from || !to) return "กรุณาเลือกวันเริ่มและวันสิ้นสุด";
  if (to < from) return "วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่ม";
  if (addDays(from, maxReportDays) < to) return `ช่วงเวลายาวได้ไม่เกิน ${maxReportDays} วัน`;
  return null;
}
