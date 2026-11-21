import type { Metadata } from "next";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata: Metadata = { title: "ตารางงาน · ปฏิทินตารางงาน" };

export default function CalendarPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">ตารางงาน</h1>
      <CalendarView />
    </>
  );
}
