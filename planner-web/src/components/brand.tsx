import { CalendarCheck } from "lucide-react";

/** App icon and name (A7: provisional). */
export function Brand() {
  return (
    <div className="flex items-center gap-2.5 font-semibold">
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-fg">
        <CalendarCheck className="size-5" aria-hidden />
      </span>
      <span>ปฏิทินตารางงาน</span>
    </div>
  );
}
