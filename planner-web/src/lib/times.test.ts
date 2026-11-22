import { describe, expect, it } from "vitest";
import { dayPeriod, hours, joinTime, minutesFor, splitTime } from "./times";

describe("dayPeriod", () => {
  it.each([
    ["00:00", "กลางดึก"],
    ["04:59", "กลางดึก"],
    ["05:00", "เช้า"],
    ["11:59", "เช้า"],
    ["12:00", "เที่ยง"],
    ["13:00", "บ่าย"],
    ["15:59", "บ่าย"],
    ["16:00", "เย็น"],
    ["18:59", "เย็น"],
    ["19:00", "ค่ำ"],
    ["23", "ค่ำ"],
  ])("%s is %s", (time, period) => {
    expect(dayPeriod(time)).toBe(period);
  });
});

describe("hours", () => {
  it("runs 00 to 23", () => {
    expect(hours).toHaveLength(24);
    expect([hours[0], hours[13], hours[23]]).toEqual(["00", "13", "23"]);
  });
});

describe("minutesFor", () => {
  it("offers every five minutes", () => {
    expect(minutesFor("")).toEqual(["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]);
    expect(minutesFor("30")).toHaveLength(12);
  });

  it("keeps a saved minute that is off the step, in order", () => {
    const minutes = minutesFor("07");
    expect(minutes).toHaveLength(13);
    expect(minutes.slice(1, 3)).toEqual(["05", "07"]);
  });
});

describe("splitTime and joinTime", () => {
  it("split a time and join it back", () => {
    expect(splitTime("14:30")).toEqual({ hour: "14", minute: "30" });
    expect(splitTime("")).toEqual({ hour: "", minute: "" });
    expect(joinTime("14", "30")).toBe("14:30");
  });

  it("give an hour alone ':00', and no hour no time", () => {
    expect(joinTime("09", "")).toBe("09:00");
    expect(joinTime("", "30")).toBe("");
  });
});
