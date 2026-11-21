import { describe, expect, it } from "vitest";
import type { Task } from "@/lib/api/types";
import { statusPreview, taskRequestOf, timeRange } from "./tasks";

describe("statusPreview", () => {
  it.each([
    [0, "not_started"],
    [1, "in_progress"],
    [99, "in_progress"],
    [100, "done"],
  ] as const)("progress %i previews as %s (D21)", (progress, status) => {
    expect(statusPreview(progress)).toBe(status);
  });
});

describe("timeRange", () => {
  it("joins both times", () => {
    expect(timeRange("09:00", "10:30")).toBe("09:00–10:30");
  });

  it("is empty without a time", () => {
    expect(timeRange(null, null)).toBe("");
  });
});

describe("taskRequestOf", () => {
  const task: Task = {
    id: 7,
    name: "ประชุม",
    dueDate: "2026-11-25",
    startDate: "2026-11-24",
    startTime: "09:00",
    endTime: "10:00",
    priority: "high",
    progress: 40,
    status: "in_progress",
    isOverdue: true,
    note: "สไลด์",
    category: { id: 3, name: "งาน" },
    completedAt: null,
    createdAt: "2026-11-21T05:00:00Z",
    updatedAt: "2026-11-21T05:00:00Z",
  };

  it("sends every field unchanged, the Category as its ID", () => {
    expect(taskRequestOf(task)).toEqual({
      name: "ประชุม",
      dueDate: "2026-11-25",
      startDate: "2026-11-24",
      startTime: "09:00",
      endTime: "10:00",
      priority: "high",
      progress: 40,
      note: "สไลด์",
      categoryId: 3,
    });
  });

  it("applies the changes, as when ticking done", () => {
    expect(taskRequestOf(task, { progress: 100 })).toMatchObject({ progress: 100, name: "ประชุม", categoryId: 3 });
  });

  it("sends null for a Task without a Category", () => {
    expect(taskRequestOf({ ...task, category: null }).categoryId).toBeNull();
  });
});
