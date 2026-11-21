import { SystemStatus } from "@/components/system-status";

// Temporary landing page: the Calendar takes its place in ticket 08.
export default function HomePage() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h1 className="text-xl font-semibold">ปฏิทินตารางงาน</h1>
      <p className="mt-1 text-muted">โครงระบบพร้อมแล้ว หน้าต่าง ๆ จะเปิดใช้งานตามลำดับ</p>
      <div className="mt-5">
        <SystemStatus />
      </div>
    </section>
  );
}
