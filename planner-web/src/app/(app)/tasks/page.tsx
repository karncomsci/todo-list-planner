import type { Metadata } from "next";
import { TaskEntry } from "@/components/tasks/task-entry";

export const metadata: Metadata = { title: "บันทึกงาน · ปฏิทินตารางงาน" };

export default function TaskEntryPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">บันทึกงาน</h1>
      <TaskEntry />
    </>
  );
}
