"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cardClass, inputClass, primaryButtonClass, spinnerClass } from "@/components/ui";
import { api, ApiError } from "@/lib/api/client";
import { errorText } from "@/lib/api/messages";
import type { SettingsRequest, SettingsResponse } from "@/lib/api/types";

/**
 * The Water Goal in glasses per day, 1 to 30 (D28, story 57). The Daily
 * Checklist shows this many glasses and Reports compare the average with it.
 */
export function WaterGoalCard() {
  const [saved, setSaved] = useState<number>();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let current = true;
    api<SettingsResponse>("GET", "/settings")
      .then(({ settings }) => {
        if (!current) return;
        setSaved(settings.waterGoal);
        setValue(String(settings.waterGoal));
      })
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const goal = Number(value);
    if (!Number.isInteger(goal) || goal < 1 || goal > 30) {
      setError("เป้าดื่มน้ำต้องเป็นจำนวนเต็ม 1 ถึง 30 แก้ว");
      return;
    }
    setBusy(true);
    try {
      const body: SettingsRequest = { waterGoal: goal };
      const { settings } = await api<SettingsResponse>("PUT", "/settings", body);
      setSaved(settings.waterGoal);
      setValue(String(settings.waterGoal));
      setError(undefined);
      toast.success("บันทึกเป้าดื่มน้ำแล้ว", { description: `${settings.waterGoal} แก้วต่อวัน` });
    } catch (err) {
      if (err instanceof ApiError && err.field === "waterGoal") setError(errorText(err));
      else toast.error("บันทึกเป้าดื่มน้ำไม่สำเร็จ", { description: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cardClass} aria-labelledby="water-goal-title">
      <h2 id="water-goal-title" className="mb-1 text-lg font-semibold">
        เป้าดื่มน้ำ
      </h2>
      <p className="mb-4 text-sm text-muted">จำนวนแก้วต่อวันที่แสดงในเช็กลิสต์ประจำวัน</p>
      {failed ? (
        <p className="text-sm text-danger">โหลดการตั้งค่าไม่สำเร็จ</p>
      ) : saved === undefined ? (
        <p className="text-sm text-muted">กำลังโหลด…</p>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-2" noValidate>
          <label htmlFor="water-goal" className="text-sm font-medium">
            แก้วต่อวัน
          </label>
          <div className="flex items-center gap-2">
            <input
              id="water-goal"
              type="number"
              inputMode="numeric"
              min={1}
              max={30}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(undefined);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "water-goal-error" : undefined}
              className={`${inputClass} w-28 py-2`}
            />
            <button type="submit" disabled={busy || value === String(saved)} className={`${primaryButtonClass} px-4 py-2 text-sm`}>
              {busy && <LoaderCircle className={spinnerClass} aria-hidden />}
              บันทึก
            </button>
          </div>
          {error && (
            <p id="water-goal-error" className="text-sm text-danger">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
