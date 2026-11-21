"use client";

import { Check } from "lucide-react";
import { DoneMark } from "@/components/tasks/done-mark";
import type { Priority, Task } from "@/lib/api/types";
import { formatThaiDate } from "@/lib/dates";
import { priorityDotClass, priorityLabels, statusLabels, timeRange } from "@/lib/tasks";

const tickBorderClass: Record<Priority, string> = {
  high: "border-priority-high",
  medium: "border-priority-medium",
  low: "border-priority-low",
};

type Props = {
  task: Task;
  onTick: (task: Task) => void;
  onOpen: (task: Task) => void;
  /** Name the due date of a one-day Task too, for lists not tied to one day. */
  showDueDate?: boolean;
};

/**
 * One Task in a list: a tick circle in its colour, then the Task, which opens the
 * form (stories 30, 31, 35). Used by the phone Calendar's day list and the Overview.
 */
export function TaskRow({ task, onTick, onOpen, showDueDate = false }: Props) {
  const done = task.status === "done";
  const colour = task.isOverdue ? "bg-danger" : priorityDotClass[task.priority];
  const times = timeRange(task.startTime, task.endTime);
  const span =
    task.startDate && task.startDate !== task.dueDate
      ? `${formatThaiDate(task.startDate, "short")} – ${formatThaiDate(task.dueDate, "short")}`
      : showDueDate
        ? `ครบกำหนด ${formatThaiDate(task.dueDate, "short")}`
        : "";

  return (
    <li className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
      {done ? (
        <DoneMark
          taskId={task.id}
          className={`flex size-7 shrink-0 items-center justify-center rounded-full ${colour} text-surface`}
          title="เสร็จแล้ว ลดความคืบหน้าในฟอร์มเพื่อยกเลิก"
        >
          <Check className="size-4" strokeWidth={3} aria-label="เสร็จแล้ว" />
        </DoneMark>
      ) : (
        // A 44px touch target around a 28px circle.
        <button
          type="button"
          onClick={() => onTick(task)}
          aria-label={`ทำเครื่องหมายว่าเสร็จ: ${task.name}`}
          className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
        >
          <span
            className={`size-7 rounded-full border-2 ${
              task.isOverdue ? "border-danger" : tickBorderClass[task.priority]
            } bg-surface`}
          />
        </button>
      )}
      <button
        type="button"
        onClick={() => onOpen(task)}
        aria-label={`แก้ไขงาน ${task.name}`}
        className="min-w-0 flex-1 rounded-xl px-1 py-1 text-left hover:bg-bg focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
      >
        <p className={`truncate ${done ? "text-muted line-through" : ""}`}>{task.name}</p>
        <p className={`truncate text-sm ${task.isOverdue ? "text-danger" : "text-muted"}`}>
          {[times, span, task.isOverdue ? "เลยกำหนด" : statusLabels[task.status], `ความสำคัญ${priorityLabels[task.priority]}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </button>
    </li>
  );
}
