"use client";

import { useEffect, useState } from "react";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskRow } from "@/components/tasks/task-row";
import { tickDone } from "@/components/tasks/tick-done";
import { api } from "@/lib/api/client";
import type { OverviewResponse, Task } from "@/lib/api/types";
import { formatThaiDate } from "@/lib/dates";
import { MonthCharts } from "./month-charts";
import { MonthSummary } from "./month-summary";

/**
 * The Overview: the current state only (D30). Every list and number comes from
 * the API (D32); this component only shows them, and loads them again after a
 * Task is ticked, saved or deleted.
 */
export function OverviewView() {
  const [overview, setOverview] = useState<OverviewResponse>();
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  // Bumped to load the Overview again after a Task changes.
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    let current = true;
    api<OverviewResponse>("GET", "/overview")
      .then((body) => {
        if (!current) return;
        setOverview(body);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [version]);

  async function tick(task: Task) {
    if (await tickDone(task)) reload();
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="today-title">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 id="today-title" className="text-lg font-semibold">
            งานวันนี้
            {overview && <span className="ml-2 text-sm font-normal text-muted">{overview.todayTasks.length} รายการ</span>}
          </h2>
          {overview && <p className="text-sm text-muted">{formatThaiDate(overview.today, "weekday")}</p>}
        </div>
        <TaskList
          tasks={overview?.todayTasks}
          failed={failed}
          empty="วันนี้ไม่มีงาน"
          onTick={tick}
          onOpen={setEditing}
        />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="overdue-title">
        <h2 id="overdue-title" className="mb-3 text-lg font-semibold">
          งานเลยกำหนด
          {overview && (
            <span
              className={`ml-2 text-sm font-normal ${overview.overdueTasks.length ? "text-danger" : "text-muted"}`}
            >
              {overview.overdueTasks.length} รายการ
            </span>
          )}
        </h2>
        <TaskList
          tasks={overview?.overdueTasks}
          failed={failed}
          empty="ไม่มีงานเลยกำหนด"
          showDueDate
          onTick={tick}
          onOpen={setEditing}
        />
      </section>

      {/* Today's and Overdue Tasks come first, so the Owner sees what to do (story 36). */}
      <MonthSummary summary={overview?.month} failed={failed} />
      <MonthCharts summary={overview?.month} />

      <TaskDialog task={editing} onClose={() => setEditing(null)} onSaved={reload} onDeleted={reload} />
    </div>
  );
}

type TaskListProps = {
  /** undefined while loading. */
  tasks: Task[] | undefined;
  failed: boolean;
  empty: string;
  showDueDate?: boolean;
  onTick: (task: Task) => void;
  onOpen: (task: Task) => void;
};

function TaskList({ tasks, failed, empty, showDueDate, onTick, onOpen }: TaskListProps) {
  if (failed) return <p className="text-sm text-danger">โหลดภาพรวมไม่สำเร็จ</p>;
  if (!tasks) return <p className="text-sm text-muted">กำลังโหลด…</p>;
  if (tasks.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="flex flex-col divide-y divide-border">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onTick={onTick} onOpen={onOpen} showDueDate={showDueDate} />
      ))}
    </ul>
  );
}
