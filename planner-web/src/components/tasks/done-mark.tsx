"use client";

import { motion } from "motion/react";
import { justTicked } from "./tick-done";

type Props = {
  taskId: number;
  className: string;
  title?: string;
  children: React.ReactNode;
};

/** The filled tick of a done Task. It pops in when the Owner has just ticked it (D7, story 62). */
export function DoneMark({ taskId, className, title, children }: Props) {
  return (
    <motion.span
      className={className}
      title={title}
      initial={justTicked(taskId) ? { scale: 0.4, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
    >
      {children}
    </motion.span>
  );
}
