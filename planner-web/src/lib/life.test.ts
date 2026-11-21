import { describe, expect, it } from "vitest";
import { glassesAfterPress } from "./life";

describe("glassesAfterPress", () => {
  it("fills every glass up to the one pressed", () => {
    expect(glassesAfterPress(0, 3)).toBe(3);
    expect(glassesAfterPress(2, 5)).toBe(5);
  });
  it("lowers to a glass below the current level", () => {
    expect(glassesAfterPress(6, 2)).toBe(2);
  });
  it("takes one away when the last filled glass is pressed again", () => {
    expect(glassesAfterPress(4, 4)).toBe(3);
    expect(glassesAfterPress(1, 1)).toBe(0);
  });
});
