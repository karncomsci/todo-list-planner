"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { quick } from "@/components/motion";

/**
 * A number that counts up from its last value when it changes, in under 0.3 s,
 * and simply appears when the device asks for reduced motion (D7, story 63).
 */
export function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = from.current;
    from.current = value;
    const controls = animate(start, value, {
      ...quick,
      duration: reduce ? 0 : quick.duration,
      onUpdate: (latest) => setShown(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <span className="tabular-nums">{shown.toLocaleString("th-TH")}</span>;
}
