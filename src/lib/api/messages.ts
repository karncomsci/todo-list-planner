import { ApiError } from "./client";

/** Thai names of request fields, used in validation messages. */
const fieldLabels: Record<string, string> = {
  email: "อีเมล",
  password: "รหัสผ่าน",
};

/** Thai text per error code. Validation codes take the field's Thai name. */
const messages: Record<string, (label: string) => string> = {
  required: (label) => `กรุณากรอก${label}`,
  invalid_credentials: () => "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  too_many_attempts: () => "เข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอ 1 นาทีแล้วลองใหม่",
  unauthorized: () => "กรุณาเข้าสู่ระบบก่อน",
  network: () => "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ",
  database_unavailable: () => "ฐานข้อมูลไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง",
};

/** The Thai message to show the Owner for any thrown error. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    const label = (error.field && fieldLabels[error.field]) || "ข้อมูล";
    const message = messages[error.code];
    if (message) return message(label);
    if (error.field) return `${label}ไม่ถูกต้อง`;
  }
  return "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่";
}
