import { ApiError } from "./client";

/** Thai names of request fields, used in validation messages. */
const fieldLabels: Record<string, string> = {
  email: "อีเมล",
  password: "รหัสผ่าน",
  name: "ชื่องาน",
  dueDate: "วันครบกำหนด",
  startDate: "วันเริ่ม",
  startTime: "เวลาเริ่ม",
  endTime: "เวลาสิ้นสุด",
  priority: "ความสำคัญ",
  progress: "ความคืบหน้า",
  note: "โน้ต",
  categoryId: "หมวดหมู่",
  entries: "กิจวัตร",
  glasses: "จำนวนแก้วน้ำ",
  breakfastMenu: "เมนูมื้อเช้า",
  lunchMenu: "เมนูมื้อกลางวัน",
  dinnerMenu: "เมนูมื้อเย็น",
  date: "วันที่",
};

/** Thai text per error code. Validation codes take the field's Thai name. */
const messages: Record<string, (label: string) => string> = {
  required: (label) => `กรุณากรอก${label}`,
  too_long: (label) => `${label}ยาวเกินไป`,
  invalid_date: (label) => `${label}ไม่ใช่วันที่ที่ถูกต้อง`,
  out_of_range: (label) => `${label}อยู่นอกช่วงที่รับได้`,
  invalid_time: (label) => `${label}ไม่ใช่เวลาที่ถูกต้อง`,
  invalid_choice: (label) => `${label}ไม่ถูกต้อง`,
  start_after_due: () => "วันเริ่มต้องไม่อยู่หลังวันครบกำหนด",
  end_before_start: () => "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม",
  duplicate: (label) => `มี${label}นี้อยู่แล้ว`,
  invalid_credentials: () => "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  too_many_attempts: () => "เข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอ 1 นาทีแล้วลองใหม่",
  unauthorized: () => "กรุณาเข้าสู่ระบบก่อน",
  not_found: () => "ไม่พบข้อมูลนี้ อาจถูกลบไปแล้ว",
  network: () => "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ",
  database_unavailable: () => "ฐานข้อมูลไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง",
};

/**
 * The Thai message to show the Owner for any thrown error. `labels` overrides
 * field names where one request field means something else, such as a
 * Category's `name`.
 */
export function errorText(error: unknown, labels: Record<string, string> = {}): string {
  if (error instanceof ApiError) {
    const label = (error.field && (labels[error.field] ?? fieldLabels[error.field])) || "ข้อมูล";
    const message = messages[error.code];
    if (message) return message(label);
    if (error.field) return `${label}ไม่ถูกต้อง`;
  }
  return "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่";
}
