"use client";

import { useReducedMotion } from "motion/react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { quick } from "@/components/motion";
import type { MonthSummary, TaskStatus } from "@/lib/api/types";
import { statusLabels } from "@/lib/tasks";

// Chart colours are the theme's CSS variables, so both themes need nothing more (D5, D8).
const statusColour: Record<TaskStatus, string> = {
  not_started: "var(--muted)",
  in_progress: "var(--priority-medium)",
  done: "var(--success)",
};
const statusOrder: TaskStatus[] = ["not_started", "in_progress", "done"];

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  color: "var(--text)",
};

/** Long Category names end in "…" beside the bars; the tooltip shows them whole. */
function shortName(name: string): string {
  const chars = Array.from(name);
  return chars.length > 14 ? `${chars.slice(0, 13).join("")}…` : name;
}

type Props = {
  /** undefined while loading. */
  summary: MonthSummary | undefined;
};

/**
 * This month's Tasks by Status (a donut) and by Category (bars), as the API
 * counts them (D30, D32, story 39). Recharts animates them in under 0.3 s, and
 * not at all when the device asks for reduced motion (D7).
 */
export function MonthCharts({ summary }: Props) {
  const reduce = useReducedMotion() ?? false;
  const animation = {
    isAnimationActive: !reduce,
    animationDuration: quick.duration * 1000,
    animationEasing: "ease-out",
  } as const;

  if (!summary) return null;
  if (summary.total === 0) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5 lg:col-span-2">
        <p className="text-sm text-muted">เดือนนี้ยังไม่มีงาน กราฟจะแสดงเมื่อมีงานที่ครบกำหนดในเดือนนี้</p>
      </section>
    );
  }

  const statuses = statusOrder.map((status) => ({
    status,
    name: statusLabels[status],
    count: summary.byStatus[status],
  }));
  const categories = summary.byCategory.map((entry) => ({
    name: entry.category?.name ?? "ไม่มีหมวดหมู่",
    count: entry.count,
  }));
  // One bar per row, tall enough to read.
  const barHeight = Math.max(categories.length * 44 + 16, 120);

  return (
    <>
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="status-chart-title">
        <h2 id="status-chart-title" className="mb-3 text-lg font-semibold">
          งานตามสถานะ
        </h2>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative size-44 shrink-0" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statuses.filter((s) => s.count > 0)}
                  dataKey="count"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="100%"
                  paddingAngle={2}
                  stroke="var(--surface)"
                  {...animation}
                >
                  {statuses
                    .filter((s) => s.count > 0)
                    .map((s) => (
                      <Cell key={s.status} fill={statusColour[s.status]} />
                    ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: "var(--text)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums">{summary.total}</span>
              <span className="text-xs text-muted">งาน</span>
            </div>
          </div>
          {/* The legend carries the numbers as text, for reading and for screen readers. */}
          <ul className="flex w-full flex-col gap-2">
            {statuses.map((s) => (
              <li key={s.status} className="flex items-center gap-2 text-sm">
                <span className="size-3 shrink-0 rounded-full" style={{ background: statusColour[s.status] }} aria-hidden />
                <span className="flex-1">{s.name}</span>
                <span className="font-medium tabular-nums">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="category-chart-title">
        <h2 id="category-chart-title" className="mb-3 text-lg font-semibold">
          งานตามหมวดหมู่
        </h2>
        <div aria-hidden style={{ height: barHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--text)", fontSize: 14 }}
                tickFormatter={shortName}
              />
              <Tooltip
                cursor={{ fill: "var(--primary-soft)" }}
                contentStyle={tooltipStyle}
                itemStyle={{ color: "var(--text)" }}
                formatter={(value) => [value, "งาน"]}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[0, 6, 6, 0]} barSize={24} {...animation}>
                <LabelList dataKey="count" position="right" fill="var(--muted)" fontSize={13} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul className="sr-only">
          {categories.map((c) => (
            <li key={c.name}>
              {c.name} {c.count} งาน
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
