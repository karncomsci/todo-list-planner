import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ · ปฏิทินตารางงาน" };

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="fixed top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <Brand />
        <h1 className="mt-6 text-xl font-semibold">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-muted">ใช้อีเมลและรหัสผ่านของเจ้าของระบบ</p>
        <SignInForm />
      </div>
    </main>
  );
}
