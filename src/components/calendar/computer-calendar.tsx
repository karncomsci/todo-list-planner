"use client";

import type {
  CalendarOptions,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventSourceFuncArg,
} from "@fullcalendar/core";
import thLocale from "@fullcalendar/core/locales/th";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import multiMonthPlugin from "@fullcalendar/multimonth";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Check, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TaskEditDialog } from "@/components/tasks/task-edit-dialog";
import { DoneMark } from "@/components/tasks/done-mark";
import { tickDone } from "@/components/tasks/tick-done";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { errorText } from "@/lib/api/messages";
import type { Task, TaskListResponse } from "@/lib/api/types";
import { type CalendarViewKind, monthTitle, rangeOf, taskToEvent, type TaskEvent, viewTitle } from "@/lib/calendar";
import { localDateToIso, todayIso } from "@/lib/dates";

/** Each View: its FullCalendar name, its switcher label, and the unit its arrows move by. */
const views: Record<CalendarViewKind, { name: string; label: string; unit: string }> = {
  day: { name: "timeGridDay", label: "วัน", unit: "วัน" },
  week: { name: "timeGridWeek", label: "สัปดาห์", unit: "สัปดาห์" },
  month: { name: "dayGridMonth", label: "เดือน", unit: "เดือน" },
  year: { name: "multiMonthYear", label: "ปี", unit: "ปี" },
};
const viewOrder: CalendarViewKind[] = ["day", "week", "month", "year"];

/**
 * Options for some Views only. Kept outside the component: a new function on each
 * render would look like changed options to FullCalendar and make it fetch again.
 * - Weekday and day of month over each hourly column; the month and year are in the title.
 * - Each month of the year View is titled with its BE year (D9). The year View shows
 *   only its own year's days, so its range stays within the API's limit.
 */
const viewOptions = {
  timeGrid: { dayHeaderFormat: { weekday: "short", day: "numeric" } },
  multiMonthYear: {
    multiMonthTitleFormat: ({ date }: { date: { year: number; month: number } }) => monthTitle(date.year, date.month),
    dayMaxEvents: 2,
  },
} satisfies CalendarOptions["views"];

function kindOf(viewName: string): CalendarViewKind {
  return viewOrder.find((kind) => views[kind].name === viewName) ?? "month";
}

/**
 * Each move of the View asks the API for exactly the days on screen. Defined
 * outside the component: a new function on each render would make FullCalendar
 * fetch again, and the loading state it sets would render again, without end.
 */
async function loadEvents(info: EventSourceFuncArg): Promise<TaskEvent[]> {
  const { from, to } = rangeOf(localDateToIso(info.start), localDateToIso(info.end));
  try {
    const { tasks } = await api<TaskListResponse>("GET", `/tasks?from=${from}&to=${to}`);
    return tasks.map(taskToEvent);
  } catch (error) {
    toast.error("โหลดงานไม่สำเร็จ", { description: errorText(error) });
    throw error;
  }
}

/**
 * The Calendar on computers (stories 20 to 33): day, week, month and year Views, FullCalendar
 * standard bundle (D6). The header is our own so the title shows BE years (D9).
 * It opens on the month View every time; the chosen View is not remembered.
 * Clicking a Task edits it over the Calendar; its circle ticks it done.
 */
export default function ComputerCalendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [kind, setKind] = useState<CalendarViewKind>("month");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  function datesSet(arg: DatesSetArg) {
    const current = kindOf(arg.view.type);
    setKind(current);
    setTitle(viewTitle(current, localDateToIso(arg.view.currentStart), localDateToIso(arg.view.currentEnd)));
  }

  const calendar = () => calendarRef.current?.getApi();
  const refresh = () => calendar()?.refetchEvents();

  // The switcher sets the kind; the View changes after the render that gives the
  // Calendar the new View's height, so the hourly Views open scrolled to scrollTime.
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    // Changing to the View already shown would fetch its Tasks again.
    if (api && api.view.type !== views[kind].name) api.changeView(views[kind].name);
  }, [kind]);

  async function tick(task: Task) {
    if (await tickDone(task)) refresh();
  }

  function eventContent(arg: EventContentArg) {
    const task = arg.event.extendedProps.task as Task;
    const done = task.status === "done";
    return (
      <div className="task-event-content">
        {done ? (
          <DoneMark taskId={task.id} className="task-tick task-tick-done" title="เสร็จแล้ว ลดความคืบหน้าในฟอร์มเพื่อยกเลิก">
            <Check className="size-2.5" strokeWidth={3.5} aria-hidden />
          </DoneMark>
        ) : (
          <button
            type="button"
            className="task-tick"
            aria-label={`ทำเครื่องหมายว่าเสร็จ: ${task.name}`}
            title="ทำเครื่องหมายว่าเสร็จ"
            onClick={(event) => {
              // The tick is inside the Task, whose own click opens the form.
              event.stopPropagation();
              void tick(task);
            }}
            onKeyDown={(event) => event.stopPropagation()}
          />
        )}
        {arg.timeText && <span className="fc-event-time">{arg.timeText}</span>}
        <span className="fc-event-title">{arg.event.title}</span>
      </div>
    );
  }

  function eventClick(arg: EventClickArg) {
    arg.jsEvent.preventDefault();
    setEditing(arg.event.extendedProps.task as Task);
  }

  const unit = views[kind].unit;
  const navButton = "rounded-xl border border-border p-2 hover:bg-primary-soft hover:text-primary";

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="min-w-44 text-xl font-semibold" aria-live="polite">
          {title}
        </h2>
        {loading && (
          <LoaderCircle className="size-4 animate-spin text-muted motion-reduce:animate-none" aria-label="กำลังโหลด" />
        )}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div role="group" aria-label="มุมมอง" className="flex rounded-xl border border-border p-0.5">
            {viewOrder.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={kind === option}
                onClick={() => setKind(option)}
                className="rounded-[0.625rem] px-3 py-1.5 text-sm font-medium text-muted hover:text-primary aria-pressed:bg-primary aria-pressed:text-primary-fg"
              >
                {views[option].label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => calendar()?.prev()} aria-label={`${unit}ก่อนหน้า`} className={navButton}>
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => calendar()?.today()}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-primary-soft hover:text-primary"
            >
              วันนี้
            </button>
            <button type="button" onClick={() => calendar()?.next()} aria-label={`${unit}ถัดไป`} className={navButton}>
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin]}
        initialView={views.month.name}
        locale={thLocale}
        // Today is Thailand's date whatever the device's time zone (D9).
        now={() => todayIso()}
        firstDay={1}
        headerToolbar={false}
        // The month and year grow to fit; the hourly day and week scroll inside a fixed height.
        height={kind === "month" || kind === "year" ? "auto" : "44rem"}
        fixedWeekCount={false}
        dayMaxEvents={3}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        displayEventEnd={false}
        // Tasks without a time sit in the top row of the hourly Views (story 26).
        allDayText="ทั้งวัน"
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        scrollTime="07:00:00"
        // Weekday and day of month over each hourly column; the month and year are in the title.
        views={viewOptions}
        events={loadEvents}
        datesSet={datesSet}
        loading={setLoading}
        // Tasks are focusable and open with Enter, like buttons.
        eventInteractive
        eventClick={eventClick}
        eventContent={eventContent}
      />
      <TaskEditDialog task={editing} onClose={() => setEditing(null)} onSaved={refresh} onDeleted={refresh} />
    </section>
  );
}
