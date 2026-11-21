import type { Metadata } from "next";
import { CategoriesCard } from "@/components/settings/categories-card";
import { PasswordCard } from "@/components/settings/password-card";
import { WaterGoalCard } from "@/components/settings/water-goal-card";

export const metadata: Metadata = { title: "ตั้งค่า · ปฏิทินตารางงาน" };

/** Settings: cards side by side on computers, one column on phones (D10). */
export default function SettingsPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">ตั้งค่า</h1>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <CategoriesCard />
        <div className="flex flex-col gap-6">
          <WaterGoalCard />
          <PasswordCard />
        </div>
      </div>
    </>
  );
}
