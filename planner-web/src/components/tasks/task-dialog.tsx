"use client";

import { Pencil, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import type { Task } from "@/lib/api/types";
import { TaskDetails } from "./task-details";
import { TaskForm } from "./task-form";

type Props = {
  /** The Task opened; null keeps the dialog closed. */
  task: Task | null;
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted: (task: Task) => void;
};

/**
 * Opens a saved Task in a modal dialog: first read-only for review, then
 * "แก้ไข" turns it into the form that edits or deletes it (stories 15, 16, 30).
 * The native <dialog> traps focus and returns focus to what opened it. The
 * content slides in, and slides out before the dialog really closes (D7).
 */
export function TaskDialog({ task, onClose, onSaved, onDeleted }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (task && !dialog.open) dialog.showModal();
  }, [task]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Escape closes through the same path as the buttons, so it slides out too.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="task-dialog-title"
      className="m-auto w-[min(42rem,calc(100%-2rem))] overflow-visible bg-transparent p-0 text-text backdrop:bg-black/50"
    >
      <AnimatePresence onExitComplete={() => dialogRef.current?.close()}>
        {task && (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl sm:p-6"
          >
            {/* Keyed per Task, so each one opens for review and its form starts from its values. */}
            <TaskPanel key={task.id} task={task} onClose={onClose} onSaved={onSaved} onDeleted={onDeleted} />
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}

function TaskPanel({ task, onClose, onSaved, onDeleted }: Props & { task: Task }) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 id="task-dialog-title" className="min-w-0 text-lg font-semibold break-words">
          {editing ? "แก้ไขงาน" : task.name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-primary-soft hover:text-primary"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {editing ? (
        <TaskForm
          task={task}
          onSaved={(saved) => {
            onSaved(saved);
            onClose();
          }}
          onDeleted={(deleted) => {
            onDeleted(deleted);
            onClose();
          }}
          // Cancel goes back to the review, not out of the dialog.
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <TaskDetails task={task} />
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className={secondaryButtonClass}>
              ปิด
            </button>
            <button type="button" onClick={() => setEditing(true)} className={primaryButtonClass} autoFocus>
              <Pencil className="size-4" aria-hidden />
              แก้ไข
            </button>
          </div>
        </>
      )}
    </>
  );
}
