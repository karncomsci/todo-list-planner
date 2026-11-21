"use client";

import { LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { api, ApiError } from "@/lib/api/client";
import { errorText } from "@/lib/api/messages";
import type { CreateTaskRequest, Priority, Task, TaskResponse } from "@/lib/api/types";
import type { IsoDate } from "@/lib/dates";
import { priorityDotClass, priorityLabels, statusLabels, statusPreview } from "@/lib/tasks";

type Values = {
  name: string;
  dueDate: IsoDate | "";
  startDate: IsoDate | "";
  startTime: string;
  endTime: string;
  priority: Priority;
  progress: number;
  note: string;
};

type Field = keyof Values;

const emptyValues: Values = {
  name: "",
  dueDate: "",
  startDate: "",
  startTime: "",
  endTime: "",
  priority: "medium",
  progress: 0,
  note: "",
};

const priorities: Priority[] = ["high", "medium", "low"];

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 aria-invalid:border-danger";

/** Adds a Task. Only the name and due date are required (stories 7 to 14, 18, 19). */
export function TaskForm({ onSaved }: { onSaved: (task: Task) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Values>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);

  function set<K extends Field>(field: K, value: Values[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    // An edited field drops its error; the next save checks it again.
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function focusField(field: Field) {
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      const request: CreateTaskRequest = values;
      const { task } = await api<TaskResponse>("POST", "/tasks", request);
      toast.success("บันทึกงานแล้ว", { description: task.name });
      setValues(emptyValues);
      onSaved(task);
      focusField("name");
    } catch (error) {
      const field = error instanceof ApiError ? (error.field as Field | undefined) : undefined;
      if (field && field in emptyValues) {
        setErrors({ [field]: errorText(error) });
        focusField(field);
      } else {
        toast.error("บันทึกงานไม่สำเร็จ", { description: errorText(error) });
      }
    } finally {
      setBusy(false);
    }
  }

  const invalid = (field: Field) => (errors[field] ? true : undefined);
  const describedBy = (field: Field) => (errors[field] ? `task-${field}-error` : undefined);

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-5">
      <FieldShell id="task-name" label="ชื่องาน" required error={errors.name} errorId={describedBy("name")}>
        <input
          id="task-name"
          name="name"
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
          maxLength={200}
          autoFocus
          autoComplete="off"
          placeholder="เช่น ส่งรายงานประจำเดือน"
          aria-invalid={invalid("name")}
          aria-describedby={describedBy("name")}
          className={inputClass}
        />
      </FieldShell>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldShell
          id="task-dueDate"
          label="วันครบกำหนด"
          required
          error={errors.dueDate}
          errorId={describedBy("dueDate")}
        >
          <DatePicker
            id="task-dueDate"
            name="dueDate"
            value={values.dueDate}
            onChange={(value) => set("dueDate", value)}
            invalid={invalid("dueDate")}
            errorId={describedBy("dueDate")}
          />
        </FieldShell>
        <FieldShell
          id="task-startDate"
          label="วันเริ่ม"
          hint="เว้นว่างได้ ถ้ามี งานจะแสดงเป็นช่วงบนปฏิทิน"
          error={errors.startDate}
          errorId={describedBy("startDate")}
        >
          <DatePicker
            id="task-startDate"
            name="startDate"
            value={values.startDate}
            onChange={(value) => set("startDate", value)}
            invalid={invalid("startDate")}
            errorId={describedBy("startDate")}
            clearable
          />
        </FieldShell>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldShell id="task-startTime" label="เวลาเริ่ม" error={errors.startTime} errorId={describedBy("startTime")}>
          <input
            id="task-startTime"
            name="startTime"
            type="time"
            value={values.startTime}
            onChange={(event) => set("startTime", event.target.value)}
            aria-invalid={invalid("startTime")}
            aria-describedby={describedBy("startTime")}
            className={inputClass}
          />
        </FieldShell>
        <FieldShell
          id="task-endTime"
          label="เวลาสิ้นสุด"
          hint="ใส่ทั้งสองช่อง หรือเว้นว่างทั้งคู่"
          error={errors.endTime}
          errorId={describedBy("endTime")}
        >
          <input
            id="task-endTime"
            name="endTime"
            type="time"
            value={values.endTime}
            onChange={(event) => set("endTime", event.target.value)}
            aria-invalid={invalid("endTime")}
            aria-describedby={describedBy("endTime")}
            className={inputClass}
          />
        </FieldShell>
      </div>

      <fieldset aria-describedby={describedBy("priority")}>
        <legend className="text-sm font-medium">ความสำคัญ</legend>
        <div className="mt-1.5 inline-flex rounded-xl border border-border bg-bg p-1">
          {priorities.map((priority) => (
            <label
              key={priority}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm has-checked:bg-surface has-checked:font-medium has-checked:shadow-sm has-focus-visible:ring-2 has-focus-visible:ring-primary/40"
            >
              <input
                type="radio"
                name="priority"
                value={priority}
                checked={values.priority === priority}
                onChange={() => set("priority", priority)}
                className="sr-only"
              />
              <span className={`size-2.5 rounded-full ${priorityDotClass[priority]}`} aria-hidden />
              {priorityLabels[priority]}
            </label>
          ))}
        </div>
        {errors.priority && (
          <p id="task-priority-error" className="mt-1.5 text-sm text-danger">
            {errors.priority}
          </p>
        )}
      </fieldset>

      <FieldShell id="task-progress" label="ความคืบหน้า" error={errors.progress} errorId={describedBy("progress")}>
        <div className="mt-1.5 flex items-center gap-3">
          <input
            id="task-progress"
            name="progress"
            type="range"
            min={0}
            max={100}
            step={5}
            value={values.progress}
            onChange={(event) => set("progress", Number(event.target.value))}
            aria-valuetext={`${values.progress}% ${statusLabels[statusPreview(values.progress)]}`}
            aria-describedby={describedBy("progress")}
            className="h-2 flex-1 cursor-pointer accent-primary"
          />
          <span className="w-12 text-right tabular-nums">{values.progress}%</span>
          <span className="w-20 rounded-full bg-primary-soft px-2 py-0.5 text-center text-xs text-primary">
            {statusLabels[statusPreview(values.progress)]}
          </span>
        </div>
      </FieldShell>

      <FieldShell id="task-note" label="โน้ต" error={errors.note} errorId={describedBy("note")}>
        <textarea
          id="task-note"
          name="note"
          value={values.note}
          onChange={(event) => set("note", event.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="รายละเอียด หรือสิ่งที่ไม่อยากลืม"
          aria-invalid={invalid("note")}
          aria-describedby={describedBy("note")}
          className={`${inputClass} resize-y`}
        />
      </FieldShell>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-fg hover:opacity-90 disabled:opacity-60"
      >
        {busy && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
        บันทึกงาน
      </button>
    </form>
  );
}

type FieldShellProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
};

/** Label, control, hint and error message of one form field. */
function FieldShell({ id, label, required, hint, error, errorId, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}
