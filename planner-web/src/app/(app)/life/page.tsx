import type { Metadata } from "next";
import { RoutineEditor } from "@/components/life/routine-editor";

export const metadata: Metadata = { title: "ตารางชีวิต · ปฏิทินตารางงาน" };

/** The Life Schedule: the Routine and the Daily Checklist, apart from Tasks (D29). */
export default function LifeSchedulePage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">ตารางชีวิต</h1>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <RoutineEditor />
      </div>
    </>
  );
}
