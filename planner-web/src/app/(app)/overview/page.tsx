import type { Metadata } from "next";
import { OverviewView } from "@/components/overview/overview-view";

export const metadata: Metadata = { title: "ภาพรวม · ปฏิทินตารางงาน" };

export default function OverviewPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">ภาพรวม</h1>
      <OverviewView />
    </>
  );
}
