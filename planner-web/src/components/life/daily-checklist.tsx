"use client";

import { Check, ChevronLeft, ChevronRight, GlassWater, LoaderCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cardClass, inputClass, secondaryButtonClass, spinnerClass } from "@/components/ui";
import { api } from "@/lib/api/client";
import { errorText } from "@/lib/api/messages";
import type { Checklist, ChecklistRequest, ChecklistResponse, SettingsResponse } from "@/lib/api/types";
import { addDays, formatThaiDate, type IsoDate, todayIso } from "@/lib/dates";
import { glassesAfterPress } from "@/lib/life";

type Meal = "breakfast" | "lunch" | "dinner";

const meals: { key: Meal; label: string }[] = [
  { key: "breakfast", label: "มื้อเช้า" },
  { key: "lunch", label: "มื้อกลางวัน" },
  { key: "dinner", label: "มื้อเย็น" },
];

function requestOf(checklist: Checklist): ChecklistRequest {
  const { date: _date, ...rest } = checklist;
  void _date;
  return rest;
}

/**
 * The Daily Checklist (D27, stories 43 to 47): glasses of water against the
 * Water Goal, three meals with a menu and a tick, and the Reminder Note. It
 * opens on today, so each day starts empty; past days stay and can be opened.
 * Ticks save at once, text when the field is left. Browser only: it reads the clock.
 */
export default function DailyChecklist() {
  const [today] = useState(todayIso);
  const [day, setDay] = useState<IsoDate>(today);
  const [checklist, setChecklist] = useState<Checklist>();
  const [waterGoal, setWaterGoal] = useState<number>();
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  // The last version the API accepted, to go back to when a save fails.
  const saved = useRef<Checklist | undefined>(undefined);

  useEffect(() => {
    let current = true;
    api<SettingsResponse>("GET", "/settings")
      .then(({ settings }) => current && setWaterGoal(settings.waterGoal))
      .catch(() => current && setWaterGoal(8));
    return () => {
      current = false;
    };
  }, []);

  useEffect(() => {
    let current = true;
    api<ChecklistResponse>("GET", `/checklists/${day}`)
      .then(({ checklist }) => {
        if (!current) return;
        saved.current = checklist;
        setChecklist(checklist);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [day]);

  function showDay(next: IsoDate) {
    setChecklist(undefined);
    setDay(next);
  }

  /** Saves the whole day; on failure shows the last saved version again. */
  async function save(next: Checklist) {
    setChecklist(next);
    setSaving(true);
    try {
      const { checklist: stored } = await api<ChecklistResponse>("PUT", `/checklists/${next.date}`, requestOf(next));
      saved.current = stored;
      // Keep any typing that happened while saving; take the stored values otherwise.
      setChecklist((shown) => (shown && shown.date === stored.date ? { ...stored, ...pendingText(shown, next) } : shown));
    } catch (error) {
      toast.error("บันทึกเช็กลิสต์ไม่สำเร็จ", { description: errorText(error) });
      setChecklist((shown) => (shown && saved.current && shown.date === saved.current.date ? saved.current : shown));
    } finally {
      setSaving(false);
    }
  }

  /** Text fields the Owner changed after `sent` was sent. */
  function pendingText(shown: Checklist, sent: Checklist): Partial<Checklist> {
    const keys = ["breakfastMenu", "lunchMenu", "dinnerMenu", "note"] as const;
    return Object.fromEntries(keys.filter((k) => shown[k] !== sent[k]).map((k) => [k, shown[k]]));
  }

  function saveTextIfChanged(key: "breakfastMenu" | "lunchMenu" | "dinnerMenu" | "note") {
    if (!checklist || !saved.current) return;
    if (checklist[key].trim() === saved.current[key]) return;
    void save(checklist);
  }

  const isToday = day === today;
  const glassCount = checklist ? Math.max(waterGoal ?? 8, checklist.glasses) : (waterGoal ?? 8);

  return (
    <section className={cardClass} aria-labelledby="checklist-title">
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <h2 id="checklist-title" className="text-lg font-semibold">
            เช็กลิสต์ประจำวัน
          </h2>
          <p className="text-sm text-muted" aria-live="polite">
            {formatThaiDate(day, "weekday")}
            {isToday && " (วันนี้)"}
          </p>
        </div>
        {saving && <LoaderCircle className={`${spinnerClass} text-muted`} aria-label="กำลังบันทึก" />}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => showDay(addDays(day, -1))}
            aria-label="วันก่อนหน้า"
            className="rounded-xl p-2 hover:bg-primary-soft hover:text-primary"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button type="button" onClick={() => showDay(today)} disabled={isToday} className={secondaryButtonClass}>
            วันนี้
          </button>
          <button
            type="button"
            onClick={() => showDay(addDays(day, 1))}
            aria-label="วันถัดไป"
            className="rounded-xl p-2 hover:bg-primary-soft hover:text-primary"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      {failed ? (
        <p className="text-sm text-danger">โหลดเช็กลิสต์ไม่สำเร็จ</p>
      ) : !checklist || waterGoal === undefined ? (
        <p className="text-sm text-muted">กำลังโหลด…</p>
      ) : (
        <div className="flex flex-col gap-6">
          <fieldset>
            <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-medium">
              <span>ดื่มน้ำ</span>
              <span className="font-normal text-muted tabular-nums">
                {checklist.glasses} / {waterGoal} แก้ว
              </span>
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: glassCount }, (_, i) => i + 1).map((n) => {
                const filled = n <= checklist.glasses;
                return (
                  <motion.button
                    key={n}
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    onClick={() => save({ ...checklist, glasses: glassesAfterPress(checklist.glasses, n) })}
                    aria-label={`แก้วที่ ${n}`}
                    aria-pressed={filled}
                    className={`flex size-10 items-center justify-center rounded-xl border ${
                      filled ? "border-priority-low bg-priority-low/15 text-priority-low" : "border-border text-muted/60 hover:bg-bg"
                    }`}
                  >
                    <GlassWater className="size-5" aria-hidden />
                  </motion.button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 text-sm font-medium">อาหาร 3 มื้อ</legend>
            {meals.map(({ key, label }) => {
              const doneKey = `${key}Done` as const;
              const menuKey = `${key}Menu` as const;
              const done = checklist[doneKey];
              return (
                <div key={key} className="flex items-center gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    aria-label={`กินแล้ว: ${label}`}
                    onClick={() => save({ ...checklist, [doneKey]: !done })}
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg border-2 ${
                      done ? "border-success bg-success text-surface" : "border-border bg-surface"
                    }`}
                  >
                    {done && <Check className="size-4" strokeWidth={3} aria-hidden />}
                  </button>
                  <label htmlFor={`menu-${key}`} className="w-24 shrink-0 text-sm">
                    {label}
                  </label>
                  <input
                    id={`menu-${key}`}
                    value={checklist[menuKey]}
                    placeholder="เมนู"
                    maxLength={100}
                    onChange={(e) => setChecklist({ ...checklist, [menuKey]: e.target.value })}
                    onBlur={() => saveTextIfChanged(menuKey)}
                    className={`${inputClass} py-2`}
                  />
                </div>
              );
            })}
          </fieldset>

          <div>
            <label htmlFor="reminder-note" className="mb-2 block text-sm font-medium">
              โน้ตเตือนใจ
            </label>
            <textarea
              id="reminder-note"
              rows={3}
              maxLength={1000}
              value={checklist.note}
              placeholder="สิ่งที่อยากย้ำกับตัวเองวันนี้"
              onChange={(e) => setChecklist({ ...checklist, note: e.target.value })}
              onBlur={() => saveTextIfChanged("note")}
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>
      )}
    </section>
  );
}
