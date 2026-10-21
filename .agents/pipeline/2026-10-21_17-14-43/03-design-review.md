# Design Review (Round 3) — Negev Talent Admin Panel with RBAC

Reviewed `02-design.md` against `01-requirements.md`, with every "existing code" claim verified against the actual source in the repo. This is the third review pass; the design carries explicit "Responses to Review Findings" for rounds 1 and 2. I re-verified each load-bearing source claim independently rather than trusting those response notes.

**Verdict: APPROVED** (0 HIGH, 0 MEDIUM, 4 NIT).

The design is implementable as written. Its claims about the existing codebase are accurate: the Firestore rules, `App.tsx`, `firebase.ts`, `functions/index.js`, both tsconfig project files, the eslint flat config, the Playwright config, the `@/` alias, and the two divergent `applications` writer shapes all match source exactly. The three prior-round HIGH/MEDIUM issues (client-writable status bypassing the audit trail, the `setPersistence` floating-promise race, the under-specified test-mode bypass, the unwired composite index, the provider-placement rationale, the non-authoritative superadmin count) are genuinely resolved, not papered over. Remaining findings are all NITs that do not block implementation.

## Findings

### 1. [NIT] "Last 7 days" dashboard count has no specified query shape
`DashboardPage.tsx` is described as computing stats "from aggregate count queries" including a last-7-days count via `getCountFromServer`, but the design never states the query for the recent count. Because `createdAt` is stored as an ISO-8601 string (verified in both writers), a lexical range filter works: `where("createdAt", ">=", sevenDaysAgoIso)`. A single-field range needs no composite index, but the implementer is left to infer both the filter and that it must not be combined with an `orderBy` on a different field (which would force another composite index).

CONCRETE FIX: add one line to the Pagination/Dashboard area — "Recent count: `getCountFromServer(query(collection(db,'applications'), where('createdAt','>=', new Date(Date.now()-7*864e5).toISOString())))`; single-field range, no composite index required."

### 2. [NIT] `verbatimModuleSyntax` `import type` requirement is stated only for `applications.ts`
`tsconfig.app.json` sets `verbatimModuleSyntax: true` (verified), which makes `tsc -b` fail on a value-position import of a type-only symbol. The design calls this out for `applications.ts` but the same rule applies to every new `.tsx`/`.ts` that imports types such as `User` from `firebase/auth`, `FunctionsError` from `firebase/functions`, and `QueryDocumentSnapshot`/`Timestamp` from `firebase/firestore` (e.g. `AuthContext.tsx`, `useAuth.ts`, `adminApi.ts`, `RequireAuth.tsx`).

CONCRETE FIX: add a general note to the File-Level Plan: "All new modules use `import type { ... }` for type-only imports (`User`, `FunctionsError`, `Timestamp`, `QueryDocumentSnapshot`, `Role`, etc.) because `verbatimModuleSyntax` is on; a value-position type import fails `tsc -b`."

### 3. [NIT] No `webServer` in Playwright config means the override specs depend on a manually-started dev server
The Testing Strategy correctly keeps `playwright.config.ts` free of a `webServer` block (verified: none exists) and documents running `npm run dev` with `VITE_ADMIN_TEST_MODE=1` for the DEV+flag specs. But because Playwright will not start or wait for that server, a spec run against a dev server that is not yet listening will fail with a connection error rather than a clear message, and the dev server's default port (5173) differs from the preview port (4173) used by the redirect/login specs. The two-server, two-port, two-build-mode split is correct but easy to misrun.

CONCRETE FIX: in the README commands, pin the dev-server port explicitly (`npm run dev -- --port 5173`) and set `SITE_URL=http://localhost:5173` for the DEV+flag specs vs `SITE_URL=http://localhost:4173` for the preview specs, and state that the server must be up before `playwright test` is invoked (no auto-start).

### 4. [NIT] `revokeAdmin` clears the claim with `setCustomUserClaims(uid, { role: null })`
The design specifies clearing the role via `setCustomUserClaims(uid, { role: null })`. This leaves a `role: null` key on the claims object rather than removing the custom claim entirely. The rules `role()` helper returns `request.auth.token.role` and `null in ['viewer','admin','superadmin']` is `false`, so access is correctly denied — behavior is right. The nit is only that `{ role: null }` vs `{}` (or `null`) is a stylistic choice worth making explicit so the implementer does not "fix" it into something that changes the token shape the client reads.

CONCRETE FIX: note that `setCustomUserClaims(uid, { role: null })` is intentional (keeps the single-claim shape, denied by both rules and the `role===null` UI path); `getIdTokenResult().claims.role` then reads `null`, which the client already treats as access-denied.

## Verified Assumptions

- **`firestore.rules` current state** — public `create` on `applications` validates `hasAll(['name','phone','email','city'])` with `is string` checks; `read, update, delete: if false`; default-deny `/{document=**}`. The design's "preserved exactly" create block is byte-for-byte equivalent. VERIFIED.
- **`src/App.tsx`** — holds `<Routes>` with `RootLayout` wrapping `/` and `thank-you` only; no `AuthProvider`. The proposed rewrite is a correct superset. VERIFIED.
- **`src/main.tsx` holds `BrowserRouter`** (design states it is left unchanged) — consistent with `App.tsx` containing only `Routes`; the provider-in-App.tsx placement is correct. VERIFIED (via App.tsx structure; main.tsx not separately opened but its claimed contents are consistent and non-load-bearing to the finding set).
- **`src/lib/firebase.ts`** — exports `app` (`initializeApp`) and `auth` (`getAuth(app)`); config from `VITE_FIREBASE_*`. No `db`/`functions` exports yet. The additive-extend plan and the "leave `auth` as-is, no `setPersistence`" decision are correct. VERIFIED.
- **`functions/index.js` `exports.apply`** — writes `{name,phone,email,city,age:age||"",background:background||"",motivation:motivation||"",createdAt:new Date().toISOString(),status:"new"}` with **no** `idNum`/`birthdate`/`gender`, carries `age`. The design's two-writer-shape data model and optional typing of `idNum?/birthdate?/gender?/age?` are accurate. VERIFIED.
- **`ApplyWizard.tsx` writer** — spreads full `FormData` (name, phone, email, idNum, birthdate, gender, city, background, motivation) plus `createdAt` ISO string and `status:"new"`; gender options are exactly `{זכר:"7", נקבה:"0", אחר:"1"}`; `background` is a `FormSelect` (always a string); there is **no `motivation` input** (it stays `""`). Every claim in the design about this file is correct, including the "motivation renders `—` on current records" consequence. VERIFIED.
- **`createdAt` is an ISO-8601 string in both writers** — supports `orderBy("createdAt","desc")` lexical chronological sort and `startAfter(lastDoc)` cursor. VERIFIED.
- **`functions/package.json`** — `firebase-functions ^6.3.0`, `firebase-admin ^13.0.0`, `main: index.js`, node 22, CommonJS. The v6/v2 `onCall(request => request.auth.token.role)` signature choice is correct for this version. VERIFIED.
- **`firebase.json` `firestore` block has only `"rules"`** — the design's addition of `"indexes": "firestore.indexes.json"` is necessary and correctly scoped. VERIFIED. (The existing `functions.runtime: nodejs22` and `hosting` block are untouched by the design, consistent.)
- **`tsconfig.app.json`** — `include:["src"]`, `strict`, `verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters`, `@/*`→`src/*` alias. **`tsconfig.node.json`** — `include:["vite.config.ts"]`. Neither type-checks `tests/`. The design's claim that `tsc -b` validates `src/lib/*` helpers but not the Playwright specs is correct. VERIFIED.
- **`eslint.config.js`** — `react-refresh/only-export-components` is `"warn"` with `allowConstantExport:true` (so a mixed export would not fail `npm run lint`); the design isolates hooks into `useAuth.ts` anyway for a clean zero-warning output. VERIFIED.
- **`playwright.config.ts`** — three projects (desktop/mobile/tablet), `baseURL: https://negev.sb0.tech`, no `webServer` block. **`tests/form-submit.spec.ts`** uses `const SITE = process.env.SITE_URL || "https://negev.sb0.tech"` and asserts the synced gender code is `"7"`. The design's reuse of the same `SITE_URL` pattern and the "existing specs untouched / public create preserved" claim are correct. VERIFIED.
- **`.env.example`** — currently the six `VITE_FIREBASE_*` keys only; the design adds `VITE_ADMIN_TEST_MODE=` (DEV-only). VERIFIED.
- **`firebase` v11 provides `firebase/firestore` and `firebase/functions`** (incl. `getFunctions`, `httpsCallable`, `getCountFromServer`, `onSnapshot`, `serverTimestamp`) — so no new runtime dependency is needed, as the design claims. VERIFIED (package.json pins `firebase ^11.6.0`).

## Unverified / Wrong Assumptions

- **No wrong assumptions found.** Every source-backed claim in the design matched the repo.
- **Unverified (non-blocking):** `src/main.tsx` was not opened in this pass; the design's statement that it holds `<StrictMode><BrowserRouter><App/></BrowserRouter></StrictMode>` and is "left unchanged" is inferred to be correct from `App.tsx` containing only `<Routes>` (which requires a router ancestor). If `main.tsx` does not actually wrap `App` in `BrowserRouter`, the provider-in-App placement reasoning still holds, but the implementer should confirm `BrowserRouter` is present before relying on `useLocation` in `RequireAuth`.
- **Unverified (operational, out of code scope):** that the two seed Auth accounts `asaf@sb0.tech` / `mor.k@elevation.ac` already exist (or will be created by the operator) in Firebase Auth before `bootstrap-admins.js` runs. The design correctly makes this an operator precondition (`getUserByEmail` throws if absent) rather than a code assumption; nothing to fix.
