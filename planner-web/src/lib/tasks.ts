import type { Priority, Task, TaskRequest, TaskStatus } from "@/lib/api/types";

/** Thai names from the glossary. */
export const statusLabels: Record<TaskStatus, string> = {
  not_started: "ยังไม่เริ่ม",
  in_progress: "กำลังทำ",
  done: "เสร็จแล้ว",
};

export const priorityLabels: Record<Priority, string> = {
  high: "สูง",
  medium: "กลาง",
  low: "ต่ำ",
};

/** Tailwind background class per Priority (A3: colour comes from Priority only). */
export const priorityDotClass: Record<Priority, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

/**
 * The Status a Progress value will have, shown while editing before the Task is
 * saved. Mirrors the API's rule (D21); a saved Task's Status always comes from the API.
 */
export function statusPreview(progress: number): TaskStatus {
  if (progress >= 100) return "done";
  if (progress > 0) return "in_progress";
  return "not_started";
}

/** "09:00–10:30", or "" for a Task without a time. */
export function timeRange(startTime: string | null, endTime: string | null): string {
  return startTime && endTime ? `${startTime}–${endTime}` : "";
}

/**
 * The update body that saves a Task unchanged except for `changes`. Update
 * replaces every field, so every field is sent.
 */
export function taskRequestOf(task: Task, changes: Partial<TaskRequest> = {}): TaskRequest {
  return {
    name: task.name,
    dueDate: task.dueDate,
    startDate: task.startDate,
    startTime: task.startTime,
    endTime: task.endTime,
    priority: task.priority,
    progress: task.progress,
    note: task.note,
    categoryId: task.category?.id ?? null,
    ...changes,
  };
}
