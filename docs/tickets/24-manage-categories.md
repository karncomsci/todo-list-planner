# 24: Rename and delete Categories

**What to build:** Settings gains a Categories card to add, rename and delete Categories; deleting one leaves its Tasks uncategorised (D24, stories 55, 56).

**Repositories:** `planner-api`, `planner-web`, root (`docs/api.md`).

**Blocked by:** 23 (Settings page and password change)

**Status:** not started

- [ ] `PUT /api/categories/{id}` renames, with the same name rules as create (`required`, `too_long`, `duplicate`; renaming to its own name in another letter case is allowed); 404 for an unknown or another Owner's Category
- [ ] `DELETE /api/categories/{id}`: 204; its Tasks remain with category null; 404 as above
- [ ] API tests: rename, duplicate, delete keeps Tasks uncategorised, Owner scoping (T2)
- [ ] `docs/api.md` and the web API types file are updated in this ticket
- [ ] The card lists Categories with rename in place and delete with a confirmation saying its Tasks stay, uncategorised; an add field at the bottom; toasts on save and failure
- [ ] API tests and web checks pass
