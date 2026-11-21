# 02: Web walking skeleton

**What to build:** The Next.js front end starts under Docker Compose with the rest of the system and shows the app shell: a left menu on computers, a five-button bottom menu on phones, Thai text, and a light/dark theme switch that is remembered. The page proves the whole request path works by showing the API's health through the front end's proxy (D4).

**Repositories:** `planner-web`, parent folder (Compose).

**Blocked by:** 01 (API walking skeleton)

**Status:** done

- [x] `docker compose up` starts all three parts: database, API, web (D3, story 65)
- [x] Browser requests to `/api/*` on the web origin reach the Go API; the API URL comes from configuration (D4)
- [x] Computer layout has a left menu; phone layout has a bottom menu with Overview, Calendar, Add Task, Life Schedule and More (D10). Items for pages built in later stages are visibly disabled
- [x] Light and dark themes switch from the shell, the choice survives a reload, and the first paint uses the remembered theme without a flash (D8, story 61)
- [ ] App name "ปฏิทินตารางงาน" and the mockup colour set are applied (A7). The name is applied; the colours are a stand-in set because the mockup files are not in the project folder
- [x] A single hand-written file holds the API types, starting with the health and error shapes (D11)
- [x] A toast mechanism exists for success and failure messages (story 64)
- [x] Vitest runs with at least one passing test
- [x] `planner-web/CLAUDE.md` gains the exact commands for running, testing and type-checking
