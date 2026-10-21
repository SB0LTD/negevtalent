# Technical Design — Negev Talent Admin Panel with RBAC

## Overview

This design adds an additive admin panel under `/admin/*` to the existing React 19 + TypeScript + Vite SPA. It introduces Firebase Auth email/password login, a three-role RBAC model (`superadmin` / `admin` / `viewer`) carried as **Firebase Auth custom claims** and mirrored in a Firestore `admins/{uid}` collection, an applications-management workspace (list, filter, detail, status workflow with audit trail, CSV export, summary stats), and a superadmin-only admin-management screen. RBAC is enforced in three layers: Firestore security rules (`request.auth.token.role`), Cloud Functions `onCall` handlers (verifying `request.auth.token.role` with the admin SDK), and the React UI (a role context that hides/disables controls).

The stack is locked to what the repo already uses: React 19, react-router-dom v7, the `firebase` v11 web SDK (`firebase/auth`, `firebase/firestore`, `firebase/functions`), framer-motion v12, plain CSS reusing `src/index.css` brand tokens, Cloud Functions in CommonJS JavaScript (firebase-functions v6, firebase-admin v13, region `europe-west1`, nodejs22), and Playwright for tests. No new runtime npm dependencies are added — `firebase/firestore` and `firebase/functions` are already provided by the installed `firebase` package.

Per the project development hierarchy, this is **application-specific product code** (admin UI, business workflows, RBAC for one product) and therefore belongs in the project, not in a shared package. No `zpm`/`sig` layer changes are involved; this is a web app, not a Sig project.

## Technology & Approach Decisions (locked)

**Role source of truth: Firebase Auth custom claims, mirrored in Firestore.** Two approaches were viable: (A) a pure Firestore `admins` collection read by rules via `get()`, or (B) custom claims on the ID token. We choose **(B) custom claims as the authority for per-request access decisions**, with a Firestore `admins/{uid}` mirror for listing/UI. Rationale: claims are embedded in `request.auth.token` so Firestore rules can check `request.auth.token.role` with **zero extra document reads** (a `get()`-based rule costs a billed read and is slower), and the same token is verified server-side in callable functions.

The split of authority is made precise to avoid self-contradiction (see finding 3): for **a single request's access decision** (rules and callables deciding whether *this* caller may do *this* thing), the **claim on the verified token is authoritative**; the mirror is never consulted for that. For **enumerating the admin set** (the superadmin count guard and the admin-management list), the **`admins` collection is authoritative** — justified because `grantRole`/`revokeAdmin` always write the claim and the mirror in the **same ordered, idempotent server operation** (claim first, then mirror; on retry both re-converge), so the collection is a complete, current record of exactly who holds a role. The mirror is written **exclusively by Cloud Functions via the admin SDK**, never by clients.

**Claim propagation (concrete trigger — finding 11).** Custom claims only refresh when the ID token refreshes. To make role changes visible promptly on the affected user's session without a vague trigger: `AuthContext` calls `user.getIdToken(true)` **once on initial sign-in and once on provider mount** for an already-signed-in user, then reads claims via `getIdTokenResult()`. Beyond that forced refresh, Firebase automatically refreshes the ID token roughly hourly, so a role change surfaces within ≤1h, or immediately on the user's next full login. We do **not** implement `visibilitychange`/focus-based refresh or forced session revocation in v1 (noted in Out of Scope / future work). FR-1.2 (returning admin not re-prompted) is satisfied by `getAuth`'s default `browserLocalPersistence` — **no explicit `setPersistence` call is made** (round-2 finding 2); the one-time `getIdToken(true)` does not sign the user out, it only refreshes the token in place.

**Cloud Functions language: CommonJS JavaScript**, matching `functions/index.js`. Callable functions use `onCall` from `firebase-functions/v2/https`, region `europe-west1`. The repo runs `firebase-functions` v6, whose v2 `onCall` handler receives a **single `request` object** exposing `request.auth` and `request.auth.token` (see finding 9 — this design uses `request.auth.token.role`, which is the correct v6/v2 signature; the requirements' `context.auth.token.role` is the older v1 wording and is intentionally not followed). We do not introduce a TypeScript build in `functions/`.

**Functions SDK on the client: `firebase/functions` (`httpsCallable`)**, pointed at region `europe-west1` via `getFunctions(app, "europe-west1")`.

## File-Level Plan

### New client library files (`src/lib/`)
- `src/lib/firebase.ts` — **extend** (not replace): add `export const db = getFirestore(app)` and `export const functions = getFunctions(app, "europe-west1")`. **Auth persistence (round-2 finding 2):** do **not** add a bare `setPersistence(...)` call. `getAuth(app)` already defaults to `browserLocalPersistence` in the web SDK, so `auth` as currently exported already satisfies FR-1.2 with no new code, and `setPersistence` returns a `Promise<void>` whose un-awaited top-level call would be a floating promise that races with `onAuthStateChanged`/`getIdToken(true)` in `AuthContext`. The existing `export const auth = getAuth(app)` line is therefore **left exactly as-is** (local persistence guaranteed by the SDK default); no `setPersistence` and no switch to `initializeAuth` is introduced (keeping `auth`'s signature identical so `ApplyWizard`, which imports only `app`, is provably unaffected). Existing `app` and `auth` exports are preserved exactly so `ApplyWizard`'s `getFirestore(app)` usage is unaffected.
- `src/lib/roles.ts` — role types and helpers. `export type Role = "superadmin" | "admin" | "viewer"`. Pure predicate helpers: `canManageAdmins(role)`, `canEditApplications(role)`, `canExport(role)`, `roleLabelHe(role)`, `ROLE_RANK` record for ordering/guards. No React, no firebase imports (unit-testable, Layer-0-style purity).
- `src/lib/applications.ts` — Firestore data access for the `applications` collection and typed models. Exports `interface Application` (all document fields + `id`), `ApplicationStatus` union, status label/order maps, `genderLabelHe(code: string | undefined)`, `fetchApplicationsPage(...)` (cursor paginated, `orderBy(createdAt desc)`), `fetchApplication(id)`, `subscribeApplicationHistory(id)`. Uses `import type` for type-only imports (required by `verbatimModuleSyntax`). **History timestamp handling (round-2 finding 10):** `subscribeApplicationHistory` maps each `history` doc to a view model whose `at` is converted from the Firestore `Timestamp` to an ISO string via `data.at?.toDate().toISOString() ?? null` **before** it reaches `formatDateTimeHe` (which only accepts an ISO string). Because the entry is written with `serverTimestamp()`, `at` is transiently `null` on the local snapshot immediately after a write (before the server round-trip resolves); the view renders a `null`/pending `at` as `"שומר…"` (or `"—"`), and only formats via `formatDateTimeHe` once a non-null ISO string exists. **`Application` field optionality (finding 1):** `name`, `phone`, `email`, `city`, `createdAt`, `status` are required (present in every write path — client and the `apply` HTTP function); `idNum`, `birthdate`, `gender`, `age` are typed **optional** (`idNum?: string` etc.) because the legacy/HTTP-created docs omit them entirely (see Data Model). `background` and `motivation` are **always written as strings by both paths** (the client `ApplyWizard` seeds them in initial `FormData` state, and the `apply` HTTP function writes `background: background || ""` / `motivation: motivation || ""`), so both are effectively always present — but **the current `ApplyWizard` has no `motivation` input**, so `motivation` is effectively always `""` (verified: it exists only in initial state and no control sets it). They are typed optional defensively, and the UI renders an empty string the same as missing (`"—"`). Practical consequence for FR-4.4/AC-6: the detail view's `motivation` field will render `"—"` for essentially every current record until a motivation input is added to the public form (out of scope here).
- `src/lib/adminApi.ts` — thin typed wrappers over the callable Cloud Functions: `grantRole(email, role)`, `revokeAdmin(uid)`, `listAdmins()`, `setApplicationStatus(appId, status)`. Each wraps `httpsCallable` with request/response TypeScript interfaces; maps Firebase `FunctionsError` codes to Hebrew messages.
- `src/lib/format.ts` — `formatDateHe(iso)` and `formatDateTimeHe(iso)` using `Intl.DateTimeFormat("he-IL", …)`; both take an **ISO-8601 string** input (any Firestore `Timestamp` must be converted by the caller via `ts?.toDate().toISOString()` before being passed in — see finding 10). `toCsv(rows, columns)` produces a UTF-8-BOM CSV string and `downloadCsv(filename, content)` triggers the download. **Fallback rule (round-2 finding 4):** for **non-gender** fields, missing/undefined/empty values render as the shared `"—"` in both the UI and CSV. The **gender column is special**: table, detail, and CSV all render gender via `genderLabelHe(code)`, so an absent/empty/unknown gender is `"לא צוין"` **everywhere, including CSV** — the CSV builds its gender cell by calling `genderLabelHe`, never by treating the raw field as a generic missing value. This removes the `—` vs `לא צוין` ambiguity for legacy (HTTP-path) records that have no `gender`.

### New auth/context
- `src/admin/AuthContext.tsx` — React **provider component only**. Provides context value `{ user: User | null, role: Role | null, loading: boolean, logout() }`. Subscribes with `onAuthStateChanged`; on a signed-in user, calls `user.getIdToken(true)` once then `user.getIdTokenResult()` to read `claims.role`. Exposes the context object. `loading` is true until the first auth state + claims resolve (prevents redirect flicker). **To keep lint clean (finding 8), the `useAuth()` hook does NOT live here** — it is exported from `src/admin/useAuth.ts` (see below), so this file exports only a component (satisfies `react-refresh/only-export-components`).
- `src/admin/useAuth.ts` — exports the `AuthContext` React context object and the `useAuth()` hook (non-component module). Importing the context object here (rather than in the `.tsx`) means both the provider file and the role file export cleanly.
- `src/admin/RequireAuth.tsx` — route guard component. While `loading`, render a spinner. If no `user`, `<Navigate to="/admin/login" state={{ from: location }} replace />` (uses `useLocation` — valid because it is rendered as a route element inside `<Routes>`). If `user` but `role === null`, render an "access denied / אין לך הרשאת גישה" screen with a logout button (FR-1.6). Otherwise render `<Outlet/>`.
- `src/admin/RequireRole.tsx` — a declarative gate **component** `<RequireRole allow={["superadmin"]} redirect="/admin">…</RequireRole>` used both for route-level gating (redirect to `/admin` if disallowed) and inline control gating. The `useRole()` convenience hook (predicates from `roles.ts` bound to the current role) is exported from `src/admin/useAuth.ts` alongside `useAuth`, **not** from this file, so each `.tsx` exports only components (finding 8).

> **Lint note (finding 8):** `react-refresh/only-export-components` is configured as `warn` with `allowConstantExport: true`, so a mixed export would not fail `npm run lint` (warnings exit 0, NFR-2/AC-15 still hold). We nonetheless isolate hooks into `useAuth.ts` so the lint output is clean with zero warnings and the design's "clean lint" claim is literally true.

### New layout & pages (`src/admin/`)
- `src/admin/AdminLayout.tsx` — admin shell: brand topbar (logo, current user email, role badge, logout button) + a side nav (לוח בקרה / מועמדים / ניהול מנהלים). Renders `<Outlet/>`. **Does not** use the public `Header`/`Footer`. The "ניהול מנהלים" nav item is rendered only when `canManageAdmins(role)`.
- `src/admin/LoginPage.tsx` — `/admin/login`. Email/password form, `signInWithEmailAndPassword`. On success, redirect to `location.state.from?.pathname ?? "/admin"`. If already authenticated, redirect away from login. Hebrew error mapping.
- `src/admin/DashboardPage.tsx` — `/admin`. Summary stats cards (total, per-status counts, last-7-days) computed from aggregate count queries, plus a compact "recent applications" preview linking into the list.
- `src/admin/ApplicationsPage.tsx` — `/admin/applications`. The sortable, paginated, filterable table.
- `src/admin/ApplicationDetailPage.tsx` — `/admin/applications/:id`. All fields + status control + audit history. Any field absent on the document (legacy/HTTP docs — see finding 1) renders the shared fallback `"—"`; `gender` absent/unknown renders `"לא צוין"` via `genderLabelHe`.
- `src/admin/AdminsPage.tsx` — `/admin/admins`. Superadmin-only admin management.
- `src/admin/admin.css` — one stylesheet scoped with an `.admin-*` / `.adm-*` class prefix, referencing brand tokens via `var(--navy)` etc. (tokens are defined globally in `src/index.css`, so they are available). No change to `src/index.css`.

### Routing change (`src/App.tsx`) and provider placement (finding 7)

**Corrected rationale.** `AuthContext` subscribes with `onAuthStateChanged` / `getIdTokenResult` and uses **no react-router hooks**, so the provider does not itself require router context. `RequireAuth` *does* use `useLocation`, but it is rendered as a route element and is therefore always inside `<Routes>` regardless of where the provider sits. The provider must simply wrap the whole routed tree once so every admin component shares one auth context. The simplest correct spot is **inside `App.tsx`, wrapping the returned `<Routes>`**. `main.tsx` stays exactly as it is (`<StrictMode><BrowserRouter><App/></BrowserRouter></StrictMode>`) — **no edit to `main.tsx`**.

Concretely, `src/App.tsx` becomes:

```tsx
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="thank-you" element={<ThankYouPage />} />
        </Route>
        <Route path="admin/login" element={<LoginPage />} />
        <Route path="admin" element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="applications/:id" element={<ApplicationDetailPage />} />
            <Route
              path="admins"
              element={
                <RequireRole allow={["superadmin"]} redirect="/admin">
                  <AdminsPage />
                </RequireRole>
              }
            />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
```

`RootLayout` continues to wrap public routes only; admin routes are **outside** it, so the public Header/Footer never render in the admin area. The new admin imports follow the existing `@/` path-alias convention used throughout the codebase (`@/*` → `src/*` in `tsconfig.app.json`), e.g. `import { LoginPage } from "@/admin/LoginPage"`, `import { AuthProvider } from "@/admin/AuthContext"` — matching the existing `@/layouts/RootLayout` / `@/pages/HomePage` imports (the snippet above omits the import block for brevity).

### Cloud Functions (`functions/index.js` — append, do not modify `apply`)
Add callable functions. Shared helper `assertSuperadmin(request)` reads `request.auth?.token?.role` and throws `HttpsError("permission-denied")` if not `superadmin`, `HttpsError("unauthenticated")` if no `request.auth`. A parallel `assertEditor(request)` allows `admin`/`superadmin`, and `assertAdmin(request)` allows any of the three roles.

- `exports.setApplicationStatus = onCall({ region: "europe-west1" }, …)` — caller role must be `admin` or `superadmin` (`assertEditor`). Validates `appId` is a non-empty string ≤ 1500 chars and `status` ∈ the allowed set. Transactionally reads the current `status`, updates `applications/{appId}.status`, and appends `applications/{appId}/history/{autoId}` = `{ actorUid, actorEmail, field: "status", from, to, at: FieldValue.serverTimestamp() }`. Returns `{ ok: true, status }`. **This is the only path that mutates `status`** (see rules note below).
- `exports.listAdmins = onCall({ region: "europe-west1" }, …)` — **caller must be `superadmin`** (`assertSuperadmin`) (finding 4). This matches FR-5.1 / AC-10 / AC-11, which place admin listing under the superadmin-only admin-management area; `AdminsPage` is the only consumer and it is itself superadmin-gated. Returns the non-revoked `admins` collection docs (uid, email, role, grantedByEmail, grantedAt, updatedAt). (No non-superadmin "who are the admins" view exists in v1; adding one would be new scope.)
- `exports.grantRole = onCall({ region: "europe-west1" }, …)` — caller must be `superadmin`. Input `{ email, role }`. Validates `role` ∈ roles and `email` matches an email regex (trimmed + lowercased). Looks up the Auth user by email (`getAuth().getUserByEmail`); if not found, throws `HttpsError("not-found", "המשתמש לא קיים במערכת ההזדהות")` (v1 requires the Auth account to exist first — see FR-5.2 decision). **Claim write (finding 10):** `setCustomUserClaims(uid, { role })` — this **replaces the entire custom-claims object**, which is correct here because `role` is the **only** custom claim in this system; there is no read-merge (the Admin SDK has no merge API, and none is needed). Then upserts `admins/{uid}` (claim first, then mirror — the ordered op from the authority split above). **Self-guard:** a superadmin cannot change their own role (prevents accidental self-lockout). Returns `{ ok: true, uid, role }`.
- `exports.revokeAdmin = onCall({ region: "europe-west1" }, …)` — caller must be `superadmin`. Input `{ uid }`. **Last-superadmin guard (finding 3):** counts documents in the `admins` collection where `role == "superadmin"` **and `revoked != true`** (query: `collection("admins").where("role","==","superadmin").where("revoked","==",false)`; mirror docs are always written with an explicit `revoked: false` so the equality filter is reliable). The `admins` collection is the **declared authoritative source for the superadmin count** (justified above: it is written in the same ordered op as the claim). If the target is the only non-revoked superadmin, throw `HttpsError("failed-precondition", "לא ניתן להסיר את מנהל העל האחרון")`. **Self-guard:** cannot revoke self. Clears the `role` claim (`setCustomUserClaims(uid, { role: null })`) and marks `admins/{uid}` `revoked: true` (soft delete, preserves audit of who was ever an admin). Returns `{ ok: true }`.

All callables set region `europe-west1` and never trust any role value sent from the client — role authority always comes from `request.auth.token`.

### Bootstrap script (`functions/scripts/bootstrap-admins.js` — new)
A standalone Node script using `firebase-admin` with Application Default Credentials (operator runs `gcloud auth application-default login` or sets `GOOGLE_APPLICATION_CREDENTIALS` to a service-account key, **never committed**). It:
1. Reads a hardcoded list of the two seed emails: `asaf@sb0.tech`, `mor.k@elevation.ac`.
2. For each, `getUserByEmail` (the operator must have created these accounts in Firebase Auth console/SDK first — password set there, never in code).
3. `setCustomUserClaims(uid, { role: "superadmin" })` and upserts `admins/{uid}` with `revoked: false` and the grant metadata (`grantedByEmail: "bootstrap"`).
4. Prints a summary.

The script is idempotent (re-running re-asserts the same claim and `revoked:false`). It is run from `functions/` with `node scripts/bootstrap-admins.js`. Documented in the README with exact commands. This is the explicit, secure first-superadmin path because no superadmin yet exists to call `grantRole`.

### Firestore rules (`firestore.rules` — extend, preserve public create exactly)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function role() { return request.auth != null ? request.auth.token.role : null; }
    function isAdmin() { return role() in ['viewer','admin','superadmin']; }

    match /applications/{doc} {
      // PRESERVED EXACTLY from current rules
      allow create: if request.resource.data.keys().hasAll(['name','phone','email','city'])
                    && request.resource.data.name is string
                    && request.resource.data.phone is string
                    && request.resource.data.email is string
                    && request.resource.data.city is string;
      allow read:   if isAdmin();
      allow update: if false;   // ALL mutations route through setApplicationStatus (admin SDK, bypasses rules)
      allow delete: if false;   // deletion not exposed in v1; admin SDK could do it if ever needed

      match /history/{entry} {
        allow read:  if isAdmin();
        allow write: if false;  // only the admin SDK (Cloud Function) writes history
      }
    }

    match /admins/{uid} {
      allow read:  if isAdmin();
      allow write: if false;    // only the admin SDK writes role/admin data
    }

    match /{document=**} { allow read, write: if false; }
  }
}
```

**Absent role claim is denied at the rules layer (round-2 finding 7).** For an authenticated Firebase user who has **no** `role` custom claim (the FR-1.6 case — a signed-in non-admin), `request.auth.token.role` is absent; `role()` returns that absent value and `role() in ['viewer','admin','superadmin']` evaluates to `false`, so `isAdmin()` is `false` and the user is denied all `applications`/`admins`/`history` reads. The React access-denied screen (FR-1.6) is therefore UI convenience only — data is independently denied at the rules layer, consistent with "the UI must never be the only gate."

**Update/delete are closed to all clients (finding 2).** Every status change goes through the `setApplicationStatus` callable, which uses the admin SDK and **bypasses security rules entirely**, guaranteeing that each `status` mutation is accompanied by a non-forgeable `history` entry with a server-stamped `actorUid`. There is no client-writable path to `status`, so the audit-trail invariant cannot be bypassed from the browser console even by an authenticated admin. Reads/list for the table and detail view still work via `allow read: if isAdmin()`. The `history` subcollection and `admins` collection remain `write: false` (SDK-only). `delete` is closed in v1 (deleting applicant records is not a requirement; if ever needed it would be a dedicated audited callable). The previous design's "least-surprise direct update" allowance is removed.

## Data Model

`applications/{id}` — existing collection, two writer paths produce **slightly different shapes**; the admin UI must tolerate both (finding 1):

- **Client path (`ApplyWizard.tsx`, primary):** `{ name, phone, email, idNum, birthdate, gender (CRM code string "7"|"0"|"1"), city, background, motivation, createdAt (ISO string), status }` — the full shape.
- **Legacy HTTP path (`functions/index.js` `exports.apply`, must stay untouched):** `{ name, phone, email, city, age (string), background, motivation, createdAt (ISO string), status }` — **no `idNum`, no `birthdate`, no `gender`**, and carries `age` instead.

Therefore the `Application` type marks `idNum?`, `birthdate?`, `gender?`, `age?` (and defensively `background?`, `motivation?`) as optional. **`background` and `motivation` are always written as strings by both paths** (empty string when not provided); the `apply` HTTP function writes them explicitly as `background || ""` / `motivation || ""`, and `ApplyWizard` carries them in initial state. The client form, however, has **no `motivation` input**, so `motivation` is effectively always `""` and the detail view renders `"—"` for it on current records (FR-4.4/AC-6 display is empty until a motivation field is added — out of scope here). The admin detail view and table render the shared fallback `"—"` for any missing **or empty-string** field (empty is treated the same as missing), and `genderLabelHe(undefined | "")` returns `"לא צוין"`. This keeps the admin UI correct for records created by either path. (Note: `ApplyWizard` does not call the `apply` function — it writes Firestore directly and posts to Make.com — but the function remains deployed and in scope to preserve, so docs it created or may create must be tolerated.)

`applications/{id}/history/{entryId}` (new, SDK-written):
`{ actorUid: string, actorEmail: string, field: "status", from: string, to: string, at: Timestamp }`. `at` is written with `FieldValue.serverTimestamp()`, so on the client it is a Firestore `Timestamp` (and transiently `null` on the optimistic local snapshot). The client converts it with `at?.toDate().toISOString() ?? null` before passing to `formatDateTimeHe`, and renders the pending-null case as `"שומר…"`/`"—"` (round-2 finding 10). `formatDateTimeHe` itself only ever receives an ISO string.

`admins/{uid}` (new, SDK-written):
`{ uid: string, email: string, role: Role, grantedBy: string (uid), grantedByEmail: string, grantedAt: Timestamp, updatedAt: Timestamp, revoked: boolean }`. **`revoked` is a non-optional field of the write shape** (round-2 finding 8): every one of the three writers (`grantRole`, `revokeAdmin`, and the bootstrap script) MUST set `revoked` explicitly (`false` on grant/bootstrap, `true` on revoke). This is load-bearing — the last-superadmin count query uses `where("revoked","==",false)`, and Firestore equality filters silently omit documents that lack the field; a single `admins/{uid}` doc written without `revoked` would undercount superadmins and could allow removing the final one. There is no code path that writes an `admins` doc without `revoked`.

Custom claim on Auth user: `{ role: "superadmin" | "admin" | "viewer" }` — the only custom claim.

Status set (locked): `new | contacted | interview | accepted | rejected` → Hebrew `חדש | נוצר קשר | ראיון | התקבל | נדחה`.
Gender mapping (locked): `"7"→זכר`, `"0"→נקבה`, `"1"→אחר`, fallback `"לא צוין"` for any other/empty/undefined value. The gender cell in the table, the detail view, **and the CSV export** are all produced by `genderLabelHe`, so `"לא צוין"` is the single consistent fallback for gender in every output; the generic `"—"` fallback never applies to the gender column (round-2 finding 4).

## Pagination, Filtering, Sorting (concrete)

**`createdAt` ordering dependency (round-2 finding 11):** both writer paths store `createdAt: new Date().toISOString()` — a lexicographically-sortable ISO-8601 string (verified in `ApplyWizard.tsx` and `functions/index.js`). `orderBy("createdAt","desc")` therefore sorts chronologically (newest first) as required by FR-4.1/AC-4, and the cursor uses the document snapshot via `startAfter(lastDoc)`. This correctness depends on every writer continuing to store ISO-8601 strings (not a `Timestamp` or non-ISO string); the design does not change either writer.

Given expected volumes (a single cohort's applications, realistically hundreds not millions), we use a **hybrid**: `query(collection(db,"applications"), orderBy("createdAt","desc"), limit(PAGE=25))` with cursor-based "load more" via `startAfter(lastDoc)`. Status filtering uses a server `where("status","==",value)` **combined with** `orderBy("createdAt","desc")`, which requires a composite index `status ASC, createdAt DESC`. Free-text search (name/email/phone/city) is **client-side** over the already-loaded pages (Firestore has no substring search); the search box filters the in-memory loaded set and the UI shows "showing N loaded — load more for older". Column sort (name, createdAt, status) on the loaded set is client-side; default sort is `createdAt desc`. This keeps reads bounded (NFR-7). Summary stats on the dashboard use lightweight `getCountFromServer` aggregate queries per status plus a total count, avoiding loading all docs.

**Composite index wiring (finding 6).** `firestore.indexes.json` (new) declares the `status + createdAt` composite index. It **must be registered in `firebase.json`**, whose `firestore` block currently has only `"rules"`. The block becomes:

```json
"firestore": {
  "rules": "firestore.rules",
  "indexes": "firestore.indexes.json"
}
```

so `firebase deploy --only firestore:indexes` has something to deploy. **The index must be deployed before the status filter is used.** Until the index exists, the status-filtered query throws `failed-precondition`; see Error Handling for the user-facing behavior, and the README documents that `firestore:indexes` is deployed alongside rules.

## Error Handling (per operation)

**Login (`signInWithEmailAndPassword`)**:
- `auth/invalid-credential` / `auth/wrong-password` / `auth/user-not-found` → Hebrew "אימייל או סיסמה שגויים" (do not reveal which). Recoverable; user retries.
- `auth/too-many-requests` → "יותר מדי ניסיונות, נסו שוב מאוחר יותר". Recoverable.
- `auth/user-disabled` → "החשבון מושבת". Not recoverable by user.
- network error → "בעיית רשת, נסו שוב". Recoverable.
- Logged: `console.error` with the raw code (dev console only); never render raw codes/stack to the user. No server logging from the client.

**Claim read (`getIdToken(true)` / `getIdTokenResult`)** — if it throws or `claims.role` is undefined/unknown → treat as `role = null` → access-denied screen (FR-1.6). Fatal for admin access, recoverable by contacting a superadmin. Logged client-side.

**Applications list/detail queries** — `permission-denied` (role lost/expired) → show "אין הרשאה" and offer logout/refresh; `unavailable`/network → inline "שגיאת טעינה, נסו לרענן" with a retry button. Detail with unknown `:id` → "המועמד לא נמצא" empty state. All recoverable; logged client-side.

**Status-filtered list query missing-index (finding 6)** — a `failed-precondition` (composite index not yet deployed) or `unavailable` from the `where("status",…)+orderBy("createdAt",…)` query shows the same "שגיאת טעינה, נסו לרענן" inline message with a retry button, matching the general list-query handling. The raw Firestore index-creation link is logged to the dev console for the operator. The README notes that status filtering only works after the composite index is deployed, so this failure should not occur in a correctly deployed environment.

**`setApplicationStatus` callable** — client maps `FunctionsError` codes:
- `unauthenticated` → redirect to login.
- `permission-denied` → "אין לך הרשאה לשנות סטטוס" (viewer that somehow reached the control).
- `invalid-argument` (bad status/id) → "ערך לא תקין" (should not happen via UI).
- `not-found` → "המועמד לא נמצא".
- `internal`/network → "השמירה נכשלה, נסו שוב"; the UI reverts the optimistic status change.
Server side: validates inputs, throws typed `HttpsError`; wraps the transaction in try/catch and rethrows `internal` on unexpected failure; `console.error` on the server for diagnostics.

**`grantRole` / `revokeAdmin` / `listAdmins` callables** — client maps: `permission-denied` → "רק מנהל על יכול לבצע פעולה זו"; `not-found` → "המשתמש לא קיים במערכת ההזדהות — צרו קודם חשבון"; `failed-precondition` → the specific guard message (last superadmin / self); `invalid-argument` → "קלט לא תקין". Server validates every input and the caller's claim before any write; a failed guard throws before any mutation. Claim write and mirror write are ordered (claim first); if the mirror write fails after the claim is set, the server logs it and surfaces `internal`, and the operation is idempotent on retry (re-asserts the same claim and converges the mirror).

**CSV export** — pure client computation; the only failure is an empty set → the button is disabled when there are zero loaded rows. No async failure path.

## Input Validation (per external input)

- **Login email/password**: email required, non-empty, basic email shape before calling Firebase (Firebase re-validates); password required non-empty. On empty → inline field errors in Hebrew, no network call.
- **`setApplicationStatus` args** (`appId`, `status`): server requires `appId` is a non-empty string ≤ 1500 chars (Firestore id limit) and `status` is one of the 5 allowed literals; anything else → `invalid-argument`. Client also constrains `status` to the typed union so only valid values are sendable.
- **`grantRole` args** (`email`, `role`): server requires `email` is a string matching an email regex and `role` ∈ `{superadmin,admin,viewer}`; else `invalid-argument`. Email is trimmed/lowercased before `getUserByEmail`.
- **`revokeAdmin` args** (`uid`): server requires `uid` is a non-empty string; else `invalid-argument`.
- **Search/filter inputs** (client-only): trimmed, lowercased, compared case-insensitively against the loaded set; no injection surface (no query string built from them for Firestore text search).
- **Route param `:id`**: used directly as a Firestore doc id in a `getDoc`; a non-existent id yields the "not found" empty state. Read still gated by `isAdmin()` in rules.

## Invariant Ownership

- **"Only the admin SDK writes roles/history/admins, and `status` is never client-writable"** — enforced by **Firestore rules** (`allow write: if false` on `admins` and `history`; `allow update, delete: if false` on `applications`), the lowest trustworthy layer. Cloud Functions (admin SDK, which bypasses rules) are the only writers of `status`/`history`/`admins`. The UI never attempts these writes. (This closes finding 2: there is no rule-permitted client update path to forge a status change around the audit trail.)
- **"A caller's role authority comes only from the verified token"** — enforced in **Cloud Functions** (read `request.auth.token.role`, never a client-supplied role field) and in **rules** (`request.auth.token.role`). The UI's role context is presentation-only.
- **"At least one superadmin always exists"** — enforced in the **`revokeAdmin`/`grantRole` Cloud Functions** via the last-superadmin + self guards, counting non-revoked `superadmin` docs in the `admins` collection, which is the **declared authoritative source for the admin set** (written in the same ordered op as the claim — see Technology Decisions; closes finding 3). Rules cannot express this invariant.
- **"Every `admins/{uid}` document carries an explicit `revoked` boolean"** — owned by the **three Cloud-Function/script writers** (`grantRole`, `revokeAdmin`, bootstrap), each of which sets `revoked` as a mandatory field (round-2 finding 8). This invariant is what makes the `where("revoked","==",false)` last-superadmin count correct; because Firestore equality filters skip docs missing the field, a missing `revoked` would silently undercount. No other writer of `admins` exists (clients are blocked by `allow write: if false`), so the invariant holds by construction.
- **"Public create rule semantics unchanged"** — owned by **`firestore.rules`**; the create block is copied verbatim from the current file and covered by the existing public Playwright submission test (NFR-4, AC-17) to catch regressions.
- **"Valid gender/status label mapping with graceful fallback for legacy docs"** — owned by the client `applications.ts` label maps with explicit fallbacks (`genderLabelHe(undefined)==="לא צוין"`, missing fields → `"—"`); unit-testable.

## Testing Strategy

**Playwright config**: no `webServer` block is added (keeps the public suite unchanged); admin specs read `SITE_URL` exactly like existing specs (`const SITE = process.env.SITE_URL || "https://negev.sb0.tech"`). Operator runs `npm run build && npx vite preview --port 4173` then `SITE_URL=http://localhost:4173 npx playwright test tests/admin*.spec.ts --project=desktop`.

**New specs**:
- **Unit-testable (pure)** — `roles.ts` predicates, `genderLabelHe` (incl. undefined → `"לא צוין"`), status maps, `toCsv` BOM + escaping, `formatDateHe`. **Type-checking boundary (round-2 finding 1):** these helpers **live in `src/lib/*.ts`**, which IS the only thing type-checked by `npm run build` — `tsc -b` walks `tsconfig.app.json` (`include: ["src"]`) and `tsconfig.node.json` (`include: ["vite.config.ts"]`) and **nothing type-checks `tests/`** (Playwright transpiles specs via esbuild without type-checking). Therefore the type correctness of the pure helpers is guaranteed by `tsc -b` over `src/` (where `strict`, `verbatimModuleSyntax`, `noUnusedLocals` apply), and `tests/unit.spec.ts` is a **thin runtime harness only** that imports those helpers and asserts runtime behavior — it is intentionally outside the type-checked project set. We do **not** add a `tsconfig.test.json` reference in v1 (the specs are simple assertions; adding spec type-checking is a deliberate non-goal here, noted so the implementer does not assume `npm run build` validates the spec file). A type error inside the spec would not fail `npm run build`; a type error in the `src/lib` helpers would. These are plain TS functions placed in `tests/unit.spec.ts` using Playwright's `test()` with no page. **These are always invoked with `--project=desktop` (finding 12)** — a bare `npx playwright test` would run them once per project (desktop/mobile/tablet), which is wasteful but harmless; the documented command and README pin `--project=desktop`, so the unit spec runs exactly once. (No correctness impact either way.)
- **Routing/redirect (no live auth needed)** — visiting `/admin` unauthenticated redirects to `/admin/login`; `/admin/login` renders the Hebrew form (brand elements, email/password fields, submit button). Run against `vite preview` with no credentials.
- **RBAC UI gating (no live backend)** — the hardest part to test without real auth. A **test-only, DEV-only auth override** is used, specified precisely to eliminate any shippable-bypass risk (finding 5):

  **Guard (hard requirement):** the override branch is read **only** when BOTH `import.meta.env.DEV` is true AND `import.meta.env.VITE_ADMIN_TEST_MODE === "1"`. Written as a single guard: `if (import.meta.env.DEV && import.meta.env.VITE_ADMIN_TEST_MODE === "1") { /* read window.__ADMIN_TEST_ROLE__, short-circuit AuthContext to a fake {user, role}; applications.ts serves in-memory fixtures; setApplicationStatus mutates the fixture */ }`. In any production build `import.meta.env.DEV` is statically `false`, so Vite tree-shakes the entire branch — **the bypass is impossible in a production build regardless of whether `VITE_ADMIN_TEST_MODE` is set**. This closes the `npm run deploy` risk: `npm run deploy` runs `firebase deploy --only hosting` over `dist`, and `dist` from any `vite build` is a production build (`import.meta.env.DEV===false`), so even a `dist` accidentally built with the flag contains no live bypass.

  **No real firebase service is touched in override mode (round-2 finding 5):** `src/lib/firebase.ts` runs `initializeApp(firebaseConfig)` + `getAuth(app)` at module import time, unconditionally. That top-level init is **lazy and harmless — it opens no network connection and reads no remote data until a service method is actually invoked** (`onAuthStateChanged`, `getDoc`, `httpsCallable`, etc.). The design's hard requirement is that in DEV+flag mode, `AuthContext`, `applications.ts`, and `adminApi.ts` **return their fakes/fixtures before calling any `firebase/auth`, `firebase/firestore`, or `firebase/functions` method**: `AuthContext` returns the fake `{user, role}` synchronously and **creates no `onAuthStateChanged` subscription**; `applications.ts` returns in-memory fixtures and issues **no Firestore query**; `adminApi.ts`/`setApplicationStatus` mutate the fixture and invoke **no callable**. Consequently the override specs make **no network request and require no `VITE_FIREBASE_*` values to be set** (`.env` may be entirely absent) — the deterministic/offline claim holds because the guard sits *in front of* every firebase service call, and the unconditional `initializeApp`/`getAuth` at import does nothing observable without a subsequent service call. This is the precise contract the implementer must honor: the flag check is the first statement in each data-access entry point, before any firebase singleton is used.

  **How tests build it:** the RBAC/offline specs run against a preview built in **dev-equivalent mode for the override to be live** — concretely the operator runs the preview with the flag using Vite's dev server test build, or (simpler and documented) runs these specs against `npm run dev`-served app with `VITE_ADMIN_TEST_MODE=1` where `import.meta.env.DEV` is true. The deterministic offline specs therefore target the dev server (DEV=true + flag=1), while the production `vite preview` build is used for the unauthenticated-redirect/login-render specs. The README documents both commands explicitly.

  **`.env.example`:** gains `VITE_ADMIN_TEST_MODE=` (empty, default off) with a comment that it is a **DEV-only test flag** and must never be set for a deploy build. Because the guard also requires `import.meta.env.DEV`, this flag has no effect on a production bundle even if accidentally set.

  The specs set role to `viewer` → assert no "ניהול מנהלים" nav and no status/export controls; `admin` → sees applications controls but no admin-management; `superadmin` → sees everything. Satisfies AC-11/AC-16 without live credentials and without weakening production.
- **Applications list/detail/status happy path** — run in the same DEV+flag override with the in-memory fixture data source; `setApplicationStatus` updates the fixture. Deterministic, offline. **AC-5 status filter (round-2 finding 9):** the status-filter happy path is validated here by filtering the **in-memory fixtures client-side**, which has **no composite-index dependency** — the fixture data source does not run a Firestore `where("status",…)+orderBy(…)` query, so the test passes offline/undeployed. Against **live** Firestore the same status filter requires the deployed composite index (`status ASC, createdAt DESC`); until `firebase deploy --only firestore:indexes` is run it throws `failed-precondition` (handled gracefully per Error Handling). The README documents that live status filtering depends on the deployed index, and that the automated AC-5 coverage uses fixtures by design.
- **Live-credential tests** (`tests/admin-live.spec.ts`) — actual `signInWithEmailAndPassword` with a seeded user, guarded by `test.skip(!process.env.ADMIN_TEST_EMAIL || !process.env.ADMIN_TEST_PASSWORD, "requires live admin credentials")`. Documented in README.

**What is unit vs integration**: pure helpers → unit. Routing/redirect, RBAC gating, list/detail/status → integration via the deterministic DEV+flag override. True end-to-end with Firebase Auth + Firestore + functions → live, guarded, manual/CI-with-secrets only.

**Public suite**: existing `form-submit.spec.ts` et al. are untouched and must still pass (AC-17); the design changes `firebase.ts` only additively and never touches `ApplyWizard`/`webhook.ts`, so the public create rule and submission flow are preserved.

## Security Review Points

- Clients cannot write `admins` or `history` and **cannot update `applications` at all** (rules `write/update:false`); cannot forge actor identity (server stamps `request.auth.token`); cannot self-escalate (grant/revoke are superadmin-gated and self-guarded); the audit trail cannot be bypassed because `status` has no client-writable path (finding 2).
- No secrets committed: `VITE_FIREBASE_*` stays in gitignored `.env`; the bootstrap script uses ADC/service-account creds supplied by the operator at runtime, never checked in; `.env.example` gains only the DEV-only `VITE_ADMIN_TEST_MODE` flag (default off).
- Least privilege: `viewer` read-only (rules allow read, functions reject edits); `admin` edits applications (status via callable) but `grantRole`/`revokeAdmin`/`listAdmins` reject non-superadmins; `superadmin` full.
- The test-mode override is double-gated by `import.meta.env.DEV` **and** `VITE_ADMIN_TEST_MODE`, so it is stripped from every production build and can never be toggled on in the deployed app (finding 5).

## Deliverables Checklist (for implementation step)
- Extend `src/lib/firebase.ts`; add `src/lib/{roles,applications,adminApi,format}.ts`.
- Add `src/admin/{AuthContext,useAuth,RequireAuth,RequireRole,AdminLayout,LoginPage,DashboardPage,ApplicationsPage,ApplicationDetailPage,AdminsPage}` (+ `admin.css`), with `useAuth.ts`/hooks split out for clean lint.
- Wire routes and wrap `<AuthProvider>` **in `src/App.tsx`**; leave `src/main.tsx` unchanged.
- Append callables (`setApplicationStatus`, `listAdmins`, `grantRole`, `revokeAdmin`) + `scripts/bootstrap-admins.js` to `functions/`; do not modify `apply`.
- Extend `firestore.rules` (update/delete closed); add `firestore.indexes.json`; add `"indexes"` to the `firestore` block in `firebase.json`.
- Add Playwright specs + DEV-only test-mode plumbing; add `VITE_ADMIN_TEST_MODE=` to `.env.example`.
- Add `ADMIN_README.md`.
- Verify: `npm run build` (0), `npm run lint`, admin specs vs `vite preview` (redirect/login) and dev+flag (RBAC/offline).

---

## Responses to Design Review Findings

Review `03-design-review.md` / `design-review.json` (verdict CHANGES_REQUESTED, 3 HIGH / 4 MEDIUM / 5 NIT). All 12 findings verified against source and addressed.

1. **[MEDIUM] Detail view assumes fields some docs lack; `apply` writes a different shape — ADDRESSED.** Verified `functions/index.js exports.apply` writes `{name,phone,email,city,age,background,motivation,createdAt,status}` with no `idNum/birthdate/gender`. `Application` now types `idNum?/birthdate?/gender?/age?` (and `background?/motivation?`) optional; detail view and table render `"—"` for missing fields and `genderLabelHe(undefined)==="לא צוין"`. Data Model section documents both writer shapes explicitly.

2. **[HIGH] Rules allowed direct client `update`, bypassing the audit invariant — ADDRESSED (preferred fix).** `allow update: if false` and `allow delete: if false` on `applications`; all status changes route through the `setApplicationStatus` callable (admin SDK bypasses rules), so every `status` mutation carries a server-stamped `history` entry. The "least-surprise fallback" paragraph is removed. Reads/list still work via `allow read: if isAdmin()`.

3. **[MEDIUM] Last-superadmin guard counted a mirror declared non-authoritative — ADDRESSED.** The authority split is now explicit: the claim is authoritative for per-request access; the **`admins` collection is authoritative for the admin set** (written in the same ordered, idempotent op as the claim). The count query is explicit (`role=="superadmin" && revoked==false`), `revoked` is always written explicitly, and revoke is a soft delete setting `revoked:true`.

4. **[MEDIUM] `listAdmins` authorization contradicted FR-5 — ADDRESSED.** `listAdmins` is now **superadmin-only** (`assertSuperadmin`), matching FR-5.1/AC-10/AC-11. The "flip if desired" toggle is removed; a non-superadmin admin-list view is called out as new scope, not an option.

5. **[HIGH] Test-mode bypass under-specified, risked shipping via `npm run deploy` — ADDRESSED.** The override is now double-gated by `import.meta.env.DEV && import.meta.env.VITE_ADMIN_TEST_MODE === "1"` in a single branch; `DEV` is statically `false` in any `vite build`, so the branch (fake auth + fixtures) is tree-shaken from every production `dist`, making a live bypass impossible even if `npm run deploy` ships a flag-built `dist`. `.env.example` documents the flag as DEV-only, default off. The RBAC/offline specs run against the dev server (DEV=true + flag) while redirect/login specs run against the production preview.

6. **[MEDIUM] `firestore.indexes.json` not wired into `firebase.json`; index-missing query failure unhandled — ADDRESSED.** Verified `firebase.json firestore` block has only `"rules"`. The design adds `"indexes": "firestore.indexes.json"` to that block, and adds the status-filtered query's `failed-precondition`/`unavailable` to Error Handling ("שגיאת טעינה, נסו לרענן" + retry), noting the index must be deployed before status filtering works.

7. **[HIGH] `AuthProvider` placement rationale wrong; App.tsx vs main.tsx under-specified — ADDRESSED.** Rationale corrected: `AuthContext` uses no router hooks; `RequireAuth` is always inside `<Routes>`. The provider now wraps `<Routes>` **inside `App.tsx`**; `main.tsx` is left unchanged. The "if structure differs" hedge is removed (verified `main.tsx` holds `BrowserRouter`, `App.tsx` holds `Routes`).

8. **[NIT] Component+hook exports trip `react-refresh/only-export-components` — ADDRESSED.** `useAuth`/`useRole` and the context object move to a non-component module `src/admin/useAuth.ts`; `AuthContext.tsx` and `RequireRole.tsx` export only components, so lint output is clean with zero warnings (the rule is `warn`, so it would not have failed the build either — noted).

9. **[NIT] Requirements used v1 `context.auth`; design uses v6/v2 `request.auth` — ACKNOWLEDGED, no change.** The design intentionally and correctly uses `request.auth.token.role` for `firebase-functions` v6 `onCall` (verified in `functions/package.json`). Recorded as an intentional, correct divergence from the requirements' outdated wording.

10. **[NIT] `grantRole` "merging claims" impossible/unnecessary — ADDRESSED.** The design now states `setCustomUserClaims(uid, { role })` **replaces** the whole claims object, which is correct because `role` is the only custom claim; no read-merge. The "merging, preserving other claims" language is removed.

11. **[NIT] Vague forced-refresh trigger — ADDRESSED.** Concrete trigger specified: `getIdToken(true)` once on sign-in and once on provider mount for an already-signed-in user, then re-read claims; otherwise a role change surfaces within ≤1h via Firebase's automatic refresh or on next login. The "on next focus" language is dropped (no `visibilitychange` listener).

12. **[NIT] Unit spec runs under all three projects — ADDRESSED (documented).** Noted that the unit spec is always invoked with `--project=desktop` (per the documented command and README), so it runs once. No `testDir`/project-filter change is made since the pinned command already prevents the triple-run and there is no correctness impact.

---

## Responses to Design Review Findings — Round 2

Second review `03-design-review.md` / `design-review.json` (verdict CHANGES_REQUESTED, 2 HIGH / 3 MEDIUM / 6 NIT). All 11 findings verified against source (`tsconfig.*.json`, `functions/index.js`, `src/components/ApplyWizard.tsx`, `src/lib/firebase.ts`) and addressed in the body above.

1. **[HIGH] Unit spec in `tests/` is not type-checked by `npm run build` — ADDRESSED.** Verified `tsc -b` walks only `tsconfig.app.json` (`include:["src"]`) and `tsconfig.node.json` (`include:["vite.config.ts"]`); `tests/` is type-checked by neither and Playwright transpiles without type-checking. Testing Strategy now states explicitly that the pure helpers live in `src/lib/*.ts` (type-checked by `tsc -b`), while `tests/unit.spec.ts` is a thin runtime-only harness intentionally outside the checked project set, and that adding a `tsconfig.test.json` is a deliberate non-goal in v1. The design no longer implies the spec is build-verified.

2. **[HIGH] `setPersistence` as a bare async call races with `getIdToken(true)` — ADDRESSED (drop the call).** Verified `browserLocalPersistence` is already the `getAuth` default and a bare `setPersistence` returns a floating promise. The File-Level Plan and Technology Decisions now state **no `setPersistence` call is added**: `export const auth = getAuth(app)` is left exactly as-is (local persistence by SDK default), satisfying FR-1.2 with no new code, no floating promise, and no `onAuthStateChanged`/`getIdToken(true)` race. `auth`'s signature is unchanged, so `ApplyWizard` (imports only `app`) is provably unaffected.

3. **[MEDIUM] `background`/`motivation` "effectively present" claim inaccurate — ADDRESSED.** Verified `apply` writes `background: background||""` and `motivation: motivation||""`, and `ApplyWizard` seeds both in initial `FormData` state but has **no `motivation` input** (only initial `""`, no setter). The `applications.ts` bullet and Data Model now state both fields are always written as strings (`""` when absent), that `motivation` is effectively always `""` because the form never collects it, and that FR-4.4/AC-6 `motivation` display renders `"—"` on current records until a motivation input is added (out of scope). Empty string is rendered the same as missing.

4. **[MEDIUM] `"—"` vs `"לא צוין"` split ambiguous for the CSV gender column — ADDRESSED.** A single rule is now stated in both `format.ts` and the Data Model: the gender cell in the table, detail view, **and CSV** is always produced by `genderLabelHe`, so absent/empty/unknown gender is `"לא צוין"` everywhere including CSV; the generic `"—"` fallback applies only to non-gender fields. The CSV never treats gender as a generic missing value.

5. **[MEDIUM] DEV+flag override claimed offline but `firebase.ts` initializes at import — ADDRESSED.** Testing Strategy now specifies the hard contract: in DEV+`VITE_ADMIN_TEST_MODE==="1"` mode, `AuthContext`/`applications.ts`/`adminApi.ts` return fake auth and in-memory fixtures **before calling any `firebase/auth`/`firestore`/`functions` method**, create **no `onAuthStateChanged` subscription**, and issue no query/callable — so specs need **no network and no `VITE_FIREBASE_*` values**. The unconditional top-level `initializeApp`/`getAuth` is noted as lazy and harmless (no network until a service method runs), and the flag check is the first statement in each data-access entry point.

6. **[NIT] App.tsx snippet omits `@/` alias convention — ADDRESSED.** Added a note that new admin imports use the existing `@/` alias (`@/admin/LoginPage`, `@/admin/AuthContext`), matching `@/layouts/RootLayout` / `@/pages/HomePage`, with the snippet omitting the import block for brevity.

7. **[NIT] `isAdmin()` behavior for authenticated no-claim user undocumented — ADDRESSED.** Added a paragraph in the rules section: an absent `role` claim makes `role() in [...]` evaluate `false`, so a signed-in non-admin is denied all `applications`/`admins`/`history` reads at the rules layer, consistent with FR-1.6; the UI access-denied screen is convenience only.

8. **[NIT] Last-superadmin count depends on every `admins` doc having `revoked` — ADDRESSED.** Data Model now marks `revoked` a **non-optional** field of the write shape, and a new Invariant Ownership line states all three writers (`grantRole`, `revokeAdmin`, bootstrap) MUST set `revoked`, because Firestore equality filters skip docs missing the field and a missing `revoked` would undercount superadmins. No writer omits it; clients cannot write `admins`.

9. **[NIT] Status filter needs a deployed composite index; AC-5 can't pass undeployed — ADDRESSED.** Testing Strategy now states the AC-5 status-filter happy path is validated via in-memory fixtures (client-side filtering, no index dependency) so it passes offline, while live status filtering requires the deployed `status ASC, createdAt DESC` composite index (documented in README; `failed-precondition` handled gracefully until deployed).

10. **[NIT] `history.at` Timestamp vs `formatDateTimeHe` ISO + pending null — ADDRESSED.** `applications.ts`/`subscribeApplicationHistory` and the Data Model now specify converting `at` via `at?.toDate().toISOString() ?? null` before formatting, rendering a pending (null) server timestamp as `"שומר…"`/`"—"`, and clarify `formatDateTimeHe` only ever receives an ISO string (caller converts the `Timestamp`).

11. **[NIT] `createdAt` ISO lexical-ordering dependency not stated — ADDRESSED.** Added a line to Pagination: both writers store `createdAt: new Date().toISOString()`, so `orderBy("createdAt","desc")` sorts chronologically and the cursor uses `startAfter(lastDoc)`; correctness depends on writers continuing to store ISO-8601 strings, which this design does not change.
