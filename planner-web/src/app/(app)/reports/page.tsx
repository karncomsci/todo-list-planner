import type { Metadata } from "next";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata: Metadata = { title: "รายงาน · ปฏิทินตารางงาน" };

export default function ReportsPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">รายงาน</h1>
      <ReportsView />
    </>
  );
}
