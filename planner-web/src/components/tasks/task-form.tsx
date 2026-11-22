"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { TimeInput } from "@/components/time-input";
import { api, ApiError } from "@/lib/api/client";
import { errorText, fieldLabels } from "@/lib/api/messages";
import type {
  Priority,
  Task,
  TaskRequest,
  TaskResponse,
} from "@/lib/api/types";
import type { IsoDate } from "@/lib/dates";
import { CategorySelect } from "./category-select";
import {
  priorityDotClass,
  priorityLabels,
  statusLabels,
  statusPreview,
} from "@/lib/tasks";

type Values = {
  name: string;
  dueDate: IsoDate | "";
  startDate: IsoDate | "";
  startTime: string;
  endTime: string;
  priority: Priority;
  progress: number;
  note: string;
  categoryId: number | null;
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
  categoryId: null,
};

/** The form's values for a saved Task; absent optional fields become empty. */
function valuesOf(task: Task): Values {
  return {
    name: task.name,
    dueDate: task.dueDate,
    startDate: task.startDate ?? "",
    startTime: task.startTime ?? "",
    endTime: task.endTime ?? "",
    priority: task.priority,
    progress: task.progress,
    note: task.note,
    categoryId: task.category?.id ?? null,
  };
}

const priorities: Priority[] = ["high", "medium", "low"];

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 aria-invalid:border-danger";

type Props = {
  /** The saved Task to edit; without it the form adds a new Task. */
  task?: Task;
  onSaved: (task: Task) => void;
  /** Called after the edited Task is deleted. */
  onDeleted?: (task: Task) => void;
  /** Shows a cancel button that calls this. */
  onCancel?: () => void;
};

/**
 * Adds a Task, or edits every field of a saved one and deletes it after a
 * confirmation (stories 7 to 16, 18, 19; D25). Only the name and due date are required.
 */
export function TaskForm({ task, onSaved, onDeleted, onCancel }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Values>(() =>
    task ? valuesOf(task) : emptyValues,
  );
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Saving an edit asks first, naming the fields that changed.
  const [confirmingSave, setConfirmingSave] = useState(false);
  // The add form and an edit dialog can share a page, so element IDs are per form.
  const idPrefix = `task${useId()}`;

  function set<K extends Field>(field: K, value: Values[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    // An edited field drops its error; the next save checks it again.
    setErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  }

  function focusField(field: Field) {
    formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
  }

  const changedFields = task
    ? (Object.keys(values) as Field[]).filter((field) => values[field] !== valuesOf(task)[field])
    : [];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (task && !confirmingSave) {
      setConfirmingSave(true);
      return;
    }
    setConfirmingSave(false);
    setErrors({});
    setBusy(true);
    try {
      const request: TaskRequest = values;
      if (task) {
        const { task: saved } = await api<TaskResponse>(
          "PUT",
          `/tasks/${task.id}`,
          request,
        );
        toast.success("บันทึกการแก้ไขแล้ว", { description: saved.name });
        onSaved(saved);
      } else {
        const { task: saved } = await api<TaskResponse>(
          "POST",
          "/tasks",
          request,
        );
        toast.success("บันทึกงานแล้ว", { description: saved.name });
        setValues(emptyValues);
        onSaved(saved);
        focusField("name");
      }
    } catch (error) {
      const field =
        error instanceof ApiError
          ? (error.field as Field | undefined)
          : undefined;
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

  async function remove() {
    if (!task) return;
    setBusy(true);
    try {
      await api<void>("DELETE", `/tasks/${task.id}`);
      toast.success("ลบงานแล้ว", { description: task.name });
      onDeleted?.(task);
    } catch (error) {
      toast.error("ลบงานไม่สำเร็จ", { description: errorText(error) });
      setBusy(false);
    }
  }

  const invalid = (field: Field) => (errors[field] ? true : undefined);
  const describedBy = (field: Field) =>
    errors[field] ? `${idPrefix}-${field}-error` : undefined;

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-5"
    >
      <FieldShell
        id={`${idPrefix}-name`}
        label="ชื่องาน"
        required
        error={errors.name}
        errorId={describedBy("name")}
      >
        <input
          id={`${idPrefix}-name`}
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
          id={`${idPrefix}-dueDate`}
          label="วันครบกำหนด"
          required
          error={errors.dueDate}
          errorId={describedBy("dueDate")}
        >
          <DatePicker
            id={`${idPrefix}-dueDate`}
            name="dueDate"
            value={values.dueDate}
            onChange={(value) => set("dueDate", value)}
            invalid={invalid("dueDate")}
            errorId={describedBy("dueDate")}
          />
        </FieldShell>
        <FieldShell
          id={`${idPrefix}-startDate`}
          label="วันเริ่ม"
          hint="เว้นว่างได้ ถ้ามี งานจะแสดงเป็นช่วงบนปฏิทิน"
          error={errors.startDate}
          errorId={describedBy("startDate")}
        >
          <DatePicker
            id={`${idPrefix}-startDate`}
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
        <FieldShell
          id={`${idPrefix}-startTime`}
          label="เวลาเริ่ม"
          error={errors.startTime}
          errorId={describedBy("startTime")}
        >
          <TimeInput
            id={`${idPrefix}-startTime`}
            name="startTime"
            label="เวลาเริ่ม"
            value={values.startTime}
            onChange={(value) => set("startTime", value)}
            invalid={invalid("startTime")}
            errorId={describedBy("startTime")}
          />
        </FieldShell>
        <FieldShell
          id={`${idPrefix}-endTime`}
          label="เวลาสิ้นสุด"
          hint="ใส่ทั้งสองช่อง หรือเว้นว่างทั้งคู่"
          error={errors.endTime}
          errorId={describedBy("endTime")}
        >
          <TimeInput
            id={`${idPrefix}-endTime`}
            name="endTime"
            label="เวลาสิ้นสุด"
            value={values.endTime}
            onChange={(value) => set("endTime", value)}
            invalid={invalid("endTime")}
            errorId={describedBy("endTime")}
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
              <span
                className={`size-2.5 rounded-full ${priorityDotClass[priority]}`}
                aria-hidden
              />
              {priorityLabels[priority]}
            </label>
          ))}
        </div>
        {errors.priority && (
          <p
            id={`${idPrefix}-priority-error`}
            className="mt-1.5 text-sm text-danger"
          >
            {errors.priority}
          </p>
        )}
      </fieldset>

      <FieldShell
        id={`${idPrefix}-categoryId`}
        label="หมวดหมู่"
        error={errors.categoryId}
        errorId={describedBy("categoryId")}
      >
        <CategorySelect
          id={`${idPrefix}-categoryId`}
          value={values.categoryId}
          onChange={(value) => set("categoryId", value)}
          invalid={invalid("categoryId")}
          errorId={describedBy("categoryId")}
          className={inputClass}
        />
      </FieldShell>

      <FieldShell
        id={`${idPrefix}-progress`}
        label="ความคืบหน้า"
        error={errors.progress}
        errorId={describedBy("progress")}
      >
        <div className="mt-1.5 flex items-center gap-3">
          <input
            id={`${idPrefix}-progress`}
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
          <span className="w-12 text-right tabular-nums">
            {values.progress}%
          </span>
          <span className="w-20 rounded-full bg-primary-soft px-2 py-0.5 text-center text-xs text-primary">
            {statusLabels[statusPreview(values.progress)]}
          </span>
        </div>
      </FieldShell>

      <FieldShell
        id={`${idPrefix}-note`}
        label="โน้ต"
        error={errors.note}
        errorId={describedBy("note")}
      >
        <textarea
          id={`${idPrefix}-note`}
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

      {confirmingSave ? (
        <div
          role="alertdialog"
          aria-labelledby={`${idPrefix}-save-title`}
          aria-describedby={`${idPrefix}-save-changes`}
          className="rounded-xl border border-primary/40 bg-primary-soft/50 p-4"
        >
          <p id={`${idPrefix}-save-title`} className="font-medium">
            บันทึกการแก้ไขงาน “{task?.name}”?
          </p>
          <p id={`${idPrefix}-save-changes`} className="mt-1 text-sm text-muted">
            {changedFields.length > 0
              ? `สิ่งที่เปลี่ยน: ${changedFields.map((field) => fieldLabels[field]).join(", ")}`
              : "ยังไม่มีอะไรเปลี่ยน"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              autoFocus
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-60"
            >
              {busy && (
                <LoaderCircle
                  className="size-4 animate-spin motion-reduce:animate-none"
                  aria-hidden
                />
              )}
              ยืนยันบันทึก
            </button>
            <button
              type="button"
              onClick={() => setConfirmingSave(false)}
              disabled={busy}
              className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-primary-soft hover:text-primary"
            >
              กลับไปแก้ต่อ
            </button>
          </div>
        </div>
      ) : confirmingDelete ? (
        <div
          role="alertdialog"
          aria-labelledby={`${idPrefix}-delete-title`}
          className="rounded-xl border border-danger/40 bg-danger/5 p-4"
        >
          <p
            id={`${idPrefix}-delete-title`}
            className="font-medium text-danger"
          >
            ลบงาน “{task?.name}” ถาวร?
          </p>
          <p className="mt-1 text-sm text-muted">ลบแล้วกู้คืนไม่ได้</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy && (
                <LoaderCircle
                  className="size-4 animate-spin motion-reduce:animate-none"
                  aria-hidden
                />
              )}
              ลบถาวร
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={busy}
              autoFocus
              className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-primary-soft hover:text-primary"
            >
              ไม่ลบ
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-fg hover:opacity-90 disabled:opacity-60"
          >
            {busy && (
              <LoaderCircle
                className="size-4 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            )}
            {task ? "บันทึกการแก้ไข" : "บันทึกงาน"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2.5 text-muted hover:bg-primary-soft hover:text-primary"
            >
              ยกเลิก
            </button>
          )}
          {task && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
              className="ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-danger hover:bg-danger/10 disabled:opacity-60"
            >
              <Trash2 className="size-4" aria-hidden />
              ลบงาน
            </button>
          )}
        </div>
      )}
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
function FieldShell({
  id,
  label,
  required,
  hint,
  error,
  errorId,
  children,
}: FieldShellProps) {
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
