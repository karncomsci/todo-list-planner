"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Task, TaskListResponse } from "@/lib/api/types";
import { RecentTasks } from "./recent-tasks";
import { TaskDialog } from "./task-dialog";
import { TaskForm } from "./task-form";

const RECENT_COUNT = 10;

/** The Task entry page: the form beside the most recent Tasks. */
export function TaskEntry() {
  const [recent, setRecent] = useState<Task[]>();
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const load = useCallback(async () => {
    try {
      const { tasks } = await api<TaskListResponse>("GET", `/tasks?recent=${RECENT_COUNT}`);
      setRecent(tasks);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    // Initial load of data from the API, which lives outside React.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Show the saved Task at once, then refresh from the API.
  function saved(task: Task) {
    setRecent((current) => [task, ...(current ?? []).filter((t) => t.id !== task.id)].slice(0, RECENT_COUNT));
    void load();
  }

  function deleted(task: Task) {
    setRecent((current) => current?.filter((t) => t.id !== task.id));
    void load();
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="mb-5 text-lg font-semibold">เพิ่มงาน</h2>
        <TaskForm onSaved={saved} />
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">งานล่าสุด</h2>
        <RecentTasks tasks={recent} failed={failed} onOpen={setEditing} />
      </section>
      <TaskDialog task={editing} onClose={() => setEditing(null)} onSaved={saved} onDeleted={deleted} />
    </div>
  );
}
