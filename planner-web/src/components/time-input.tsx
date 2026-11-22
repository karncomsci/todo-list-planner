"use client";

import { Clock } from "lucide-react";
import { dayPeriod, hours, joinTime, minutesFor, splitTime } from "@/lib/times";

type Props = {
  /** The hour list's id, which the field's label points to. */
  id: string;
  name: string;
  /** The field's label, for naming the minute list. */
  label: string;
  /** "HH:MM", or "" for no time. */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  errorId?: string;
};

const selectClass =
  "rounded-lg bg-transparent px-1.5 py-1 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

/**
 * A time picked from two lists, hour 00–23 and minute, so it is 24-hour
 * whatever the device's clock setting (D9). Each hour names its part of the
 * day, and the chosen time shows it beside the lists, so there is no AM/PM.
 */
export function TimeInput({ id, name, label, value, onChange, invalid, errorId }: Props) {
  const { hour, minute } = splitTime(value);
  const periodId = `${id}-period`;
  const describedBy = [errorId, value ? periodId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div
      className={`mt-1.5 flex items-center gap-1 rounded-xl border bg-bg px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25 ${
        invalid ? "border-danger" : "border-border"
      }`}
    >
      <Clock className="size-4 shrink-0 text-muted" aria-hidden />
      <select
        id={id}
        value={hour}
        onChange={(event) => onChange(joinTime(event.target.value, minute))}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={selectClass}
      >
        <option value="">ชั่วโมง</option>
        {hours.map((h) => (
          <option key={h} value={h}>
            {h} · {dayPeriod(h)}
          </option>
        ))}
      </select>
      <span aria-hidden className="text-muted">
        :
      </span>
      <select
        value={minute}
        onChange={(event) => onChange(joinTime(hour || "00", event.target.value))}
        aria-label={`${label} นาที`}
        aria-invalid={invalid}
        className={selectClass}
      >
        {!hour && <option value="">นาที</option>}
        {minutesFor(minute).map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <input type="hidden" name={name} value={value} />
      {value && (
        <span id={periodId} className="ml-auto rounded-lg bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
          {dayPeriod(value)}
        </span>
      )}
    </div>
  );
}
