"use client";

import { LoaderCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { shortName, tooltipItemStyle, tooltipStyle, useChartAnimation } from "@/components/charts";
import { DatePicker } from "@/components/date-picker";
import { CountUp } from "@/components/overview/count-up";
import { cardClass, spinnerClass } from "@/components/ui";
import { api } from "@/lib/api/client";
import type { Priority, Report, ReportResponse, SettingsResponse } from "@/lib/api/types";
import { formatThaiDate, formatThaiDateRange, type IsoDate, todayIso } from "@/lib/dates";
import { customRangeProblem, type Period, periodRange } from "@/lib/reports";
import { priorityLabels } from "@/lib/tasks";

const periods: { value: Period; label: string }[] = [
  { value: "week", label: "สัปดาห์นี้" },
  { value: "month", label: "เดือนนี้" },
  { value: "year", label: "ปีนี้" },
  { value: "custom", label: "กำหนดเอง" },
];

const priorityOrder: Priority[] = ["high", "medium", "low"];
const priorityColour: Record<Priority, string> = {
  high: "var(--priority-high)",
  medium: "var(--priority-medium)",
  low: "var(--priority-low)",
};

function rangeTitle(from: IsoDate, to: IsoDate): string {
  return from === to ? formatThaiDate(from) : formatThaiDateRange(from, to);
}

/**
 * Reports (D31, stories 48 to 53): the Owner picks this week, this month, this
 * year or a custom range, and sees the six metrics the API calculates (D32).
 * Browser only: the periods are worked out from today's date.
 */
export default function ReportsBoard() {
  const [today] = useState(todayIso);
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState<IsoDate | "">(() => periodRange("month", today).from);
  const [customTo, setCustomTo] = useState<IsoDate | "">(today);
  const [report, setReport] = useState<Report>();
  const [failed, setFailed] = useState(false);
  const [waterGoal, setWaterGoal] = useState<number>();

  const problem = period === "custom" ? customRangeProblem(customFrom, customTo) : null;
  const range =
    period === "custom"
      ? problem
        ? null
        : { from: customFrom as IsoDate, to: customTo as IsoDate }
      : periodRange(period, today);
  const from = range?.from;
  const to = range?.to;

  useEffect(() => {
    let current = true;
    api<SettingsResponse>("GET", "/settings")
      .then(({ settings }) => current && setWaterGoal(settings.waterGoal))
      .catch(() => current && setWaterGoal(8));
    return () => {
      current = false;
    };
  }, []);

  // An answer for a range the Owner has already left is dropped.
  useEffect(() => {
    if (!from || !to) return;
    let current = true;
    api<ReportResponse>("GET", `/reports?from=${from}&to=${to}`)
      .then(({ report }) => {
        if (!current) return;
        setReport(report);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [from, to]);

  const shown = report && report.from === from && report.to === to ? report : undefined;
  const loading = !!range && !shown && !failed;

  return (
    <div className="flex flex-col gap-6">
      <section className={cardClass} aria-label="ช่วงเวลา">
        <div className="flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="ช่วงเวลา" className="inline-flex flex-wrap rounded-xl border border-border bg-bg p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={period === p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-lg px-3.5 py-1.5 text-sm ${
                  period === p.value ? "bg-surface font-medium shadow-sm" : "text-muted hover:text-text"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {loading && <LoaderCircle className={`${spinnerClass} text-muted`} aria-label="กำลังโหลด" />}
        </div>

        {period === "custom" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:max-w-xl">
            <div>
              <label htmlFor="report-from" className="text-sm font-medium">
                วันเริ่ม
              </label>
              <DatePicker id="report-from" name="from" value={customFrom} onChange={setCustomFrom} />
            </div>
            <div>
              <label htmlFor="report-to" className="text-sm font-medium">
                วันสิ้นสุด
              </label>
              <DatePicker id="report-to" name="to" value={customTo} onChange={setCustomTo} />
            </div>
            {problem && <p className="text-sm text-danger sm:col-span-2">{problem}</p>}
          </div>
        )}

        {range && (
          <h2 className="mt-4 text-lg font-semibold" aria-live="polite">
            {rangeTitle(range.from, range.to)}
          </h2>
        )}
      </section>

      {failed ? (
        <p className="text-sm text-danger">โหลดรายงานไม่สำเร็จ</p>
      ) : shown ? (
        <ReportBody report={shown} waterGoal={waterGoal ?? 8} />
      ) : null}
    </div>
  );
}

function Stat({ label, children, detail, colour = "" }: { label: string; children: React.ReactNode; detail?: string; colour?: string }) {
  return (
    <motion.div whileHover={{ y: -2 }} className={cardClass}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`mt-1 text-3xl font-semibold tabular-nums ${colour}`}>{children}</dd>
      {detail && <dd className="mt-1 text-sm text-muted">{detail}</dd>}
    </motion.div>
  );
}

function ReportBody({ report, waterGoal }: { report: Report; waterGoal: number }) {
  const animation = useChartAnimation();
  const { onTime, water } = report;
  const settled = onTime.onTime + onTime.late + onTime.notDone;

  const weeks = report.completedPerWeek.map((w) => ({
    name: formatThaiDate(w.weekStart, "dayMonthShort"),
    title: `สัปดาห์เริ่ม ${formatThaiDate(w.weekStart)}`,
    count: w.count,
  }));
  const categories = report.byCategory.map((c) => ({ name: c.category?.name ?? "ไม่มีหมวดหมู่", count: c.count }));
  const priorities = priorityOrder.map((p) => ({ priority: p, name: priorityLabels[p], count: report.byPriority[p] }));
  const categoryHeight = Math.max(categories.length * 44 + 16, 120);

  return (
    <>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="งานครบกำหนดในช่วงนี้" colour="text-primary">
          <CountUp value={report.total} />
        </Stat>
        <Stat
          label="ทำเสร็จตรงเวลา"
          colour="text-success"
          detail={settled ? `ตรงเวลา ${onTime.onTime} · ล่าช้า ${onTime.late} · ยังไม่เสร็จ ${onTime.notDone}` : "ยังไม่มีงานที่ถึงกำหนด"}
        >
          {onTime.share === null ? "–" : <><CountUp value={Math.round(onTime.share * 100)} />%</>}
        </Stat>
        <Stat label="งานเลยกำหนด" colour="text-danger">
          <CountUp value={report.overdue} />
        </Stat>
        <Stat
          label="ดื่มน้ำเฉลี่ยต่อวัน"
          colour="text-priority-low"
          detail={water.averageGlasses === null ? "ช่วงนี้ยังไม่ถึง" : `เป้า ${waterGoal} แก้ว · ${water.days} วัน`}
        >
          {water.averageGlasses === null ? "–" : `${water.averageGlasses.toLocaleString("th-TH", { maximumFractionDigits: 1 })} แก้ว`}
        </Stat>
        <Stat label="วันที่กินครบ 3 มื้อ" colour="text-priority-medium" detail={water.days ? `จาก ${water.days} วัน` : undefined}>
          <CountUp value={report.allMealsDays} />
        </Stat>
      </dl>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <section className={`${cardClass} lg:col-span-2`} aria-labelledby="weekly-title">
          <h2 id="weekly-title" className="mb-3 text-lg font-semibold">
            งานที่ทำเสร็จต่อสัปดาห์
          </h2>
          <div aria-hidden className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeks} margin={{ top: 16, right: 8, bottom: 0, left: -24 }}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "var(--primary-soft)" }}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.title ?? ""}
                  formatter={(value) => [value, "งานที่เสร็จ"]}
                />
                <Bar dataKey="count" fill="var(--success)" radius={[6, 6, 0, 0]} maxBarSize={40} {...animation} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="sr-only">
            {weeks.map((w) => (
              <li key={w.title}>
                {w.title} เสร็จ {w.count} งาน
              </li>
            ))}
          </ul>
        </section>

        <section className={cardClass} aria-labelledby="report-category-title">
          <h2 id="report-category-title" className="mb-3 text-lg font-semibold">
            งานตามหมวดหมู่
          </h2>
          {categories.length === 0 ? (
            <p className="text-sm text-muted">ไม่มีงานที่ครบกำหนดในช่วงนี้</p>
          ) : (
            <>
              <div aria-hidden style={{ height: categoryHeight }}>
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
                      itemStyle={tooltipItemStyle}
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
            </>
          )}
        </section>

        <section className={cardClass} aria-labelledby="report-priority-title">
          <h2 id="report-priority-title" className="mb-3 text-lg font-semibold">
            งานตามความสำคัญ
          </h2>
          <div aria-hidden className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorities} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={56} tickLine={false} axisLine={false} tick={{ fill: "var(--text)", fontSize: 14 }} />
                <Tooltip
                  cursor={{ fill: "var(--primary-soft)" }}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value) => [value, "งาน"]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24} {...animation}>
                  {priorities.map((p) => (
                    <Cell key={p.priority} fill={priorityColour[p.priority]} />
                  ))}
                  <LabelList dataKey="count" position="right" fill="var(--muted)" fontSize={13} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="sr-only">
            {priorities.map((p) => (
              <li key={p.priority}>
                ความสำคัญ{p.name} {p.count} งาน
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
