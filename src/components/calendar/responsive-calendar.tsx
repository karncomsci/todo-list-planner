"use client";

import { useSyncExternalStore } from "react";
import ComputerCalendar from "./computer-calendar";
import PhoneCalendar from "./phone-calendar";

// The same width at which the app shell swaps its left menu for the bottom menu.
const computerQuery = "(min-width: 48rem)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(computerQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** The day, week and month Views on computers, the compact calendar on phones (D10). Browser only. */
export default function ResponsiveCalendar() {
  const computer = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(computerQuery).matches,
    () => true,
  );
  return computer ? <ComputerCalendar /> : <PhoneCalendar />;
}
