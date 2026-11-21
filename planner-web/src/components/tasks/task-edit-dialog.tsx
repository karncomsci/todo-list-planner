"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { Task } from "@/lib/api/types";
import { TaskForm } from "./task-form";

type Props = {
  /** The Task being edited; null keeps the dialog closed. */
  task: Task | null;
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted: (task: Task) => void;
};

/**
 * Edits or deletes a saved Task in a modal dialog (stories 15, 16). The native
 * <dialog> traps focus and returns focus to what opened it. The form slides in,
 * and slides out before the dialog really closes (D7).
 */
export function TaskEditDialog({ task, onClose, onSaved, onDeleted }: Props) {
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
      aria-labelledby="task-edit-title"
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
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="task-edit-title" className="text-lg font-semibold">
                แก้ไขงาน
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="ปิด"
                className="rounded-lg p-1.5 text-muted hover:bg-primary-soft hover:text-primary"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {/* A fresh form per Task, so its values start from that Task. */}
            <TaskForm
              key={task.id}
              task={task}
              onSaved={(saved) => {
                onSaved(saved);
                onClose();
              }}
              onDeleted={(deleted) => {
                onDeleted(deleted);
                onClose();
              }}
              onCancel={onClose}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}
