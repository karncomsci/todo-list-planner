import { describe, expect, it } from "vitest";
import { customRangeProblem, periodRange } from "./reports";

describe("periodRange", () => {
  it("runs this week from Monday to Sunday", () => {
    // Saturday 21 Nov 2026.
    expect(periodRange("week", "2026-11-21")).toEqual({ from: "2026-11-16", to: "2026-11-22" });
    // A Monday and a Sunday stay in their own week.
    expect(periodRange("week", "2026-11-16")).toEqual({ from: "2026-11-16", to: "2026-11-22" });
    expect(periodRange("week", "2026-11-22")).toEqual({ from: "2026-11-16", to: "2026-11-22" });
  });
  it("crosses months and years for a week that does", () => {
    expect(periodRange("week", "2026-12-31")).toEqual({ from: "2026-12-28", to: "2027-01-03" });
  });
  it("covers the whole month, leap February included", () => {
    expect(periodRange("month", "2026-11-21")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(periodRange("month", "2028-02-10")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(periodRange("month", "2026-12-31")).toEqual({ from: "2026-12-01", to: "2026-12-31" });
  });
  it("covers the whole CE year", () => {
    expect(periodRange("year", "2026-11-21")).toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });
});

describe("customRangeProblem", () => {
  it("accepts a range up to 400 days", () => {
    expect(customRangeProblem("2026-01-01", "2026-01-01")).toBeNull();
    expect(customRangeProblem("2026-01-01", "2027-02-05")).toBeNull();
  });
  it("names what is wrong", () => {
    expect(customRangeProblem("", "2026-01-01")).toMatch(/เลือก/);
    expect(customRangeProblem("2026-02-01", "2026-01-01")).toMatch(/ก่อนวันเริ่ม/);
    expect(customRangeProblem("2026-01-01", "2027-02-06")).toMatch(/400/);
  });
});
