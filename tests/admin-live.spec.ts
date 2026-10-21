// Live-credential spec — real signInWithEmailAndPassword against a seeded
// superadmin, exercising the full authenticated admin surface on PRODUCTION.
// Skipped unless BOTH ADMIN_TEST_EMAIL and ADMIN_TEST_PASSWORD are set. It runs
// against the real Firebase project (NOT the VITE_ADMIN_TEST_MODE fixtures).
//
//   $env:ADMIN_TEST_EMAIL='asaf@sb0.tech'; $env:ADMIN_TEST_PASSWORD='…'
//   $env:SITE_URL='https://negev.sb0.tech'
//   npx playwright test tests/admin-live.spec.ts --project=desktop

import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const SITE = process.env.SITE_URL || "https://negev.sb0.tech";
const EMAIL = process.env.ADMIN_TEST_EMAIL;
const PASSWORD = process.env.ADMIN_TEST_PASSWORD;

async function login(page: Page) {
  await page.goto(`${SITE}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(EMAIL as string);
  await page.locator('input[type="password"]').fill(PASSWORD as string);
  await page.getByRole("button", { name: "התחברות" }).click();
  await page.waitForURL("**/admin", { timeout: 25000 });
  await expect(page.getByText("Negev Talent · ניהול")).toBeVisible();
}

test.describe("Admin live (seeded superadmin)", () => {
  test.skip(
    !EMAIL || !PASSWORD,
    "requires live admin credentials (ADMIN_TEST_EMAIL / ADMIN_TEST_PASSWORD)",
  );

  test("superadmin signs in and reaches the dashboard", async ({ page }) => {
    await login(page);
    // Superadmin-only nav item must be present.
    await expect(
      page.getByRole("link", { name: "ניהול מנהלים" }),
    ).toBeVisible();
  });

  test("applications list renders and is reachable", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "מועמדים" }).click();
    await expect(page.getByRole("heading", { name: "מועמדים" })).toBeVisible();
    // The list table (or an explicit empty state) must render — not an error.
    const table = page.locator("table.adm-table");
    const empty = page.getByText("אין מועמדים");
    await expect(table.or(empty).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("שגיאת טעינה", { exact: false })).toHaveCount(
      0,
    );
  });

  test("admin-management page lists the seeded superadmins", async ({
    page,
  }) => {
    await login(page);
    await page.getByRole("link", { name: "ניהול מנהלים" }).click();
    // Both seed accounts should appear as superadmins.
    await expect(page.getByText("asaf@sb0.tech")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("mor.k@elevation.ac")).toBeVisible();
  });

  test("opening a candidate detail shows the schedule-meeting control", async ({
    page,
  }) => {
    await login(page);
    await page.getByRole("link", { name: "מועמדים" }).click();

    // If there is at least one application, open the first row's detail and
    // verify the editor controls (status select + schedule button) render.
    const firstRow = page.locator("table.adm-table tbody tr a").first();
    const count = await page.locator("table.adm-table tbody tr").count();
    test.skip(count === 0, "no applications in the live dataset to open");

    await firstRow.click();
    await expect(page.locator("select.adm-select")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("button", { name: /קביעת פגישה/ }),
    ).toBeVisible();

    // The scheduling modal opens with the live Cal.com embed container.
    await page.getByRole("button", { name: /קביעת פגישה/ }).click();
    await expect(
      page.getByRole("dialog", { name: "קביעת פגישה" }),
    ).toBeVisible();
    await expect(
      page.getByText("פגישה עם אסף לפי הזמינות ביומן"),
    ).toBeVisible();
  });
});
