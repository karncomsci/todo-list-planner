"use client";

import dynamic from "next/dynamic";
import { cardClass } from "@/components/ui";

// The periods are worked out from today's date, read from the clock, so Reports render in the browser only.
const ReportsBoard = dynamic(() => import("./reports-board"), {
  ssr: false,
  loading: () => <section className={`${cardClass} text-sm text-muted`}>กำลังโหลดรายงาน…</section>,
});

export function ReportsView() {
  return <ReportsBoard />;
}
