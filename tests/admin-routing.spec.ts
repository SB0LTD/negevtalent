// Routing/login specs — run against the PRODUCTION vite preview build (no
// VITE_ADMIN_TEST_MODE, so the live AuthProvider is active and an unauthenticated
// visitor is redirected to the login screen).
//
//   npm run build
//   npx vite preview --port 4173            (background)
//   $env:SITE_URL='http://localhost:4173'; npx playwright test tests/admin-routing.spec.ts --project=desktop

import { test, expect } from "@playwright/test";

const SITE = process.env.SITE_URL || "https://negev.sb0.tech";

test.describe("Admin routing (production build)", () => {
  test("visiting /admin unauthenticated redirects to /admin/login", async ({
    page,
  }) => {
    await page.goto(`${SITE}/admin`, { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/admin/login", { timeout: 15000 });
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("/admin/login renders the Hebrew login form and submit button", async ({
    page,
  }) => {
    await page.goto(`${SITE}/admin/login`, { waitUntil: "domcontentloaded" });

    await expect(page.getByText("כניסת מנהלים")).toBeVisible();
    // Email + password fields (by their Hebrew labels).
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Submit button.
    await expect(
      page.getByRole("button", { name: "התחברות" }),
    ).toBeVisible();
  });
});
