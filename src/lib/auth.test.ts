import { describe, expect, it } from "vitest";
import { safeReturnPath, signInPath } from "./auth";

describe("safeReturnPath", () => {
  it.each([
    ["/calendar", "/calendar"],
    ["/tasks?id=3", "/tasks?id=3"],
  ])("keeps the same-origin path %s", (input, want) => {
    expect(safeReturnPath(input)).toBe(want);
  });

  it.each([
    [null],
    [""],
    ["https://evil.example"],
    ["//evil.example"],
    ["/\\evil.example"],
    ["calendar"],
    ["/sign-in"],
    ["/sign-in?next=/x"],
    ["/api/session"],
  ])("falls back to / for %s", (input) => {
    expect(safeReturnPath(input)).toBe("/");
  });
});

describe("signInPath", () => {
  it("carries the page to return to", () => {
    expect(signInPath("/tasks?id=3")).toBe("/sign-in?next=%2Ftasks%3Fid%3D3");
  });

  it("omits next for the home page", () => {
    expect(signInPath("/")).toBe("/sign-in");
  });
});
