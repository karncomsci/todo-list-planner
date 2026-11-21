import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { errorText } from "@/lib/api/messages";
import type { Task, TaskResponse } from "@/lib/api/types";
import { taskRequestOf } from "@/lib/tasks";

// Tasks being ticked, so a double click saves once.
const ticking = new Set<number>();

// When each Task was last ticked here, so only that tick animates, not every redraw.
const tickedAt = new Map<number, number>();

/** Whether the Owner ticked this Task within the last two seconds. */
export function justTicked(taskId: number): boolean {
  const at = tickedAt.get(taskId);
  return at !== undefined && Date.now() - at < 2000;
}

/**
 * Ticks a Task done: Progress becomes 100, and the API then reports it done and
 * no longer Overdue (stories 31, 35, D21). Unticking is done in the form.
 * Returns whether it was saved; either way the Owner sees a toast (story 64).
 */
export async function tickDone(task: Task): Promise<boolean> {
  if (ticking.has(task.id)) return false;
  ticking.add(task.id);
  try {
    const { task: saved } = await api<TaskResponse>("PUT", `/tasks/${task.id}`, taskRequestOf(task, { progress: 100 }));
    tickedAt.set(task.id, Date.now());
    toast.success("ทำเสร็จแล้ว", { description: saved.name });
    return true;
  } catch (error) {
    toast.error("บันทึกงานไม่สำเร็จ", { description: errorText(error) });
    return false;
  } finally {
    ticking.delete(task.id);
  }
}
