"use client";

import { MotionConfig, motion, useReducedMotion } from "motion/react";

/** Every animation in the app: short and eased (D7: under 0.3 s). */
export const quick = { duration: 0.2, ease: "easeOut" } as const;

/**
 * Motion settings for the signed-in app. When the device asks for reduced
 * motion, every animation ends at once, opacity included (D7, story 63).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <MotionConfig reducedMotion="user" transition={reduce ? { duration: 0 } : quick}>
      {children}
    </MotionConfig>
  );
}

/** A page fading and rising into place when the Owner changes page (story 62). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {children}
    </motion.div>
  );
}
