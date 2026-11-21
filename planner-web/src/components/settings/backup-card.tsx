"use client";

import { Download, LoaderCircle, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cardClass, dangerButtonClass, secondaryButtonClass, spinnerClass } from "@/components/ui";
import { api } from "@/lib/api/client";
import { errorText } from "@/lib/api/messages";
import type { ImportBackupResponse } from "@/lib/api/types";

/**
 * Backup (D33, D34, stories 58, 59): download all data as one file, or import
 * a backup that replaces all data after a confirmation. The API checks the
 * file; a wrong file changes nothing.
 */
export function BackupCard() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; body: unknown } | null>(null);
  const [busy, setBusy] = useState(false);

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setPending({ name: file.name, body: JSON.parse(await file.text()) });
    } catch {
      toast.error("นำเข้าไม่สำเร็จ", { description: "ไฟล์นี้ไม่ใช่ไฟล์สำรองข้อมูล ข้อมูลเดิมไม่ถูกเปลี่ยน" });
    }
  }

  async function importNow() {
    if (!pending) return;
    setBusy(true);
    try {
      const { imported } = await api<ImportBackupResponse>("POST", "/backup", pending.body);
      setPending(null);
      toast.success("นำเข้าข้อมูลแล้ว", {
        description: `งาน ${imported.tasks} · หมวดหมู่ ${imported.categories} · เช็กลิสต์ ${imported.checklists} วัน · กิจวัตร ${imported.routine} ชั่วโมง`,
      });
    } catch (error) {
      toast.error("นำเข้าไม่สำเร็จ", { description: errorText(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cardClass} aria-labelledby="backup-title">
      <h2 id="backup-title" className="mb-1 text-lg font-semibold">
        สำรองข้อมูล
      </h2>
      <p className="mb-4 text-sm text-muted">
        ดาวน์โหลดงาน หมวดหมู่ กิจวัตร เช็กลิสต์ทุกวัน และการตั้งค่าเป็นไฟล์เดียว เก็บไว้นอกเครื่องได้ ไฟล์ไม่มีรหัสผ่าน
      </p>

      <div className="flex flex-wrap gap-2">
        {/* A plain link: the browser downloads the API's answer with the session cookie. */}
        <a href="/api/backup" download className={secondaryButtonClass}>
          <Download className="size-4" aria-hidden />
          ดาวน์โหลดไฟล์สำรอง
        </a>
        <button type="button" onClick={() => fileInput.current?.click()} disabled={busy} className={secondaryButtonClass}>
          <Upload className="size-4" aria-hidden />
          นำเข้าจากไฟล์…
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json" onChange={choose} className="sr-only" tabIndex={-1} aria-hidden />
      </div>

      {pending && (
        <div role="alertdialog" aria-labelledby="import-title" className="mt-4 rounded-xl border border-danger/40 bg-danger/5 p-4">
          <p id="import-title" className="font-medium text-danger">
            แทนที่ข้อมูลทั้งหมดด้วยไฟล์ “{pending.name}”?
          </p>
          <p className="mt-1 text-sm text-muted">
            งาน หมวดหมู่ กิจวัตร เช็กลิสต์ และการตั้งค่าที่มีอยู่ตอนนี้จะถูกลบและแทนที่ด้วยข้อมูลในไฟล์ ไม่มีการรวมข้อมูล และกู้คืนไม่ได้
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={importNow} disabled={busy} className={dangerButtonClass}>
              {busy && <LoaderCircle className={spinnerClass} aria-hidden />}
              แทนที่ข้อมูลทั้งหมด
            </button>
            <button type="button" onClick={() => setPending(null)} disabled={busy} className={secondaryButtonClass}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
