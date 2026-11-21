"use client";

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import type { Health } from "@/lib/api/types";

const views = {
  checking: { icon: LoaderCircle, text: "กำลังตรวจสอบการเชื่อมต่อ…", tone: "text-muted" },
  ok: { icon: CircleCheck, text: "ระบบพร้อมใช้งาน เชื่อมต่อ API และฐานข้อมูลได้", tone: "text-success" },
  failed: { icon: CircleAlert, text: "เชื่อมต่อ API ไม่ได้", tone: "text-danger" },
};

/** Shows whether the browser reaches the API through this origin (D4). */
export function SystemStatus() {
  const [state, setState] = useState<keyof typeof views>("checking");

  useEffect(() => {
    let cancelled = false;
    api<Health>("GET", "/health")
      .then(() => {
        if (!cancelled) setState("ok");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState("failed");
        const code = error instanceof ApiError ? error.code : "internal";
        toast.error("เชื่อมต่อระบบไม่สำเร็จ", { description: `รหัสข้อผิดพลาด: ${code}` });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { icon: Icon, text, tone } = views[state];
  return (
    <p role="status" className={`flex items-center gap-2 ${tone}`}>
      <Icon
        className={`size-5 shrink-0 ${state === "checking" ? "animate-spin motion-reduce:animate-none" : ""}`}
        aria-hidden
      />
      <span>{text}</span>
    </p>
  );
}
