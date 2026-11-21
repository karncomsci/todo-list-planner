import { describe, expect, it } from "vitest";
import { ApiError } from "./client";
import { errorText } from "./messages";

describe("errorText", () => {
  it("names the field of a validation error in Thai", () => {
    expect(errorText(new ApiError(422, "required", "email is required", "email"))).toBe("กรุณากรอกอีเมล");
  });

  it("gives one message for a wrong email or password", () => {
    expect(errorText(new ApiError(401, "invalid_credentials", "x"))).toBe("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  });

  it("falls back to the field name for an unknown validation code", () => {
    expect(errorText(new ApiError(422, "something_new", "x", "password"))).toBe("รหัสผ่านไม่ถูกต้อง");
  });

  it("has a generic message for anything else", () => {
    expect(errorText(new Error("boom"))).toBe("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่");
  });
});
