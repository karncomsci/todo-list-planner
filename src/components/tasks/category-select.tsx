"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import { errorText } from "@/lib/api/messages";
import type { Category, CategoryListResponse, CategoryResponse, CreateCategoryRequest } from "@/lib/api/types";

type Props = {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  invalid?: boolean;
  errorId?: string;
  className: string;
};

const nameLabels = { name: "ชื่อหมวดหมู่" };

/**
 * Chooses the Task's Category, or none, and creates a new one in place; the new
 * Category is selected at once (D24, story 11). Rename and delete live in Settings.
 */
export function CategorySelect({ id, value, onChange, invalid, errorId, className }: Props) {
  const [categories, setCategories] = useState<Category[]>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const draftRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    let live = true;
    api<CategoryListResponse>("GET", "/categories")
      .then(({ categories }) => live && setCategories(categories))
      .catch(() => live && setLoadFailed(true));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (creating) draftRef.current?.focus();
  }, [creating]);

  function closeCreator() {
    setCreating(false);
    setDraft("");
    setDraftError(undefined);
    selectRef.current?.focus();
  }

  async function create() {
    if (busy) return;
    setBusy(true);
    setDraftError(undefined);
    try {
      const request: CreateCategoryRequest = { name: draft };
      const { category } = await api<CategoryResponse>("POST", "/categories", request);
      setCategories((current) =>
        [...(current ?? []), category].sort((a, b) => a.name.localeCompare(b.name, "th", { sensitivity: "base" })),
      );
      onChange(category.id);
      closeCreator();
    } catch (error) {
      setDraftError(errorText(error, nameLabels));
      draftRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  const draftErrorId = `${id}-new-error`;

  return (
    <>
      <div className="mt-1.5 flex gap-2">
        <select
          ref={selectRef}
          id={id}
          name="categoryId"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
          disabled={!categories}
          aria-invalid={invalid}
          aria-describedby={errorId}
          className={`${className} mt-0! min-w-0 flex-1`}
        >
          <option value="">{categories ? "ไม่มีหมวดหมู่" : loadFailed ? "โหลดหมวดหมู่ไม่สำเร็จ" : "กำลังโหลด…"}</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            disabled={!categories}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 text-sm hover:bg-primary-soft hover:text-primary disabled:opacity-60"
          >
            <Plus className="size-4" aria-hidden />
            หมวดหมู่ใหม่
          </button>
        )}
      </div>

      {creating && (
        // Not a <form>: it sits inside the Task form, so Enter is handled here.
        <div role="group" aria-label="สร้างหมวดหมู่ใหม่" className="mt-2 rounded-xl border border-border bg-bg p-3">
          <label htmlFor={`${id}-new`} className="text-sm">
            ชื่อหมวดหมู่ใหม่
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <input
              ref={draftRef}
              id={`${id}-new`}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setDraftError(undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void create();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  closeCreator();
                }
              }}
              maxLength={50}
              autoComplete="off"
              placeholder="เช่น งานบ้าน"
              aria-invalid={draftError ? true : undefined}
              aria-describedby={draftError ? draftErrorId : undefined}
              className={`${className} mt-0! min-w-0 flex-1 basis-40`}
            />
            <button
              type="button"
              onClick={() => void create()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-60"
            >
              {busy && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
              สร้าง
            </button>
            <button
              type="button"
              onClick={closeCreator}
              className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-primary-soft hover:text-primary"
            >
              ยกเลิก
            </button>
          </div>
          {draftError && (
            <p id={draftErrorId} role="alert" className="mt-1.5 text-sm text-danger">
              {draftError}
            </p>
          )}
        </div>
      )}
    </>
  );
}
