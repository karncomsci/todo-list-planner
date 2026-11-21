# 03: Sign-in end to end

**What to build:** The Owner signs in with email and password, optionally stays signed in on this device, and signs out. The Owner's account is created on first run from configuration. Every page and every API resource other than sign-in is closed to anyone without a session.

**Repositories:** `planner-api`, `planner-web`, parent folder (API doc, env example).

**Blocked by:** 02 (Web walking skeleton)

**Status:** done

- [x] On start the API creates the Owner from the initial email and password in configuration only when no Owner exists; restarting never creates a second one or overwrites the password (D16, story 2)
- [x] Passwords are stored only as a one-way hash (D18)
- [x] Session resource: sign in, sign out, get current Owner (D14). The session lives in PostgreSQL and travels in an httpOnly cookie (D17)
- [x] With "stay signed in" the session lasts 30 days; without it the cookie is a browser-session cookie (A2, story 3)
- [x] Sign-out deletes the session immediately; the old cookie no longer works (D17, story 4)
- [x] A wrong email or password returns one error that does not reveal which part was wrong; the sign-in page shows it in Thai (story 5)
- [x] Opening any page while signed out lands on the sign-in page, then returns to the requested page after sign-in (story 6)
- [x] A sign-out control is available from the app shell on computer and phone
- [x] API tests cover: sign-in success, sign-in failure, a request without a session is rejected, a session is unusable after sign-out, the Owner is seeded once (T2)
- [x] `docs/api.md` and the web API types file describe the Session resource
