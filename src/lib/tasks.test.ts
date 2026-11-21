import { describe, expect, it } from "vitest";
import { statusPreview, timeRange } from "./tasks";

describe("statusPreview", () => {
  it.each([
    [0, "not_started"],
    [1, "in_progress"],
    [99, "in_progress"],
    [100, "done"],
  ] as const)("progress %i previews as %s (D21)", (progress, status) => {
    expect(statusPreview(progress)).toBe(status);
  });
});

describe("timeRange", () => {
  it("joins both times", () => {
    expect(timeRange("09:00", "10:30")).toBe("09:00–10:30");
  });

  it("is empty without a time", () => {
    expect(timeRange(null, null)).toBe("");
  });
});
