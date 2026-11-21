"use client";

import { motion } from "motion/react";
import type { MonthSummary as Summary } from "@/lib/api/types";
import { formatThaiDate } from "@/lib/dates";
import { CountUp } from "./count-up";

const cards: { key: "total" | "done" | "inProgress" | "overdue"; label: string; colour: string }[] = [
  { key: "total", label: "ทั้งหมด", colour: "text-primary" },
  { key: "done", label: "เสร็จแล้ว", colour: "text-success" },
  { key: "inProgress", label: "กำลังทำ", colour: "text-priority-medium" },
  { key: "overdue", label: "เลยกำหนด", colour: "text-danger" },
];

type Props = {
  /** undefined while loading. */
  summary: Summary | undefined;
  failed: boolean;
};

/**
 * This month's summary: four numbers over the Tasks due this month, as the API
 * counts them (D30, D32, story 38). The numbers count up when they appear.
 */
export function MonthSummary({ summary, failed }: Props) {
  return (
    <section aria-labelledby="month-title" className="lg:col-span-2">
      <h2 id="month-title" className="mb-3 text-lg font-semibold">
        สรุปเดือนนี้
        {summary && (
          <span className="ml-2 text-sm font-normal text-muted">{formatThaiDate(`${summary.month}-01`, "monthYear")}</span>
        )}
      </h2>
      {failed ? (
        <p className="text-sm text-danger">โหลดภาพรวมไม่สำเร็จ</p>
      ) : (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map((card) => (
            <motion.div
              key={card.key}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <dt className="text-sm text-muted">{card.label}</dt>
              <dd className={`mt-1 text-3xl font-semibold ${card.colour}`}>
                {summary ? <CountUp value={summary[card.key]} /> : <span className="text-muted">–</span>}
              </dd>
            </motion.div>
          ))}
        </dl>
      )}
    </section>
  );
}
