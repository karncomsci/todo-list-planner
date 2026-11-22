import type { Task } from "@/lib/api/types";
import { formatThaiDate } from "@/lib/dates";
import { priorityDotClass, priorityLabels, statusLabels } from "@/lib/tasks";
import { dayPeriod } from "@/lib/times";

/** A saved Task read-only: every field, as the Owner reviews it before editing. */
export function TaskDetails({ task }: { task: Task }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {task.isOverdue ? (
          <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-sm text-danger">เลยกำหนด</span>
        ) : (
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-sm text-primary">
            {statusLabels[task.status]}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-sm">
          <span className={`size-2.5 rounded-full ${priorityDotClass[task.priority]}`} aria-hidden />
          ความสำคัญ{priorityLabels[task.priority]}
        </span>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Item label="วันครบกำหนด">
          <span className={task.isOverdue ? "text-danger" : undefined}>{formatThaiDate(task.dueDate, "weekday")}</span>
        </Item>
        <Item label="วันเริ่ม">{task.startDate ? formatThaiDate(task.startDate, "weekday") : <Empty />}</Item>
        <Item label="เวลา">
          {task.startTime && task.endTime ? (
            <span className="tabular-nums">
              {task.startTime} น. ({dayPeriod(task.startTime)}) – {task.endTime} น. ({dayPeriod(task.endTime)})
            </span>
          ) : (
            <Empty>ไม่ระบุเวลา</Empty>
          )}
        </Item>
        <Item label="หมวดหมู่">{task.category ? task.category.name : <Empty>ไม่มีหมวดหมู่</Empty>}</Item>
        <Item label="ความคืบหน้า" wide>
          <div className="flex items-center gap-3">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-label="ความคืบหน้า"
              aria-valuenow={task.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="w-12 text-right tabular-nums">{task.progress}%</span>
          </div>
        </Item>
        <Item label="โน้ต" wide>
          {task.note ? <p className="whitespace-pre-wrap break-words">{task.note}</p> : <Empty>ไม่มีโน้ต</Empty>}
        </Item>
      </dl>
    </div>
  );
}

function Item({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function Empty({ children = "—" }: { children?: React.ReactNode }) {
  return <span className="text-muted">{children}</span>;
}
