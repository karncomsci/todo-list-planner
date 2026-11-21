import type { Task } from "@/lib/api/types";
import { formatThaiDate } from "@/lib/dates";
import {
  priorityDotClass,
  priorityLabels,
  statusLabels,
  timeRange,
} from "@/lib/tasks";

type Props = {
  /** undefined while loading. */
  tasks: Task[] | undefined;
  failed: boolean;
  /** Opens a Task for editing. */
  onOpen: (task: Task) => void;
};

/**
 * The most recently changed Tasks, so the Owner sees what was just saved (story 17).
 * Each one opens for editing (story 15).
 */
export function RecentTasks({ tasks, failed, onOpen }: Props) {
  if (failed) {
    return <p className="text-sm text-danger">โหลดรายการงานไม่สำเร็จ</p>;
  }
  if (!tasks) {
    return <p className="text-sm text-muted">กำลังโหลด…</p>;
  }
  if (tasks.length === 0) {
    return <p className="text-sm text-muted">ยังไม่มีงาน เพิ่มงานแรกได้จากฟอร์ม</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {tasks.map((task) => (
        <li key={task.id} className="py-1.5 first:pt-0 last:pb-0">
          <button
            type="button"
            onClick={() => onOpen(task)}
            aria-label={`แก้ไขงาน ${task.name}`}
            className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-primary-soft/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
          >
            <span
              className={`mt-2 size-2.5 shrink-0 rounded-full ${priorityDotClass[task.priority]}`}
              title={`ความสำคัญ${priorityLabels[task.priority]}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p
                className={`truncate ${task.status === "done" ? "text-muted line-through" : ""}`}
              >
                {task.name}
              </p>
              <p
                className={`text-sm ${task.isOverdue ? "text-danger" : "text-muted"}`}
              >
                {task.startDate && task.startDate !== task.dueDate
                  ? `${formatThaiDate(task.startDate, "short")} – ${formatThaiDate(task.dueDate, "short")}`
                  : `ครบกำหนด ${formatThaiDate(task.dueDate, "short")}`}
                {timeRange(task.startTime, task.endTime) &&
                  ` · ${timeRange(task.startTime, task.endTime)}`}
                {task.category && ` · ${task.category.name}`}
              </p>
            </div>
            {task.isOverdue ? (
              <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">
                เลยกำหนด
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">
                {statusLabels[task.status]}
                {task.status === "in_progress" && ` ${task.progress}%`}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
