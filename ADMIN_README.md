# Negev Talent — Admin Panel Operator Guide

This document covers operating the admin panel: bootstrapping the first
superadmins, deploying, the required Firestore index, test commands, the
DEV-only test flag, where to view submissions, and the role model.

All admin UI is additive and lives under `/admin/*`. The public apply flow is
untouched.

---

## 1. First-superadmin bootstrap

No superadmin exists on a fresh project, so the first ones are seeded with a
standalone script. The two seed emails are hardcoded in the script:

- `asaf@sb0.tech`
- `mor.k@elevation.ac`

### Steps

1. **Create the Auth accounts first.** In the Firebase Console (Authentication)
   or via the Admin SDK, create an email/password account for each seed email.
   Passwords are set there, never in code. The script only grants a role to an
   account that already exists; it skips emails with no Auth account.

2. **Authenticate the script with admin credentials.** From the `functions/`
   directory, use Application Default Credentials:

   ```bash
   gcloud auth application-default login
   ```

   Alternatively, set `GOOGLE_APPLICATION_CREDENTIALS` to the path of a
   service-account key JSON. **Never commit a service-account key.**

3. **Run the bootstrap script** from `functions/`:

   ```bash
   node scripts/bootstrap-admins.js
   ```

   For each seed email it sets the `superadmin` custom claim on the Auth user
   and upserts `admins/{uid}` with `revoked: false` and grant metadata
   (`grantedByEmail: "bootstrap"`).

The script is **idempotent** — re-running re-asserts the same claim and
`revoked: false`, so it is safe to run again (for example after the second seed
account is finally created).

After bootstrap, the seeded superadmins can grant/revoke other admins from the
in-app admin-management screen (`/admin/admins`).

---

## 2. Deploy

Deploy rules, indexes, functions, and hosting together:

```bash
firebase deploy --only firestore:rules,firestore:indexes,functions,hosting
```

### Index dependency (important)

The applications list filters by status using a server-side query that combines
`where("status","==",...)` with `orderBy("createdAt","desc")`. This requires the
composite index declared in `firestore.indexes.json`:

- `applications`: `status` ASC, `createdAt` DESC

**The index must be deployed before live status filtering works.** Until the
index exists, the status-filtered query throws `failed-precondition`. The UI
handles this as the load error **"שגיאת טעינה, נסו לרענן"** (with a retry).
Deploying `firestore:indexes` alongside `firestore:rules` (as in the command
above) avoids this. Note that Firestore index builds can take a few minutes to
finish after the deploy returns.

`firebase.json` registers the index file in its `firestore` block
(`"indexes": "firestore.indexes.json"`), so `--only firestore:indexes` has
something to deploy.

---

## 3. Testing

All specs are Playwright (`@playwright/test`). There is no separate unit-test
framework — pure-helper unit tests are written as Playwright `test()` blocks
with no page. **Always pin `--project=desktop`** so no-page unit specs run once
rather than once per device project.

Specs read their base URL from `const SITE = process.env.SITE_URL || 'https://negev.sb0.tech'`,
so set `SITE_URL` to point at the target for each run.

### Unit spec (pure helpers, no page, no server)

```bash
npx playwright test tests/unit.spec.ts --project=desktop
```

### Routing / login (against a production preview build)

Build, serve the build with Vite preview, then point the spec at it:

```bash
npm run build
npx vite preview --port 4173
# in another shell:
SITE_URL=http://localhost:4173 npx playwright test tests/admin-routing.spec.ts --project=desktop
```

On PowerShell, set the env var inline for the session, e.g.
`$env:SITE_URL="http://localhost:4173"` before the `npx playwright test ...`
command.

### RBAC / offline / list / detail / status (against the dev server with the test flag)

These run against the dev server with the DEV-only test flag enabled so RBAC
and data flows are exercised with an in-memory fixture (no real Firebase):

```bash
# start the dev server with the test flag:
VITE_ADMIN_TEST_MODE=1 npm run dev
# in another shell:
SITE_URL=http://localhost:5173 npx playwright test tests/admin-rbac.spec.ts --project=desktop
```

On PowerShell: `$env:VITE_ADMIN_TEST_MODE="1"; npm run dev` for the server, and
`$env:SITE_URL="http://localhost:5173"` before the test command.

### Build and lint

```bash
npm run build   # tsc -b && vite build — must exit 0
npm run lint    # eslint . — expected clean (zero warnings)
```

> Do **not** run a live `firebase deploy` or live Firestore queries as part of
> automated testing. Use the DEV + test-flag in-memory path instead.

---

## 4. The DEV-only `VITE_ADMIN_TEST_MODE` flag

`VITE_ADMIN_TEST_MODE=1` enables an in-memory RBAC/data fixture so the admin
panel can be driven in tests without real Firebase Auth or Firestore.

It is **double-gated**: every guard that reads `VITE_ADMIN_TEST_MODE` also
requires `import.meta.env.DEV`. Because `import.meta.env.DEV` is `false` in any
`vite build`, the flag's code paths are tree-shaken out of every production
bundle — setting the env var at build time has **no effect** on a production
build.

**Never set `VITE_ADMIN_TEST_MODE` for a deploy.** It is a development/test-only
flag. `.env.example` documents it with this same warning, and `.env` is
gitignored.

---

## 5. Where to see submissions

Applications submitted through the public apply form land in the Firestore
`applications` collection and are viewed in the admin panel:

1. Sign in at **`/admin/login`** with an admin account.
2. **`/admin`** — dashboard with summary counts (total, per-status, recent).
3. **`/admin/applications`** — the full list: paginated, status-filterable,
   client-side searchable/sortable, with CSV export.
4. **`/admin/applications/:id`** — a single application's detail: all fields,
   the status control, and the audit history.

---

## 6. Roles

RBAC uses a single `role` custom claim on the Firebase Auth user
(`superadmin` | `admin` | `viewer`), mirrored in `admins/{uid}` for listing.
It is enforced in three layers: Firestore rules (`request.auth.token.role`),
Cloud Functions `onCall` handlers (verified server-side), and the React UI
(controls hidden/disabled).

| Role         | View applications | Change status | Export CSV | Manage admins |
|--------------|-------------------|---------------|------------|---------------|
| `superadmin` | ✅                 | ✅             | ✅          | ✅             |
| `admin`      | ✅                 | ✅             | ✅          | ❌             |
| `viewer`     | ✅                 | ❌             | ✅          | ❌             |

Notes:

- A signed-in user **with no role claim** is denied all admin data at the rules
  layer and sees an access-denied screen in the UI.
- Status changes go **only** through the `setApplicationStatus` callable
  (admin SDK), which writes a non-forgeable `history` audit entry. There is no
  client-writable path to `status`.
- Admin management (`grantRole`, `revokeAdmin`, `listAdmins`) is
  **superadmin-only**. A superadmin cannot change or revoke their own role, and
  the last non-revoked superadmin cannot be revoked
  (**"לא ניתן להסיר את מנהל העל האחרון"**).
