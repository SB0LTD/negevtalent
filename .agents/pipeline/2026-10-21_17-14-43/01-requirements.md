# Requirements — Negev Talent Admin Panel with RBAC

## Summary

Add a complete, production-ready admin panel to the existing Negev Talent SPA (React 19 + TypeScript + Vite, react-router-dom v7, Firebase Auth + Firestore, Cloud Functions in `functions/`, Firebase Hosting project `negevtalent`). The admin area is **additive**: it lives under `/admin/*` with its own layout (no public Header/Footer), reuses the existing brand design system, is RTL/Hebrew, and does not change the public marketing site or the applicant submission flow.

The panel provides Firebase email/password authentication, a three-tier role-based access control model (superadmin / admin / viewer) enforced in three layers (Firestore rules, Cloud Functions, React UI), applications management (list, search/filter, detail, status workflow with audit trail, CSV export, summary stats), and superadmin-only admin/role management. Roles are carried as **Firebase Auth custom claims**, granted exclusively through secure Cloud Functions; a mirror record is kept in a Firestore `admins` collection for listing and UI reads.

### Context confirmed from the repo
- `src/lib/firebase.ts` exports `app` and `auth`; config from `VITE_FIREBASE_*` env vars (`.env` present, `.env.example` present).
- Routing in `src/App.tsx` uses `<Routes>/<Route>` with `RootLayout` (public Header + Footer); public routes are `/` and `/thank-you`.
- Public submissions write to Firestore `applications` with fields: `name, phone, email, idNum, birthdate, gender` (CRM codes `"7"`=male, `"0"`=female, `"1"`=other), `city, background, motivation, createdAt` (ISO string), `status` (`"new"`). `ApplyWizard.tsx` also POSTs to Make.com via `src/lib/webhook.ts`.
- `firestore.rules`: public `create` on `applications` (validated on `name/phone/email/city`), `read/update/delete` denied; default deny elsewhere.
- Cloud Functions in `functions/` are **plain JavaScript (CommonJS, `main: index.js`)**, `firebase-functions` v6, `firebase-admin` v13, region `europe-west1`, runtime nodejs22; existing `apply` HTTP function must remain untouched.
- Build: `npm run build` (`tsc -b && vite build`); lint: `npm run lint` (eslint 9 flat config); tests: Playwright, projects `desktop`/`mobile`/`tablet` (only Chromium/desktop installed locally), baseURL `https://negev.sb0.tech`, existing specs read `SITE_URL` env override.
- Brand tokens exist in `src/index.css`: `--navy #0B0B5D`, `--blue #214CC9`, `--red #F56345`, `--orange #F79534`, `--lightblue #80A0E9`; font `"Noto Sans Hebrew"`; RTL.

## Assumptions

1. **Role source of truth is Firebase Auth custom claims** (`role: "superadmin" | "admin" | "viewer"`), chosen over a pure Firestore-collection approach because claims are available inside Firestore security rules (`request.auth.token.role`) and can be verified server-side in Cloud Functions, satisfying the "UI must never be the only gate" requirement. A Firestore `admins/{uid}` document mirrors each admin (email, role, who granted, timestamps) so the UI can list admins and Firestore rules can cross-check; the Firestore mirror is written only by Cloud Functions, never by clients.
2. **First-superadmin bootstrap** is done with a one-time Node script (`functions/scripts/bootstrap-admin.*`) run by an operator who has Firebase CLI / service-account credentials, since no admin exists yet to call a protected function. After bootstrap, further role grants go through the callable Cloud Function. The two seed accounts `asaf@sb0.tech` and `mor.k@elevation.ac` are created in Firebase Auth (console or script) with passwords set by the operator; the script grants them `superadmin`.
3. **Status set** is `new | contacted | interview | accepted | rejected` (Hebrew labels: חדש, נוצר קשר, ראיון, התקבל, נדחה). `new` remains the public default and is unchanged.
4. **Gender label mapping** in the admin UI: `"7"→זכר`, `"0"→נקבה`, `"1"→אחר`, with a fallback label for any unexpected value (reusing the corrected CRM codes already in `ApplyWizard`).
5. **Audit trail** is stored as a subcollection `applications/{id}/history/{entryId}` (and/or a top-level `auditLog` collection) recording `{ actorUid, actorEmail, field, from, to, at }`; writes happen through a Cloud Function or rules-guarded admin write so the actor cannot be forged.
6. **Pagination** is client-reasonable: Firestore `orderBy(createdAt desc)` with page size (default 25) and cursor-based "load more"/paging. Search/filter across name/email/phone/city is applied client-side over the loaded set given expected submission volumes; status filter uses a query where feasible. (Design step to finalize client vs. server filtering.)
7. **CSV export** runs client-side over the currently filtered/loaded applications and is available to `admin` and `superadmin` (not `viewer`), with UTF-8 BOM so Hebrew renders in Excel.
8. **Cloud Functions language stays JavaScript (CommonJS)** to match the existing `functions/index.js`; callable functions use `firebase-functions/v2/https` `onCall`, region `europe-west1`. No TypeScript build added to `functions/` unless the design finds it necessary.
9. **Firestore SDK** (`firebase/firestore`) is already a transitive dependency via the `firebase` package; no new npm dependency is required for Firestore/Auth. No new runtime dependency is expected beyond what `firebase` provides.
10. **Tests that require real credentials** (actual login as a seeded user) are guarded/skipped unless env vars (e.g. `ADMIN_TEST_EMAIL`/`ADMIN_TEST_PASSWORD` or a Firebase Auth emulator) are provided; UI/routing/RBAC-gating tests that can run without live auth (unauthenticated redirect, login page render, role-based UI gating via a mockable auth state) run against local `vite preview`.

## Functional Requirements

### FR-1 Admin authentication
- FR-1.1 Provide a login page at `/admin/login` using Firebase Auth email/password (`signInWithEmailAndPassword`).
- FR-1.2 Session persistence uses Firebase Auth local persistence; a returning authenticated admin is not asked to log in again until logout or token expiry.
- FR-1.3 All routes under `/admin/*` (except `/admin/login`) are protected; unauthenticated users are redirected to `/admin/login`, preserving the intended destination for post-login redirect.
- FR-1.4 A logout control is present in the admin layout and signs the user out and returns to `/admin/login`.
- FR-1.5 Login errors (wrong credentials, disabled user, network) surface as clear Hebrew messages; no stack traces or raw Firebase error codes shown to users.
- FR-1.6 A signed-in Firebase user who has **no admin role claim** is treated as non-admin: shown an "access denied" Hebrew message and offered logout; they reach no admin data.

### FR-2 Role-Based Access Control (RBAC)
- FR-2.1 Three roles: `superadmin` (full access incl. managing admins/roles), `admin` (view/edit/manage all applications and change statuses; cannot manage admins), `viewer` (read-only applications).
- FR-2.2 The current user's role is read from the Firebase Auth ID token custom claim `role`; the React app exposes it via an auth/role context.
- FR-2.3 RBAC enforced in **three layers**:
  - (a) **Firestore security rules** gate reads/writes of `applications`, `admins`, and audit data by `request.auth.token.role`.
  - (b) **Cloud Functions** verify the caller's role (via `context.auth.token.role`) before any privileged action (role grant/revoke, seeding, any admin-only write).
  - (c) **React UI** hides/disables controls the current role cannot use (e.g. viewers see no edit/status/export/admin-management controls; admins see no admin-management).
- FR-2.4 Clients can never grant or change their own or others' roles directly; every role mutation goes through a Cloud Function using the admin SDK.

### FR-3 First-admin seeding / bootstrap
- FR-3.1 Provide a documented, repeatable mechanism to grant the first superadmins `asaf@sb0.tech` and `mor.k@elevation.ac`.
- FR-3.2 Provide a one-time bootstrap script (run with operator/service-account credentials) that sets the `superadmin` claim and writes the `admins/{uid}` mirror for those two accounts, given they already exist in Firebase Auth.
- FR-3.3 Provide a callable Cloud Function (superadmin-only) for all subsequent grants, so the bootstrap script is needed only for the very first superadmin.
- FR-3.4 No passwords are hardcoded anywhere; accounts are created in Firebase Auth by the operator; the ADMIN README documents the exact steps (what to run/click).

### FR-4 Applications management UI (core)
- FR-4.1 Dashboard at `/admin` (and e.g. `/admin/applications`) listing all `applications`, newest first by `createdAt`.
- FR-4.2 Sortable, paginated table with columns: name, phone, email, city, gender (CRM code rendered as Hebrew label), createdAt (formatted for he-IL), status (as a Hebrew badge).
- FR-4.3 Search/filter by name/email/phone/city, plus filter by status.
- FR-4.4 Detail view for a single application (`/admin/applications/:id`) showing **all** fields including `idNum`, `birthdate`, `background`, `motivation`.
- FR-4.5 Status workflow: `admin`/`superadmin` can change status among the defined set; the change persists to Firestore and records an audit entry (actor uid/email, from, to, timestamp). `viewer` cannot change status.
- FR-4.6 CSV export of the currently filtered applications, available to `admin`/`superadmin`; Hebrew-safe encoding.
- FR-4.7 Summary stats at the top: total applications, counts per status, recent count (e.g. last 7 days).

### FR-5 Admin management UI (superadmin only)
- FR-5.1 List current admins with email and role.
- FR-5.2 Invite/add a new admin by email with a chosen role (grants the claim; if the Auth user does not exist yet, behavior is defined in design — e.g. pre-provision a pending record or require the account to exist first).
- FR-5.3 Change an existing admin's role.
- FR-5.4 Revoke admin access (clear the role claim and remove/deactivate the `admins` mirror).
- FR-5.5 All operations call superadmin-verified Cloud Functions; a superadmin cannot remove/downgrade their own account in a way that leaves zero superadmins (design to define the guard).

### FR-6 Security rules & data model
- FR-6.1 Update `firestore.rules` so reading/updating `applications` requires an authenticated admin with an appropriate role, while **preserving the existing public `create` rule exactly** (same field validation).
- FR-6.2 `applications` update is allowed only for `admin`/`superadmin`; `read` allowed for any of the three roles; `delete` restricted (design to decide; default deny unless superadmin).
- FR-6.3 Add rules for the `admins` collection and audit data: readable by authenticated admins, writable only via admin SDK / Cloud Functions (clients cannot write role data).
- FR-6.4 Default-deny remains for all other documents.

### FR-7 Admin layout & brand
- FR-7.1 Admin area uses its own layout component (sidebar/topbar nav, logout), **not** the public `RootLayout` Header/Footer.
- FR-7.2 Reuse brand tokens/design system from `src/index.css`; RTL Hebrew; responsive; dates/numbers formatted for he-IL.

## Non-Functional Requirements

- NFR-1 **Build**: `npm run build` (tsc + vite) exits 0 with zero errors.
- NFR-2 **Lint**: `npm run lint` passes.
- NFR-3 **Types**: strong TypeScript throughout; no `any` leaking through public/shared APIs (app code; Cloud Functions remain JS to match existing).
- NFR-4 **Public site untouched**: `/` and `/thank-you`, `ApplyWizard`, webhook, and the public `create` rule behave exactly as before; existing Playwright specs continue to pass.
- NFR-5 **No secrets committed**: use `VITE_FIREBASE_*` env vars and Firebase config as existing code does; `.env` stays gitignored; `.env.example` updated only if new public config keys are needed.
- NFR-6 **Security/least privilege**: clients never hold admin SDK power; all privileged writes are server-verified; rules validate and least-privilege every collection.
- NFR-7 **Performance**: list view paginates to avoid loading unbounded documents at once.
- NFR-8 **Deploy is documented, not forced**: if deploy credentials are unavailable the build/verification must not be blocked; the ADMIN README documents `firebase deploy --only hosting,firestore:rules,functions`.

## Acceptance Criteria

1. Visiting any `/admin/*` route (other than `/admin/login`) while unauthenticated redirects to `/admin/login`.
2. `/admin/login` renders a Hebrew, RTL, brand-styled email/password form.
3. A valid admin login lands on the admin dashboard; logout returns to `/admin/login` and re-protects admin routes.
4. The applications list shows all submissions newest-first, with name/phone/email/city/gender-label/formatted-createdAt/status columns; gender `"7"/"0"/"1"` render as `זכר/נקבה/אחר`.
5. Search filters the list by name/email/phone/city, and a status filter narrows by status.
6. The detail view shows every application field including `idNum`, `birthdate`, `background`, `motivation`.
7. An `admin`/`superadmin` can change an application's status; the new status persists in Firestore and an audit entry records actor, from, to, and timestamp. A `viewer` cannot change status (control hidden/disabled).
8. CSV export produces a Hebrew-correct file of the currently filtered applications for `admin`/`superadmin`; `viewer` has no export control.
9. Summary stats display total, per-status counts, and a recent count.
10. A `superadmin` can list admins, add an admin with a role, change a role, and revoke access — each via a Cloud Function that rejects callers who are not superadmin.
11. UI RBAC gating holds: `viewer` cannot see admin-management or edit/status/export controls; `admin` cannot see admin-management; `superadmin` sees everything.
12. Firestore rules: public `create` on `applications` still succeeds with the original validation; unauthenticated `read/update` of `applications` is denied; `read` requires an admin role; `update` requires `admin`/`superadmin`; `admins`/audit data cannot be written by clients.
13. Cloud Functions reject role-mutation calls from non-superadmin callers and never let a caller escalate their own role.
14. Running the documented bootstrap grants `asaf@sb0.tech` and `mor.k@elevation.ac` the `superadmin` claim and `admins` mirror records, after which they have full admin access.
15. `npm run build` exits 0 and `npm run lint` passes.
16. Playwright admin tests run against local `vite preview` with `SITE_URL=http://localhost:4173` using `--project=desktop` and cover: unauthenticated redirect, login page render, UI RBAC gating for each role, and applications list/detail/status-change happy paths. Tests needing live credentials are guarded/skipped with documented env requirements, and the suite still runs.
17. Existing public-site Playwright specs (form submission, nav-after-submit, gender code `"7"`) still pass unchanged.
18. An ADMIN README documents the RBAC model/roles, first-superadmin bootstrap steps, how to run/deploy functions and rules, and how to run the admin tests.
19. Work is on a feature branch with orderly commits; the working tree builds and the public site is unaffected.

## Out of Scope

- Changing the public submission flow, `ApplyWizard`, the Make.com webhook, or the existing `apply` HTTP function.
- Changing public routes (`/`, `/thank-you`), the public Header/Footer, or marketing content.
- Self-service admin signup/registration (admins are provisioned by superadmins/bootstrap only).
- Password reset / email-verification flows beyond what Firebase Auth provides out of the box (may be noted for future work).
- Editing applicant PII fields other than `status` (no free-form editing of name/email/etc. unless design justifies it; core requirement is status workflow).
- Migrating Cloud Functions to TypeScript or restructuring the public site's build.
- Multi-language admin UI (admin UI is Hebrew/RTL only).
- Analytics dashboards beyond the specified summary stats.
