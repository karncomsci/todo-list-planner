"use client";

import { LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cardClass, dangerButtonClass, inputClass, primaryButtonClass, secondaryButtonClass, spinnerClass } from "@/components/ui";
import { api } from "@/lib/api/client";
import { errorText } from "@/lib/api/messages";
import type { Category, CategoryListResponse, CategoryResponse } from "@/lib/api/types";

// In these requests `name` is a Category's name, not a Task's.
const nameLabels = { name: "ชื่อหมวดหมู่" };

const byName = (a: Category, b: Category) => a.name.localeCompare(b.name, "th", { sensitivity: "base" });

/**
 * Add, rename and delete Categories (D24, stories 55, 56). Deleting one keeps
 * its Tasks, which become uncategorised.
 */
export function CategoriesCard() {
  const [categories, setCategories] = useState<Category[]>();
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<{ id: number; name: string; error?: string } | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let current = true;
    api<CategoryListResponse>("GET", "/categories")
      .then(({ categories }) => current && setCategories(categories))
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, []);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { category } = await api<CategoryResponse>("POST", "/categories", { name: draft });
      setCategories((list) => [...(list ?? []), category].sort(byName));
      setDraft("");
      setDraftError(undefined);
      toast.success("เพิ่มหมวดหมู่แล้ว", { description: category.name });
    } catch (error) {
      setDraftError(errorText(error, nameLabels));
    } finally {
      setBusy(false);
    }
  }

  async function rename(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const { category } = await api<CategoryResponse>("PUT", `/categories/${editing.id}`, { name: editing.name });
      setCategories((list) => list?.map((c) => (c.id === category.id ? category : c)).sort(byName));
      setEditing(null);
      toast.success("เปลี่ยนชื่อหมวดหมู่แล้ว", { description: category.name });
    } catch (error) {
      setEditing((e) => e && { ...e, error: errorText(error, nameLabels) });
    } finally {
      setBusy(false);
    }
  }

  async function remove(category: Category) {
    setBusy(true);
    try {
      await api("DELETE", `/categories/${category.id}`);
      setCategories((list) => list?.filter((c) => c.id !== category.id));
      setDeleting(null);
      toast.success("ลบหมวดหมู่แล้ว", { description: category.name });
    } catch (error) {
      toast.error("ลบหมวดหมู่ไม่สำเร็จ", { description: errorText(error, nameLabels) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cardClass} aria-labelledby="categories-title">
      <h2 id="categories-title" className="mb-1 text-lg font-semibold">
        หมวดหมู่
      </h2>
      <p className="mb-4 text-sm text-muted">ลบหมวดหมู่แล้วงานในหมวดยังอยู่ และจะกลายเป็นไม่มีหมวดหมู่</p>

      {failed ? (
        <p className="text-sm text-danger">โหลดหมวดหมู่ไม่สำเร็จ</p>
      ) : !categories ? (
        <p className="text-sm text-muted">กำลังโหลด…</p>
      ) : (
        <>
          {categories.length === 0 ? (
            <p className="mb-4 text-sm text-muted">ยังไม่มีหมวดหมู่</p>
          ) : (
            <ul className="mb-4 flex flex-col divide-y divide-border">
              {categories.map((category) => (
                <li key={category.id} className="py-2 first:pt-0">
                  {editing?.id === category.id ? (
                    <form onSubmit={rename} className="flex flex-col gap-2">
                      <label htmlFor={`rename-${category.id}`} className="sr-only">
                        ชื่อใหม่ของ {category.name}
                      </label>
                      <input
                        id={`rename-${category.id}`}
                        value={editing.name}
                        maxLength={50}
                        autoFocus
                        onChange={(e) => setEditing({ id: category.id, name: e.target.value })}
                        onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                        aria-invalid={editing.error ? true : undefined}
                        className={`${inputClass} py-2`}
                      />
                      {editing.error && <p className="text-sm text-danger">{editing.error}</p>}
                      <div className="flex gap-2">
                        <button type="submit" disabled={busy} className={`${primaryButtonClass} px-4 py-2 text-sm`}>
                          {busy && <LoaderCircle className={spinnerClass} aria-hidden />}
                          บันทึกชื่อ
                        </button>
                        <button type="button" onClick={() => setEditing(null)} className={secondaryButtonClass}>
                          ยกเลิก
                        </button>
                      </div>
                    </form>
                  ) : deleting?.id === category.id ? (
                    <div role="alertdialog" aria-labelledby={`delete-${category.id}`} className="rounded-xl border border-danger/40 bg-danger/5 p-3">
                      <p id={`delete-${category.id}`} className="font-medium text-danger">
                        ลบหมวดหมู่ “{category.name}”?
                      </p>
                      <p className="mt-1 text-sm text-muted">งานในหมวดนี้ยังอยู่ และจะกลายเป็นไม่มีหมวดหมู่</p>
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => remove(category)} disabled={busy} className={dangerButtonClass}>
                          {busy && <LoaderCircle className={spinnerClass} aria-hidden />}
                          ลบหมวดหมู่
                        </button>
                        <button type="button" onClick={() => setDeleting(null)} className={secondaryButtonClass}>
                          ไม่ลบ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate">{category.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleting(null);
                          setEditing({ id: category.id, name: category.name });
                        }}
                        aria-label={`เปลี่ยนชื่อ ${category.name}`}
                        className="rounded-lg p-2 text-muted hover:bg-primary-soft hover:text-primary"
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(null);
                          setDeleting(category);
                        }}
                        aria-label={`ลบ ${category.name}`}
                        className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={add} className="flex flex-col gap-2">
            <label htmlFor="new-category" className="text-sm font-medium">
              เพิ่มหมวดหมู่
            </label>
            <div className="flex gap-2">
              <input
                id="new-category"
                value={draft}
                maxLength={50}
                placeholder="ชื่อหมวดหมู่"
                onChange={(e) => {
                  setDraft(e.target.value);
                  setDraftError(undefined);
                }}
                aria-invalid={draftError ? true : undefined}
                className={`${inputClass} py-2`}
              />
              <button type="submit" disabled={busy || !draft.trim()} className={`${primaryButtonClass} shrink-0 px-4 py-2 text-sm`}>
                เพิ่ม
              </button>
            </div>
            {draftError && <p className="text-sm text-danger">{draftError}</p>}
          </form>
        </>
      )}
    </section>
  );
}
