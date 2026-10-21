// Production-facing admin specs. These run against the LIVE deployed site
// (no VITE_ADMIN_TEST_MODE — that flag is DEV-only and tree-shaken out of the
// prod bundle), so the real Firebase AuthProvider is active. They verify the
// security perimeter and that the public site is unaffected, WITHOUT needing
// admin credentials.
//
//   $env:SITE_URL='https://negev.sb0.tech'
//   npx playwright test tests/admin-prod.spec.ts --project=desktop

import { test, expect } from "@playwright/test";

const SITE = process.env.SITE_URL || "https://negev.sb0.tech";

test.describe("Admin security perimeter (production)", () => {
  const protectedPaths = [
    "/admin",
    "/admin/applications",
    "/admin/admins",
    "/admin/applications/fixture-1",
  ];

  for (const path of protectedPaths) {
    test(`unauthenticated ${path} redirects to /admin/login`, async ({
      page,
    }) => {
      await page.goto(`${SITE}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForURL("**/admin/login", { timeout: 20000 });
      await expect(page).toHaveURL(/\/admin\/login$/);
    });

    test(`unauthenticated ${path} leaks no protected content`, async ({
      page,
    }) => {
      await page.goto(`${SITE}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForURL("**/admin/login", { timeout: 20000 });
      // The admin shell / nav must never render for an anonymous visitor.
      await expect(page.getByText("Negev Talent · ניהול")).toHaveCount(0);
      await expect(
        page.getByRole("link", { name: "ניהול מנהלים" }),
      ).toHaveCount(0);
      await expect(page.locator("table.adm-table")).toHaveCount(0);
    });
  }

  test("login page renders the Hebrew form + submit", async ({ page }) => {
    await page.goto(`${SITE}/admin/login`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("כניסת מנהלים")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "התחברות" }),
    ).toBeVisible();
  });

  test("empty submit shows inline validation, no navigation", async ({
    page,
  }) => {
    await page.goto(`${SITE}/admin/login`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "התחברות" }).click();
    await expect(page.getByText("יש למלא אימייל וסיסמה")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("bad credentials are rejected and stay on login", async ({ page }) => {
    await page.goto(`${SITE}/admin/login`, { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill("nobody@example.com");
    await page.locator('input[type="password"]').fill("wrong-password-123");
    await page.getByRole("button", { name: "התחברות" }).click();
    // Firebase rejects; the exact Hebrew message depends on project auth config
    // ("אימייל או סיסמה שגויים" for wrong creds, or the generic failure when a
    // provider/config is missing). Either way an error shows and we stay put —
    // the security invariant is that bad input never authenticates.
    const specific = page.getByText("אימייל או סיסמה שגויים");
    const generic = page.getByText("ההתחברות נכשלה, נסו שוב");
    await expect(specific.or(generic).first()).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/\/admin\/login$/);
    // Must NOT have reached the admin shell.
    await expect(page.getByText("Negev Talent · ניהול")).toHaveCount(0);
  });
});

test.describe("Public site unaffected by admin deploy (production)", () => {
  test("home page still loads with the apply section", async ({ page }) => {
    await page.goto(`${SITE}/`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#apply")).toBeVisible({ timeout: 20000 });
  });
});
