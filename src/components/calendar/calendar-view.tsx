"use client";

import dynamic from "next/dynamic";

// The Calendars read the clock and the screen width as they render, so they render in
// the browser only.
const ResponsiveCalendar = dynamic(() => import("./responsive-calendar"), {
  ssr: false,
  loading: () => (
    <section className="h-[40rem] rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
      กำลังโหลดปฏิทิน…
    </section>
  ),
});

export function CalendarView() {
  return <ResponsiveCalendar />;
}
