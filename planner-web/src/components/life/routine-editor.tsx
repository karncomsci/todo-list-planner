"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cardClass, dangerButtonClass, inputClass, primaryButtonClass, secondaryButtonClass, spinnerClass } from "@/components/ui";
import { api } from "@/lib/api/client";
import { errorText } from "@/lib/api/messages";
import type { RoutineEntry, RoutineResponse } from "@/lib/api/types";

const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/**
 * The Routine: one text entry per hour from 05:00 to 23:00, one template used
 * every day (D26, stories 40 to 42). Typing changes the page only; the save
 * button stores the whole template, and clearing empties it after a confirmation.
 */
export function RoutineEditor() {
  const [entries, setEntries] = useState<RoutineEntry[]>();
  const [saved, setSaved] = useState<RoutineEntry[]>();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<"save" | "clear" | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    let current = true;
    api<RoutineResponse>("GET", "/routine")
      .then(({ entries }) => {
        if (!current) return;
        setEntries(entries);
        setSaved(entries);
      })
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, []);

  const changed = entries !== undefined && saved !== undefined && entries.some((e, i) => e.text !== saved[i].text);
  const hasAny = saved?.some((e) => e.text !== "") ?? false;

  function edit(hour: number, text: string) {
    setEntries((list) => list?.map((e) => (e.hour === hour ? { ...e, text } : e)));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!entries) return;
    setBusy("save");
    try {
      const body = await api<RoutineResponse>("PUT", "/routine", { entries });
      setEntries(body.entries);
      setSaved(body.entries);
      toast.success("บันทึกกิจวัตรแล้ว");
    } catch (error) {
      toast.error("บันทึกกิจวัตรไม่สำเร็จ", { description: errorText(error) });
    } finally {
      setBusy(null);
    }
  }

  async function clear() {
    setBusy("clear");
    try {
      await api("DELETE", "/routine");
      const empty = (entries ?? []).map((e) => ({ ...e, text: "" }));
      setEntries(empty);
      setSaved(empty);
      setConfirmClear(false);
      toast.success("ล้างกิจวัตรแล้ว");
    } catch (error) {
      toast.error("ล้างกิจวัตรไม่สำเร็จ", { description: errorText(error) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={cardClass} aria-labelledby="routine-title">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 id="routine-title" className="text-lg font-semibold">
          กิจวัตร
        </h2>
        {changed && <span className="text-sm text-priority-medium">ยังไม่ได้บันทึก</span>}
      </div>
      <p className="mb-4 text-sm text-muted">ตารางเดียวใช้ทุกวัน พิมพ์สิ่งที่ทำในแต่ละชั่วโมงแล้วกดบันทึก</p>

      {failed ? (
        <p className="text-sm text-danger">โหลดกิจวัตรไม่สำเร็จ</p>
      ) : !entries ? (
        <p className="text-sm text-muted">กำลังโหลด…</p>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-4">
          <ol className="flex flex-col gap-1.5">
            {entries.map((entry) => (
              <li key={entry.hour} className="flex items-center gap-3">
                <label htmlFor={`routine-${entry.hour}`} className="w-12 shrink-0 text-sm text-muted tabular-nums">
                  {hourLabel(entry.hour)}
                </label>
                <input
                  id={`routine-${entry.hour}`}
                  value={entry.text}
                  onChange={(e) => edit(entry.hour, e.target.value)}
                  maxLength={200}
                  disabled={busy !== null}
                  className={`${inputClass} py-2`}
                />
              </li>
            ))}
          </ol>

          {confirmClear ? (
            <div role="alertdialog" aria-labelledby="clear-title" className="rounded-xl border border-danger/40 bg-danger/5 p-4">
              <p id="clear-title" className="font-medium text-danger">
                ล้างกิจวัตรทุกชั่วโมง?
              </p>
              <p className="mt-1 text-sm text-muted">ข้อความทุกช่องจะถูกลบและกู้คืนไม่ได้</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={clear} disabled={busy !== null} className={dangerButtonClass}>
                  {busy === "clear" && <LoaderCircle className={spinnerClass} aria-hidden />}
                  ล้างทั้งหมด
                </button>
                <button type="button" onClick={() => setConfirmClear(false)} className={secondaryButtonClass}>
                  ไม่ล้าง
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" disabled={busy !== null || !changed} className={primaryButtonClass}>
                {busy === "save" && <LoaderCircle className={spinnerClass} aria-hidden />}
                บันทึกกิจวัตร
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                disabled={busy !== null || (!hasAny && !changed)}
                className="ml-auto rounded-xl px-4 py-2.5 text-danger hover:bg-danger/10 disabled:opacity-50"
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
