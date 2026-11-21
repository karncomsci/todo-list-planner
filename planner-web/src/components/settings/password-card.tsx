"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cardClass, inputClass, primaryButtonClass, spinnerClass } from "@/components/ui";
import { api, ApiError } from "@/lib/api/client";
import { errorText } from "@/lib/api/messages";
import type { ChangePasswordRequest } from "@/lib/api/types";

type Field = "currentPassword" | "newPassword" | "confirmPassword";

const fields: { key: Field; label: string; autoComplete: string }[] = [
  { key: "currentPassword", label: "รหัสผ่านปัจจุบัน", autoComplete: "current-password" },
  { key: "newPassword", label: "รหัสผ่านใหม่", autoComplete: "new-password" },
  { key: "confirmPassword", label: "ยืนยันรหัสผ่านใหม่", autoComplete: "new-password" },
];

/**
 * Change the password after confirming the current one (story 54). The API
 * checks the rules and ends the Owner's other sessions; the browser only
 * checks that the new password was typed the same twice.
 */
export function PasswordCard() {
  const [values, setValues] = useState<Record<Field, string>>({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);

  function edit(key: Field, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (values.newPassword !== values.confirmPassword) {
      setErrors({ confirmPassword: "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน" });
      return;
    }
    setBusy(true);
    try {
      const body: ChangePasswordRequest = { currentPassword: values.currentPassword, newPassword: values.newPassword };
      await api("PUT", "/password", body);
      setValues({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setErrors({});
      toast.success("เปลี่ยนรหัสผ่านแล้ว", { description: "อุปกรณ์อื่นที่เข้าสู่ระบบไว้จะต้องเข้าสู่ระบบใหม่" });
    } catch (error) {
      if (error instanceof ApiError && (error.field === "currentPassword" || error.field === "newPassword")) {
        setErrors({ [error.field]: errorText(error) });
      } else {
        toast.error("เปลี่ยนรหัสผ่านไม่สำเร็จ", { description: errorText(error) });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cardClass} aria-labelledby="password-title">
      <h2 id="password-title" className="mb-1 text-lg font-semibold">
        เปลี่ยนรหัสผ่าน
      </h2>
      <p className="mb-4 text-sm text-muted">รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร</p>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {fields.map(({ key, label, autoComplete }) => (
          <div key={key}>
            <label htmlFor={key} className="text-sm font-medium">
              {label}
            </label>
            <input
              id={key}
              type="password"
              autoComplete={autoComplete}
              value={values[key]}
              onChange={(e) => edit(key, e.target.value)}
              aria-invalid={errors[key] ? true : undefined}
              aria-describedby={errors[key] ? `${key}-error` : undefined}
              disabled={busy}
              className={`${inputClass} mt-1.5`}
            />
            {errors[key] && (
              <p id={`${key}-error`} className="mt-1.5 text-sm text-danger">
                {errors[key]}
              </p>
            )}
          </div>
        ))}
        <div>
          <button
            type="submit"
            disabled={busy || !values.currentPassword || !values.newPassword || !values.confirmPassword}
            className={primaryButtonClass}
          >
            {busy && <LoaderCircle className={spinnerClass} aria-hidden />}
            เปลี่ยนรหัสผ่าน
          </button>
        </div>
      </form>
    </section>
  );
}
