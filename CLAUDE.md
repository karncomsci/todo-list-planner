# planner-web

Next.js front end for the Task Calendar Planner. Read the parent `../CLAUDE.md` first; its working rules apply here.

@AGENTS.md

## Stack (D5–D8)

Next.js 16 App Router with Cache Components on, TypeScript, Tailwind CSS 4, lucide-react icons, sonner toasts. FullCalendar 6 (standard bundle, MIT plugins only; version 7 rebuilt its packages and has no separate day-grid plugin, so stay on 6). Motion (`motion/react`).

## Layout

- `src/proxy.ts`: forwards `/api/*` to the Go API at `API_URL`, read at run time, and sends visitors without a session cookie to `/sign-in?next=…`. It checks only that the cookie exists; the API validates it, and `api()` in the client sends the browser to sign-in on any `unauthorized` answer.
- `src/lib/api/messages.ts`: Thai text for every error code, and Thai names of request fields. Add each new code and field here.
- `src/lib/dates.ts`: every BE/CE conversion and Thai date format (D9). `src/components/date-picker.tsx` is the one date field, a calendar the Owner picks from (react-day-picker); use it for every date. `src/lib/tasks.ts`: Thai labels and colours for Status and Priority. `src/lib/calendar.ts`: pure Calendar logic (Tasks to FullCalendar events; the phone grid, day lists and dots). `src/components/calendar/` renders it in the browser only: FullCalendar from 48rem up (`computer-calendar.tsx`, one component for every View, with the View switcher), the compact phone calendar below, the same width at which the menus swap. Calendar colours live in `globals.css` as `task-*` classes.
- `src/app/(app)/`: pages inside the app shell (left menu on computers, bottom menu on phones). Pages without the shell, such as sign-in, sit outside this group.
- `src/components/navigation.ts`: the menu. Set a page's `ready` to true in the ticket that builds it.
- `src/lib/api/types.ts`: every API type, by hand (D11). `src/lib/api/client.ts`: the only place that calls `fetch`.
- `src/app/globals.css`: the colour set as CSS variables for both themes. Components use the token classes (`bg-surface`, `text-muted`, `border-border`), so a theme needs no per-component styles.

## Conventions

- **The browser talks only to this app** (D4). The session cookie stays httpOnly and is never read by client code.
- **Server Components pass rendered elements to Client Components**, never component functions such as icons.
- **BE years exist only here** (D9). Convert at the edges: show and accept BE in the UI, send and receive CE. Weeks start on Monday; the time zone is Asia/Bangkok.
- **The API is the authority on business rules**: Status, Overdue, and all summary numbers come from API responses (D21, D23, D32). The web displays them.
- **UI text is Thai**, using the glossary's Thai terms. API errors carry an English message; choose the Thai text from the error's `code` and `field`.
- **Feedback on save** goes through `toast` from sonner (story 64).
- **Animations** are under 0.3 s and turn off under `prefers-reduced-motion` (D7). `src/components/motion.tsx` holds the shared timing and the provider that zeroes every animation when the device asks for reduced motion; animate with Motion inside it rather than with CSS transitions. Page transitions live in `src/app/(app)/template.tsx`. The calendar grid itself has no added animation.
- **Theme**: `data-theme` on `<html>`, set before first paint by the inline script in the root layout and remembered in `localStorage` (D8).

## Commands

- Develop: `docker compose up -d api` in the parent folder, then `npm run dev` here (uses `.env.development`)
- Check: `npm run typecheck && npm run lint && npm test`
- Production build: `npm run build`
- Whole system: `docker compose up -d --build` in the parent folder, then open `http://localhost:3000`

## Tests (T3)

Unit tests (Vitest, `src/**/*.test.ts`) cover pure logic only: the API client, BE conversion and formatting, and turning Tasks into calendar events. No automated screen tests in this release.
