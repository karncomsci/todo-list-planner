"use client";

import { useReducedMotion } from "motion/react";
import { quick } from "@/components/motion";

// Shared settings for every Recharts chart (Overview and Reports). Colours are
// the theme's CSS variables, so both themes need nothing more (D5, D8).

export const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  color: "var(--text)",
};

export const tooltipItemStyle = { color: "var(--text)" };

/** Long names end in "…" beside the bars; the tooltip shows them whole. */
export function shortName(name: string): string {
  const chars = Array.from(name);
  return chars.length > 14 ? `${chars.slice(0, 13).join("")}…` : name;
}

/** Chart animation under 0.3 s, and none when the device asks for reduced motion (D7). */
export function useChartAnimation() {
  const reduce = useReducedMotion() ?? false;
  return {
    isAnimationActive: !reduce,
    animationDuration: quick.duration * 1000,
    animationEasing: "ease-out",
  } as const;
}
