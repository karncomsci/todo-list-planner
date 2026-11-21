/** Name of the httpOnly session cookie the API sets. Only its presence is checked here. */
export const SESSION_COOKIE = "planner_session";

/** The sign-in page URL that returns to `returnTo` afterwards. */
export function signInPath(returnTo: string): string {
  const next = safeReturnPath(returnTo);
  return next === "/" ? "/sign-in" : `/sign-in?next=${encodeURIComponent(next)}`;
}

/**
 * The page to open after sign-in. Only same-origin paths are accepted, so a
 * crafted link cannot send the Owner to another site.
 */
export function safeReturnPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  if (next === "/sign-in" || next.startsWith("/sign-in?") || next.startsWith("/api/")) {
    return "/";
  }
  return next;
}
