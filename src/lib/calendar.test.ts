import { describe, expect, it } from "vitest";
import type { Task } from "@/lib/api/types";
import { dayDots, monthGrid, monthTitle, rangeOf, taskToEvent, tasksOnDay, viewTitle } from "./calendar";

function task(fields: Partial<Task>): Task {
  return {
    id: 7,
    name: "ส่งรายงาน",
    dueDate: "2026-11-25",
    startDate: null,
    startTime: null,
    endTime: null,
    priority: "medium",
    progress: 0,
    status: "not_started",
    isOverdue: false,
    note: "",
    category: null,
    completedAt: null,
    createdAt: "2026-11-21T05:00:00Z",
    updatedAt: "2026-11-21T05:00:00Z",
    ...fields,
  };
}

describe("taskToEvent", () => {
  it("puts a Task without a start date or time on its due date only, all day", () => {
    expect(taskToEvent(task({}))).toMatchObject({
      id: "7",
      title: "ส่งรายงาน",
      start: "2026-11-25",
      end: "2026-11-26",
      allDay: true,
    });
  });

  it("draws a Task with a start date as one bar to its due date, end exclusive", () => {
    expect(taskToEvent(task({ startDate: "2026-11-20" }))).toMatchObject({
      start: "2026-11-20",
      end: "2026-11-26",
      allDay: true,
    });
  });

  it("crosses a month end correctly", () => {
    expect(taskToEvent(task({ startDate: "2026-11-29", dueDate: "2026-11-30" })).end).toBe("2026-12-01");
  });

  it("gives a timed one-day Task its times", () => {
    expect(taskToEvent(task({ startTime: "09:00", endTime: "10:30" }))).toMatchObject({
      start: "2026-11-25T09:00",
      end: "2026-11-25T10:30",
      allDay: false,
    });
  });

  it("starts a timed multi-day Task on its start date and ends it on its due date (A1)", () => {
    expect(taskToEvent(task({ startDate: "2026-11-23", startTime: "13:00", endTime: "08:30" }))).toMatchObject({
      start: "2026-11-23T13:00",
      end: "2026-11-25T08:30",
      allDay: false,
    });
  });

  it("colours by Priority (A3)", () => {
    expect(taskToEvent(task({ priority: "high" })).classNames).toEqual(["task-event", "task-priority-high"]);
    expect(taskToEvent(task({ priority: "low" })).classNames).toEqual(["task-event", "task-priority-low"]);
  });

  it("shows an Overdue Task in red on its original due date", () => {
    const event = taskToEvent(task({ priority: "high", isOverdue: true }));
    expect(event.classNames).toEqual(["task-event", "task-overdue"]);
    expect(event.start).toBe("2026-11-25");
  });

  it("strikes through a done Task", () => {
    expect(taskToEvent(task({ progress: 100, status: "done" })).classNames).toContain("task-done");
  });

  it("keeps the Task for click handling", () => {
    const original = task({});
    expect(taskToEvent(original).extendedProps.task).toBe(original);
  });
});

describe("rangeOf", () => {
  it("turns the calendar's exclusive end into the API's inclusive one", () => {
    expect(rangeOf("2026-10-26", "2026-12-07")).toEqual({ from: "2026-10-26", to: "2026-12-06" });
  });
});

describe("monthGrid", () => {
  it("lays out November 2026 in Monday-first weeks", () => {
    const weeks = monthGrid("2026-11-21");
    expect(weeks).toHaveLength(6);
    expect(weeks[0][0]).toBe("2026-10-26"); // Monday before 1 Nov (a Sunday)
    expect(weeks[0][6]).toBe("2026-11-01");
    expect(weeks.at(-1)?.[0]).toBe("2026-11-30");
    expect(weeks.at(-1)?.[6]).toBe("2026-12-06");
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it("needs no days of other months when a month fills whole weeks (February 2027)", () => {
    const weeks = monthGrid("2027-02-10");
    expect(weeks).toHaveLength(4);
    expect(weeks[0][0]).toBe("2027-02-01");
    expect(weeks[3][6]).toBe("2027-02-28");
  });
});

describe("tasksOnDay", () => {
  const oneDay = task({ id: 1, dueDate: "2026-11-21" });
  const multiDay = task({ id: 2, startDate: "2026-11-19", dueDate: "2026-11-22" });

  it("lists a Task on its due date only when it has no start date", () => {
    expect(tasksOnDay([oneDay], "2026-11-21")).toEqual([oneDay]);
    expect(tasksOnDay([oneDay], "2026-11-20")).toEqual([]);
  });

  it("lists a multi-day Task on every day it covers, both ends included", () => {
    for (const day of ["2026-11-19", "2026-11-20", "2026-11-22"]) {
      expect(tasksOnDay([multiDay], day)).toEqual([multiDay]);
    }
    expect(tasksOnDay([multiDay], "2026-11-23")).toEqual([]);
  });
});

describe("dayDots", () => {
  it("gives one dot per kind, most urgent first, at most three", () => {
    const tasks = [
      task({ id: 1, priority: "low" }),
      task({ id: 2, priority: "low" }),
      task({ id: 3, priority: "high" }),
      task({ id: 4, priority: "medium", isOverdue: true }),
      task({ id: 5, priority: "medium" }),
    ];
    expect(dayDots(tasks, "2026-11-25")).toEqual(["overdue", "high", "medium"]);
  });

  it("marks done Tasks apart from their Priority", () => {
    expect(dayDots([task({ priority: "high", status: "done", progress: 100 })], "2026-11-25")).toEqual(["done"]);
  });

  it("has no dots on a day without Tasks", () => {
    expect(dayDots([task({})], "2026-11-24")).toEqual([]);
  });
});

describe("monthTitle", () => {
  it("names a month of the year View with a BE year", () => {
    expect(monthTitle(2026, 0)).toBe("มกราคม 2569");
    expect(monthTitle(2026, 11)).toBe("ธันวาคม 2569");
  });
});

describe("viewTitle", () => {
  it("names the BE year in the year View", () => {
    expect(viewTitle("year", "2026-01-01", "2027-01-01")).toBe("พ.ศ. 2569");
  });

  it("names the full date with weekday and BE year in the day View", () => {
    expect(viewTitle("day", "2026-11-21", "2026-11-22")).toBe("วันเสาร์ที่ 21 พฤศจิกายน 2569");
  });

  it("names the month with a BE year in the month View", () => {
    expect(viewTitle("month", "2026-11-01", "2026-12-01")).toBe("พฤศจิกายน 2569");
  });

  it("names the week's days, month and BE year once in the week View", () => {
    expect(viewTitle("week", "2026-11-16", "2026-11-23")).toBe("16 – 22 พฤศจิกายน 2569");
  });

  it("names both months of a week that crosses two months", () => {
    expect(viewTitle("week", "2026-09-28", "2026-10-05")).toBe("28 กันยายน – 4 ตุลาคม 2569");
  });

  it("names both BE years of a week that crosses New Year", () => {
    expect(viewTitle("week", "2026-12-28", "2027-01-04")).toBe("28 ธันวาคม 2569 – 3 มกราคม 2570");
  });
});
