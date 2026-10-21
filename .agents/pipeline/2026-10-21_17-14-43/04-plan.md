# Implementation Plan — Negev Talent Admin Panel with RBAC

Derived from `02-design.md` (approved). Build command: `npm run build` (runs `tsc -b && vite build`). Lint: `npm run lint`. Tests: Playwright (`npx playwright test ... --project=desktop`). Functions are CommonJS JS in `functions/`. All items keep the tree buildable. The public form, `functions/index.js` `exports.apply`, `ApplyWizard.tsx`, `webhook.ts`, and `src/main.tsx` are NOT modified.

## Group A — Shared client libraries (pure + data access)

- [ ] 1. Add pure role helpers in `src/lib/roles.ts`.
      Export `type Role = "superadmin" | "admin" | "viewer"`, `ROLE_RANK` record, and predicates `canManageAdmins`, `canEditApplications`, `canExport`, `roleLabelHe`. No React/firebase imports (Layer-0 pure). Use `verbatimModuleSyntax`-safe `import type` if any types are imported.
      Files: src/lib/roles.ts
      Verify: `npm run build` compiles with 0 errors.

- [ ] 2. Add formatting/CSV helpers in `src/lib/format.ts`.
      Export `formatDateHe(iso: string)`, `formatDateTimeHe(iso: string)` via `Intl.DateTimeFormat("he-IL", …)` (both accept ISO-8601 strings only), `toCsv(rows, columns)` producing a UTF-8-BOM string with proper escaping, and `downloadCsv(filename, content)`. Shared missing-value fallback `"—"` for non-gender fields.
      Files: src/lib/format.ts
      Verify: `npm run build` compiles with 0 errors.

- [ ] 3. Extend `src/lib/firebase.ts` additively.
      Add `export const db = getFirestore(app)` and `export const functions = getFunctions(app, "europe-west1")`. Do NOT add `setPersistence`; leave `export const app` and `export const auth = getAuth(app)` exactly as-is (SDK default `browserLocalPersistence` satisfies FR-1.2).
      Files: src/lib/firebase.ts
      Verify: `npm run build` compiles with 0 errors; `ApplyWizard` still imports only `app` unchanged.

- [ ] 4. Add Firestore data access and models in `src/lib/applications.ts`.
      Export `interface Application` (`name/phone/email/city/createdAt/status` required; `idNum?/birthdate?/gender?/age?/background?/motivation?` optional; plus `id`), `ApplicationStatus` union (`new|contacted|interview|accepted|rejected`), status label/order maps, `genderLabelHe(code?: string)` (`"7"→זכר`, `"0"→נקבה`, `"1"→אחר`, else `"לא צוין"`), `fetchApplicationsPage(...)` (cursor paginated via `startAfter(lastDoc)`, `orderBy("createdAt","desc")`, optional `where("status","==",…)`, `limit(25)`), `fetchApplication(id)`, and `subscribeApplicationHistory(id)` which converts each history `at` via `at?.toDate().toISOString() ?? null` before formatting (pending null renders `"שומר…"`/`"—"`). Use `import type` for type-only imports.
      Files: src/lib/applications.ts
      Verify: `npm run build` compiles with 0 errors.

- [ ] 5. Add callable wrappers in `src/lib/adminApi.ts`.
      Export typed `grantRole(email, role)`, `revokeAdmin(uid)`, `listAdmins()`, `setApplicationStatus(appId, status)` over `httpsCallable(functions, …)`; map `FunctionsError` codes to the Hebrew messages specified in the design's Error Handling section.
      Files: src/lib/adminApi.ts
      Verify: `npm run build` compiles with 0 errors.

## Group B — Auth context and guards

- [ ] 6. Add the auth context object + hooks in `src/admin/useAuth.ts` and the provider in `src/admin/AuthContext.tsx`.
      `useAuth.ts` (non-component module) exports the `AuthContext` React context object, `useAuth()` hook, and `useRole()` convenience hook (predicates from `roles.ts` bound to current role). `AuthContext.tsx` exports only the `AuthProvider` component: subscribes via `onAuthStateChanged`, on sign-in calls `user.getIdToken(true)` once then `getIdTokenResult()` to read `claims.role`; context value `{ user, role, loading, logout() }`; `loading` true until first auth+claims resolve. DEV+flag override contract: when `import.meta.env.DEV && import.meta.env.VITE_ADMIN_TEST_MODE === "1"`, short-circuit to a fake `{user, role}` from `window.__ADMIN_TEST_ROLE__` as the FIRST statement, creating no `onAuthStateChanged` subscription.
      Files: src/admin/useAuth.ts, src/admin/AuthContext.tsx
      Verify: `npm run build` compiles with 0 errors; `npm run lint` reports zero `react-refresh/only-export-components` warnings.

- [ ] 7. Add route guards `src/admin/RequireAuth.tsx` and `src/admin/RequireRole.tsx`.
      `RequireAuth`: while `loading` render spinner; no `user` → `<Navigate to="/admin/login" state={{from: location}} replace />` (uses `useLocation`); `user` but `role === null` → Hebrew access-denied screen with logout (FR-1.6); else `<Outlet/>`. `RequireRole`: `<RequireRole allow={[...]} redirect="/admin">` component gating routes and inline controls. Each `.tsx` exports only components (hooks live in `useAuth.ts`).
      Files: src/admin/RequireAuth.tsx, src/admin/RequireRole.tsx
      Verify: `npm run build` compiles with 0 errors; `npm run lint` clean.

## Group C — Admin UI (layout, pages, styles) + routing

- [ ] 8. Add `src/admin/admin.css` and `src/admin/AdminLayout.tsx`.
      `admin.css`: one stylesheet with `.admin-*`/`.adm-*` prefixed classes referencing global brand tokens (`var(--navy)` etc. from `src/index.css`; do NOT edit `src/index.css`). `AdminLayout`: brand topbar (logo, user email, role badge, logout) + side nav (לוח בקרה / מועמדים / ניהול מנהלים), renders `<Outlet/>`, no public Header/Footer. "ניהול מנהלים" item rendered only when `canManageAdmins(role)`.
      Files: src/admin/admin.css, src/admin/AdminLayout.tsx
      Verify: `npm run build` compiles with 0 errors.

- [ ] 9. Add `src/admin/LoginPage.tsx`.
      `/admin/login` email/password form, `signInWithEmailAndPassword`, redirect to `location.state.from?.pathname ?? "/admin"` on success, redirect away if already authed, Hebrew error mapping per design.
      Files: src/admin/LoginPage.tsx
      Verify: `npm run build` compiles with 0 errors.

- [ ] 10. Add `src/admin/DashboardPage.tsx`.
      `/admin`: summary stat cards (total, per-status counts, last-7-days) from `getCountFromServer` aggregate queries + a recent-applications preview linking into the list. In DEV+flag mode, read in-memory fixtures instead of Firestore.
      Files: src/admin/DashboardPage.tsx
      Verify: `npm run build` compiles with 0 errors.

- [ ] 11. Add `src/admin/ApplicationsPage.tsx`.
      `/admin/applications`: paginated ("load more" via cursor) table; server `where("status",…)` filter + `orderBy(createdAt desc)`; client-side free-text search (name/email/phone/city) over loaded set; client-side column sort; CSV export (disabled at 0 rows, gender column via `genderLabelHe`); edit/export controls gated by role. In DEV+flag mode, filter in-memory fixtures client-side (no composite-index dependency).
      Files: src/admin/ApplicationsPage.tsx
      Verify: `npm run build` compiles with 0 errors.

- [ ] 12. Add `src/admin/ApplicationDetailPage.tsx`.
      `/admin/applications/:id`: all fields (missing → `"—"`, gender via `genderLabelHe`), status control calling `setApplicationStatus` (optimistic with revert on failure), and audit history via `subscribeApplicationHistory` (pending `at` → `"שומר…"`). Unknown id → "המועמד לא נמצא" empty state.
      Files: src/admin/ApplicationDetailPage.tsx
      Verify: `npm run build` compiles with 0 errors.

- [ ] 13. Add `src/admin/AdminsPage.tsx`.
      `/admin/admins` (superadmin-only): list admins via `listAdmins()`, grant role form (email + role), revoke buttons; map guard errors (last superadmin / self) to Hebrew. In DEV+flag mode, operate on in-memory fixtures.
      Files: src/admin/AdminsPage.tsx
      Verify: `npm run build` compiles with 0 errors.

- [ ] 14. Wire routes and provider in `src/App.tsx`.
      Wrap `<Routes>` with `<AuthProvider>`; add `admin/login`, `admin` (under `RequireAuth` → `AdminLayout` with index Dashboard, `applications`, `applications/:id`, and superadmin-gated `admins`). Use `@/admin/*` alias imports. Leave `src/main.tsx` unchanged. Keep `RootLayout` wrapping public routes only.
      Files: src/App.tsx
      Verify: `npm run build` compiles with 0 errors; `npm run lint` clean.

## Group D — Backend (Cloud Functions, rules, indexes, config)

- [ ] 15. Append callables to `functions/index.js`; do NOT modify `exports.apply`.
      Add `firebase-admin/auth` import, `FieldValue`, and helpers `assertSuperadmin/assertEditor/assertAdmin(request)` reading `request.auth?.token?.role`. Add `onCall` (region `europe-west1`) `setApplicationStatus` (editor; transactional status update + `history` append with `serverTimestamp`), `listAdmins` (superadmin; non-revoked docs), `grantRole` (superadmin; `getUserByEmail` → `setCustomUserClaims(uid,{role})` → upsert `admins/{uid}` with `revoked:false`; self-guard), `revokeAdmin` (superadmin; last-superadmin guard via `where("role","==","superadmin").where("revoked","==",false)`; self-guard; clear claim + `revoked:true`). Never trust client-sent role.
      Files: functions/index.js
      Verify: `cd functions && node -e "require('./index.js')"` loads without throwing (admin SDK init is lazy); `npx eslint functions/index.js` if lint covers it, else manual review.

- [ ] 16. Add the idempotent bootstrap script `functions/scripts/bootstrap-admins.js`.
      Standalone `firebase-admin` script using ADC: seed emails `asaf@sb0.tech`, `mor.k@elevation.ac`; `getUserByEmail` → `setCustomUserClaims(uid,{role:"superadmin"})` → upsert `admins/{uid}` with `revoked:false`, `grantedByEmail:"bootstrap"`; print summary. Run via `node scripts/bootstrap-admins.js` from `functions/`.
      Files: functions/scripts/bootstrap-admins.js
      Verify: `cd functions && node -c scripts/bootstrap-admins.js` (syntax check) passes.

- [ ] 17. Extend `firestore.rules`, add `firestore.indexes.json`, and wire `firebase.json`.
      Rules: add `role()`/`isAdmin()` helpers; preserve the public `applications` create block verbatim; `allow read: if isAdmin()`, `allow update, delete: if false`; `history` read `isAdmin()`, write false; `admins` read `isAdmin()`, write false; keep default deny. `firestore.indexes.json`: composite index `applications` (`status ASC, createdAt DESC`). `firebase.json`: add `"indexes": "firestore.indexes.json"` to the `firestore` block.
      Files: firestore.rules, firestore.indexes.json, firebase.json
      Verify: `npx firebase deploy --only firestore:rules --dry-run` if available, else JSON validity via `node -e "require('./firestore.indexes.json')"` and manual rule review; the public-create Playwright suite still passes (item 20).

## Group E — Tests, test-mode plumbing, docs

- [ ] 18. Add DEV-only test-mode env flag and plumbing.
      Add `VITE_ADMIN_TEST_MODE=` (empty, with DEV-only comment) to `.env.example`. Ensure `AuthContext`, `applications.ts`, and `adminApi.ts` honor the double-gated (`import.meta.env.DEV && VITE_ADMIN_TEST_MODE === "1"`) in-memory fixture path as their FIRST statement (coordinated with items 4,5,6).
      Files: .env.example (and verification that the guards exist in src/lib/applications.ts, src/lib/adminApi.ts, src/admin/AuthContext.tsx)
      Verify: `npm run build` compiles with 0 errors; production build tree-shakes the branch (DEV=false).

- [ ] 19. Add unit spec `tests/unit.spec.ts` (runtime harness).
      Playwright `test()` with no page, importing pure helpers: `roles.ts` predicates, `genderLabelHe` (incl. undefined → `"לא צוין"`), status maps, `toCsv` BOM+escaping, `formatDateHe`.
      Files: tests/unit.spec.ts
      Verify: `npx playwright test tests/unit.spec.ts --project=desktop` passes.

- [ ] 20. Add admin integration specs.
      `tests/admin-routing.spec.ts`: against `vite preview` build — unauthenticated `/admin` redirects to `/admin/login`; login page renders Hebrew form. `tests/admin-rbac.spec.ts`: against `npm run dev` (DEV+flag) with `window.__ADMIN_TEST_ROLE__` set to viewer/admin/superadmin — assert nav/control visibility per role; list/detail/status happy path over in-memory fixtures; status filter over fixtures (no index dependency). Optional `tests/admin-live.spec.ts` guarded by `test.skip` when `ADMIN_TEST_EMAIL`/`ADMIN_TEST_PASSWORD` absent.
      Files: tests/admin-routing.spec.ts, tests/admin-rbac.spec.ts, tests/admin-live.spec.ts
      Verify: build+preview then `SITE_URL=http://localhost:4173 npx playwright test tests/admin-routing.spec.ts --project=desktop` passes; dev server + flag then `SITE_URL=http://localhost:5173 npx playwright test tests/admin-rbac.spec.ts --project=desktop` passes.

- [ ] 21. Add `ADMIN_README.md`.
      Document: bootstrap procedure (ADC/service-account, exact commands), deploy steps (`firebase deploy --only firestore:rules,firestore:indexes,functions,hosting`), composite-index dependency for live status filtering, test commands (preview vs dev+flag, `--project=desktop`), DEV-only test flag warning, where submissions are viewed (`/admin/applications`).
      Files: ADMIN_README.md
      Verify: links/commands reviewed; no build impact.

## Final verification

- [ ] 22. Full-suite verification.
      Run `npm run build` (0 errors), `npm run lint` (0 errors, clean warnings), the public suite (`SITE_URL` or default) to confirm no regression (AC-17), and the new admin specs. Confirm `src/main.tsx`, `ApplyWizard.tsx`, `webhook.ts`, and `exports.apply` are unchanged.
      Verify: all above pass.
