"use client";

import { CalendarDays, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { th } from "react-day-picker/locale";
import { addDays, formatThaiDate, isoToLocalDate, localDateToIso, todayIso, type IsoDate } from "@/lib/dates";

type Props = {
  id: string;
  name: string;
  /** A CE date, or "" when nothing is picked. */
  value: IsoDate | "";
  onChange: (value: IsoDate | "") => void;
  invalid?: boolean;
  /** id of the element holding this field's error message. */
  errorId?: string;
  /** Offer a button that empties the field, for optional dates. */
  clearable?: boolean;
};

const shortcuts = [
  { label: "วันนี้", days: 0 },
  { label: "พรุ่งนี้", days: 1 },
  { label: "อีก 7 วัน", days: 7 },
];

/**
 * The one date field of the app: a button that opens a month calendar.
 * Thai month names, BE years, weeks from Monday, today from Thailand time (D9).
 */
export function DatePicker({ id, name, value, onChange, invalid, errorId, clearable }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();

  // Close on a click outside the field.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function pick(next: IsoDate | "") {
    onChange(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div
      ref={rootRef}
      className="relative mt-1.5"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        id={id}
        name={name}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        data-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        title={value ? formatThaiDate(value, "weekday") : undefined}
        className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-bg px-3.5 py-2.5 text-left outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 data-invalid:border-danger"
      >
        <CalendarDays className="size-5 shrink-0 text-muted" aria-hidden />
        <span className={value ? "" : "text-muted"}>{value ? formatThaiDate(value, "long") : "เลือกวันที่"}</span>
      </button>

      {open && <CalendarPanel id={dialogId} value={value} clearable={clearable} onPick={pick} />}
    </div>
  );
}

type PanelProps = {
  id: string;
  value: IsoDate | "";
  clearable?: boolean;
  onPick: (value: IsoDate | "") => void;
};

/** The open calendar. Mounted only while open, so "today" is read at that moment. */
function CalendarPanel({ id, value, clearable, onPick }: PanelProps) {
  const today = isoToLocalDate(todayIso());
  const selected = value ? isoToLocalDate(value) : undefined;

  return (
    <div
      id={id}
      role="dialog"
      aria-label="เลือกวันที่"
      className="absolute left-0 z-30 mt-2 w-max max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface p-3 shadow-xl"
    >
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={(date) => date && onPick(localDateToIso(date))}
        defaultMonth={selected ?? today}
        today={today}
        locale={th}
        weekStartsOn={1}
        captionLayout="dropdown"
        startMonth={new Date(today.getFullYear() - 5, 0)}
        endMonth={new Date(today.getFullYear() + 10, 11)}
        autoFocus
        formatters={{
          formatCaption: (month) => formatThaiDate(localDateToIso(month), "monthYear"),
          formatYearDropdown: (year) => String(year.getFullYear() + 543),
        }}
        labels={{
          labelDayButton: (date, modifiers) =>
            [
              formatThaiDate(localDateToIso(date), "weekday"),
              modifiers.today ? "วันนี้" : "",
              modifiers.selected ? "เลือกอยู่" : "",
            ]
              .filter(Boolean)
              .join(" "),
        }}
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        {shortcuts.map(({ label, days }) => (
          <button
            key={label}
            type="button"
            onClick={() => onPick(addDays(todayIso(), days))}
            className="rounded-lg border border-border px-2.5 py-1 text-sm text-muted hover:border-primary hover:text-primary"
          >
            {label}
          </button>
        ))}
        {clearable && value && (
          <button
            type="button"
            onClick={() => onPick("")}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm text-muted hover:text-danger"
          >
            <X className="size-4" aria-hidden />
            ล้าง
          </button>
        )}
      </div>
    </div>
  );
}
