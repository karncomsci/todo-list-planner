// Turning Tasks into calendar events (T3). Kept free of FullCalendar imports so
// it stays pure; the shape matches FullCalendar's EventInput.
import type { Task } from "@/lib/api/types";
import {
  addDays,
  addMonths,
  formatThaiDate,
  formatThaiDateRange,
  type IsoDate,
  startOfMonth,
  weekdayFromMonday,
} from "@/lib/dates";

export type TaskEvent = {
  id: string;
  title: string;
  /** "YYYY-MM-DD" for an all-day event, "YYYY-MM-DDTHH:MM" for a timed one. */
  start: string;
  /** Exclusive: for an all-day event, the day after the last day. */
  end: string;
  allDay: boolean;
  /** Colour and strike-through come from these classes, defined in globals.css. */
  classNames: string[];
  extendedProps: { task: Task };
};

/**
 * One Task as one calendar event (stories 24 to 29).
 * - A Task with a start date runs from it to its due date as one bar; without
 *   one it sits on its due date only.
 * - A timed Task starts at its start time on its first day and ends at its end
 *   time on its due date (A1); a Task without a time is all-day.
 * - Priority sets the colour (A3); Overdue overrides it with red and the Task
 *   stays on its due date; a done Task is struck through.
 */
export function taskToEvent(task: Task): TaskEvent {
  const firstDay: IsoDate = task.startDate ?? task.dueDate;
  const timed = task.startTime !== null && task.endTime !== null;

  const classNames = ["task-event", task.isOverdue ? "task-overdue" : `task-priority-${task.priority}`];
  if (task.status === "done") classNames.push("task-done");

  return {
    id: String(task.id),
    title: task.name,
    start: timed ? `${firstDay}T${task.startTime}` : firstDay,
    end: timed ? `${task.dueDate}T${task.endTime}` : addDays(task.dueDate, 1),
    allDay: !timed,
    classNames,
    extendedProps: { task },
  };
}

/** The inclusive date range to ask the API for, from a calendar's exclusive end. */
export function rangeOf(start: IsoDate, endExclusive: IsoDate): { from: IsoDate; to: IsoDate } {
  return { from: start, to: addDays(endExclusive, -1) };
}

/** The computer Calendar's Views (D6, stories 20, 21). */
export type CalendarViewKind = "day" | "week" | "month" | "year";

/**
 * The title over a View with BE years (D9), from the View's first day and its
 * exclusive end: the full date for the day View, the week's days for the week
 * View, the month for the month View, the year for the year View.
 */
export function viewTitle(kind: CalendarViewKind, start: IsoDate, endExclusive: IsoDate): string {
  if (kind === "day") return formatThaiDate(start, "weekday");
  if (kind === "month") return formatThaiDate(start, "monthYear");
  if (kind === "year") return formatThaiDate(start, "year");
  return formatThaiDateRange(start, addDays(endExclusive, -1));
}

/**
 * The title over one month of the year View, with a BE year (D9). FullCalendar
 * would print a CE year, so it passes the CE year and the month counted from 0.
 */
export function monthTitle(year: number, monthIndex: number): string {
  return formatThaiDate(`${year}-${String(monthIndex + 1).padStart(2, "0")}-01`, "monthYear");
}

// The phone's compact calendar (D10, story 34).

/** The weeks shown for a month, Monday to Sunday, including days of the months around it. */
export function monthGrid(month: IsoDate): IsoDate[][] {
  const first = startOfMonth(month);
  const last = addDays(addMonths(first, 1), -1);
  let day = addDays(first, -weekdayFromMonday(first));
  const end = addDays(last, 6 - weekdayFromMonday(last));
  const weeks: IsoDate[][] = [];
  while (day <= end) {
    const week: IsoDate[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** The Tasks whose span covers the day: from start date (or due date) to due date. */
export function tasksOnDay(tasks: Task[], day: IsoDate): Task[] {
  return tasks.filter((task) => (task.startDate ?? task.dueDate) <= day && day <= task.dueDate);
}

export type DotKind = "overdue" | "high" | "medium" | "low" | "done";

/**
 * Dots for one day: one per kind present, at most three, most urgent first.
 * Overdue is red over its Priority (story 28); done Tasks get a faded dot.
 */
export function dayDots(tasks: Task[], day: IsoDate): DotKind[] {
  const present = new Set<DotKind>(
    tasksOnDay(tasks, day).map((task) => (task.status === "done" ? "done" : task.isOverdue ? "overdue" : task.priority)),
  );
  const order: DotKind[] = ["overdue", "high", "medium", "low", "done"];
  return order.filter((kind) => present.has(kind)).slice(0, 3);
}
