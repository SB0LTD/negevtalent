// Live-credential spec — a real signInWithEmailAndPassword against a seeded
// admin user. Skipped by default: it only runs when BOTH ADMIN_TEST_EMAIL and
// ADMIN_TEST_PASSWORD are present in the environment, and against a build that
// is wired to a real Firebase project (NOT the VITE_ADMIN_TEST_MODE fixtures).
//
//   $env:ADMIN_TEST_EMAIL='asaf@sb0.tech'; $env:ADMIN_TEST_PASSWORD='…'
//   $env:SITE_URL='https://negev.sb0.tech'
//   npx playwright test tests/admin-live.spec.ts --project=desktop

import { test, expect } from "@playwright/test";

const SITE = process.env.SITE_URL || "https://negev.sb0.tech";

test.describe("Admin live login (requires seeded credentials)", () => {
  test.skip(
    !process.env.ADMIN_TEST_EMAIL || !process.env.ADMIN_TEST_PASSWORD,
    "requires live admin credentials",
  );

  test("a seeded admin can sign in and reach the dashboard", async ({
    page,
  }) => {
    await page.goto(`${SITE}/admin/login`, { waitUntil: "domcontentloaded" });

    await page
      .locator('input[type="email"]')
      .fill(process.env.ADMIN_TEST_EMAIL as string);
    await page
      .locator('input[type="password"]')
      .fill(process.env.ADMIN_TEST_PASSWORD as string);
    await page.getByRole("button", { name: "התחברות" }).click();

    // On success the login page redirects to /admin and the shell renders.
    await page.waitForURL("**/admin", { timeout: 20000 });
    await expect(page.getByText("Negev Talent · ניהול")).toBeVisible();
  });
});
