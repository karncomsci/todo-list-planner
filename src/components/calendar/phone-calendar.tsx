"use client";

import { Check, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { TaskEditDialog } from "@/components/tasks/task-edit-dialog";
import { DoneMark } from "@/components/tasks/done-mark";
import { tickDone } from "@/components/tasks/tick-done";
import { api } from "@/lib/api/client";
import type { Priority, Task, TaskListResponse } from "@/lib/api/types";
import { dayDots, type DotKind, monthGrid, tasksOnDay } from "@/lib/calendar";
import { addMonths, formatThaiDate, type IsoDate, startOfMonth, todayIso } from "@/lib/dates";
import { priorityDotClass, priorityLabels, statusLabels, timeRange } from "@/lib/tasks";

const weekdays = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

const dotClass: Record<DotKind, string> = {
  overdue: "bg-danger",
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
  done: "bg-muted/50",
};

const tickBorderClass: Record<Priority, string> = {
  high: "border-priority-high",
  medium: "border-priority-medium",
  low: "border-priority-low",
};

/**
 * The phone Calendar (D10, stories 34, 35): a compact month with coloured dots
 * for days with Tasks, and under it the selected day's Tasks to tick or open.
 */
export default function PhoneCalendar() {
  const [today] = useState(todayIso);
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selected, setSelected] = useState<IsoDate>(today);
  const [tasks, setTasks] = useState<Task[]>();
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const weeks = monthGrid(month);
  const from = weeks[0][0];
  const to = weeks[weeks.length - 1][6];

  // Bumped to load the same days again after a Task changes.
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  // The Tasks of every day on screen, including those of the months around it.
  // An answer for a month already left behind is dropped.
  useEffect(() => {
    let current = true;
    api<TaskListResponse>("GET", `/tasks?from=${from}&to=${to}`)
      .then(({ tasks }) => {
        if (!current) return;
        setTasks(tasks);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [from, to, version]);

  // Moving to another month selects today if it is in that month, else the 1st.
  function showMonth(next: IsoDate) {
    setMonth(next);
    setSelected(startOfMonth(today) === next ? today : next);
    setTasks(undefined);
  }

  async function tick(task: Task) {
    if (await tickDone(task)) reload();
  }

  const dayTasks = tasks ? tasksOnDay(tasks, selected) : [];

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-border bg-surface p-3">
        <div className="mb-2 flex items-center gap-1">
          <h2 className="flex-1 px-1 text-lg font-semibold" aria-live="polite">
            {formatThaiDate(month, "monthYear")}
          </h2>
          {!tasks && !failed && (
            <LoaderCircle className="size-4 animate-spin text-muted motion-reduce:animate-none" aria-label="กำลังโหลด" />
          )}
          <button
            type="button"
            onClick={() => showMonth(addMonths(month, -1))}
            aria-label="เดือนก่อนหน้า"
            className="rounded-xl p-2 hover:bg-primary-soft hover:text-primary"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => showMonth(startOfMonth(today))}
            className="rounded-xl border border-border px-3 py-1.5 text-sm font-medium hover:bg-primary-soft hover:text-primary"
          >
            วันนี้
          </button>
          <button
            type="button"
            onClick={() => showMonth(addMonths(month, 1))}
            aria-label="เดือนถัดไป"
            className="rounded-xl p-2 hover:bg-primary-soft hover:text-primary"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        {/* Each day button names its full date, so the weekday row is visual only. */}
        <div className="grid grid-cols-7 text-center" aria-hidden>
          {weekdays.map((day) => (
            <div key={day} className="py-1 text-xs text-muted">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 text-center" role="group" aria-label="เลือกวัน">
          {weeks.map((week) => (
            <div key={week[0]} className="contents">
              {week.map((day) => {
                const dots = tasks ? dayDots(tasks, day) : [];
                const isToday = day === today;
                const isSelected = day === selected;
                const inMonth = day.slice(0, 7) === month.slice(0, 7);
                const count = tasks ? tasksOnDay(tasks, day).length : 0;
                return (
                  <div key={day}>
                    <button
                      type="button"
                      onClick={() => setSelected(day)}
                      aria-label={`${formatThaiDate(day, "weekday")}${isToday ? " วันนี้" : ""}${count ? ` มีงาน ${count} รายการ` : ""}`}
                      aria-pressed={isSelected}
                      className={`flex h-12 w-full flex-col items-center justify-start gap-1 rounded-xl pt-1.5 ${
                        isSelected ? "bg-primary-soft" : "hover:bg-bg"
                      } focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none`}
                    >
                      <span
                        className={`flex size-6 items-center justify-center rounded-full text-sm tabular-nums ${
                          isToday ? "bg-primary font-semibold text-primary-fg" : inMonth ? "" : "text-muted/60"
                        }`}
                      >
                        {Number(day.slice(8))}
                      </span>
                      <span className="flex h-1.5 gap-0.5" aria-hidden>
                        {dots.map((kind) => (
                          <span key={kind} className={`size-1.5 rounded-full ${dotClass[kind]}`} />
                        ))}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4" aria-labelledby="phone-day-title">
        <h2 id="phone-day-title" className="mb-3 font-semibold">
          {formatThaiDate(selected, "weekday")}
        </h2>
        {failed ? (
          <p className="text-sm text-danger">โหลดงานไม่สำเร็จ</p>
        ) : !tasks ? (
          <p className="text-sm text-muted">กำลังโหลด…</p>
        ) : dayTasks.length === 0 ? (
          <p className="text-sm text-muted">ไม่มีงานในวันนี้</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {dayTasks.map((task) => (
              <DayTask key={task.id} task={task} onTick={tick} onOpen={setEditing} />
            ))}
          </ul>
        )}
      </section>

      <TaskEditDialog task={editing} onClose={() => setEditing(null)} onSaved={reload} onDeleted={reload} />
    </div>
  );
}

type DayTaskProps = {
  task: Task;
  onTick: (task: Task) => void;
  onOpen: (task: Task) => void;
};

/** One Task in the day's list: a tick circle in its colour, then the Task, which opens the form. */
function DayTask({ task, onTick, onOpen }: DayTaskProps) {
  const done = task.status === "done";
  const colour = task.isOverdue ? "bg-danger" : priorityDotClass[task.priority];
  const times = timeRange(task.startTime, task.endTime);
  const span =
    task.startDate && task.startDate !== task.dueDate
      ? `${formatThaiDate(task.startDate, "short")} – ${formatThaiDate(task.dueDate, "short")}`
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
