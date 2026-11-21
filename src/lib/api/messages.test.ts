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

  it("lets the caller rename a field, such as a Category name", () => {
    const error = new ApiError(422, "duplicate", "x", "name");
    expect(errorText(error, { name: "ชื่อหมวดหมู่" })).toBe("มีชื่อหมวดหมู่นี้อยู่แล้ว");
  });

  it("explains a Task that no longer exists", () => {
    expect(errorText(new ApiError(404, "not_found", "no such Task"))).toBe("ไม่พบข้อมูลนี้ อาจถูกลบไปแล้ว");
  });

  it("has a generic message for anything else", () => {
    expect(errorText(new Error("boom"))).toBe("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่");
  });
});
