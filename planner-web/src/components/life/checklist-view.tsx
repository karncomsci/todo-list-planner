"use client";

import dynamic from "next/dynamic";
import { cardClass } from "@/components/ui";

// The checklist opens on today's date, read from the clock, so it renders in the browser only.
const DailyChecklist = dynamic(() => import("./daily-checklist"), {
  ssr: false,
  loading: () => <section className={`${cardClass} text-sm text-muted`}>กำลังโหลดเช็กลิสต์…</section>,
});

export function ChecklistView() {
  return <DailyChecklist />;
}
