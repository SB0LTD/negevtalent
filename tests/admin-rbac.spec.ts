// RBAC / offline list / detail / status specs — run against the DEV server with
// DEV=true + VITE_ADMIN_TEST_MODE=1, so AuthProvider serves a synchronous fake
// user and all data access returns in-memory fixtures (no firebase calls).
//
//   $env:VITE_ADMIN_TEST_MODE='1'; npm run dev     (background)
//   $env:SITE_URL='http://localhost:5173'; npx playwright test tests/admin-rbac.spec.ts --project=desktop
//
// The role for each test is injected via window.__ADMIN_TEST_ROLE__, set with
// page.addInitScript BEFORE the app bundle runs.

import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const SITE = process.env.SITE_URL || "http://localhost:5173";

async function loadAs(page: Page, role: string, path = "/admin") {
  await page.addInitScript((r) => {
    (window as unknown as { __ADMIN_TEST_ROLE__?: string }).__ADMIN_TEST_ROLE__ =
      r;
  }, role);
  await page.goto(`${SITE}${path}`, { waitUntil: "domcontentloaded" });
}

test.describe("RBAC nav + control gating", () => {
  test("viewer sees no admin-management nav and no status-edit control", async ({
    page,
  }) => {
    await loadAs(page, "viewer", "/admin/applications");

    // No admin-management nav item.
    await expect(
      page.getByRole("link", { name: "ניהול מנהלים" }),
    ).toHaveCount(0);

    // Applications list is visible (viewer can read). Per the approved design,
    // canExport is viewer-and-up (the CSV is a client-side export of data the
    // viewer already reads), so the export button IS present for a viewer.
    await expect(page.getByRole("heading", { name: "מועמדים" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "ייצוא CSV" }),
    ).toBeVisible();

    // The write control is gated: a viewer cannot edit status, so the detail
    // view shows a read-only status badge and NO status <select>.
    await page.getByRole("link", { name: "יוסי לוי" }).click();
    await expect(page.getByRole("heading", { name: "יוסי לוי" })).toBeVisible();
    await expect(page.locator("select.adm-select")).toHaveCount(0);
  });

  test("admin sees applications controls but no admin-management nav", async ({
    page,
  }) => {
    await loadAs(page, "admin", "/admin/applications");

    await expect(
      page.getByRole("link", { name: "ניהול מנהלים" }),
    ).toHaveCount(0);

    // Export control present.
    await expect(
      page.getByRole("button", { name: "ייצוא CSV" }),
    ).toBeVisible();
    // Status filter select present.
    await expect(
      page.getByRole("combobox", { name: "סינון לפי סטטוס" }),
    ).toBeVisible();
  });

  test("superadmin sees everything including ניהול מנהלים", async ({
    page,
  }) => {
    await loadAs(page, "superadmin", "/admin/applications");

    await expect(
      page.getByRole("link", { name: "ניהול מנהלים" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "ייצוא CSV" }),
    ).toBeVisible();
  });
});

test.describe("List / detail / status over in-memory fixtures", () => {
  test("admin changes a status and the audit entry appears", async ({
    page,
  }) => {
    // fixture-2 (יוסי לוי) has a pre-seeded history entry.
    await loadAs(page, "admin", "/admin/applications");
    await page.getByRole("link", { name: "יוסי לוי" }).click();

    await expect(page.getByRole("heading", { name: "יוסי לוי" })).toBeVisible();

    // The status select is editable for an admin; change it.
    const select = page.locator("select.adm-select");
    await expect(select).toBeVisible();
    await select.selectOption("interview");

    // The seeded audit history entry is rendered.
    await expect(page.getByText("היסטוריית שינויים")).toBeVisible();
    await expect(page.getByText("asaf@sb0.tech", { exact: false })).toBeVisible();
  });

  test("status filter over fixtures is client-side and needs no index", async ({
    page,
  }) => {
    await loadAs(page, "admin", "/admin/applications");

    // All three fixtures load initially.
    await expect(page.getByRole("link", { name: "דנה כהן" })).toBeVisible();
    await expect(page.getByRole("link", { name: "יוסי לוי" })).toBeVisible();
    await expect(page.getByRole("link", { name: "אבי מזרחי" })).toBeVisible();

    // Filter to "contacted" (נוצר קשר) → only יוסי לוי (fixture-2) remains.
    await page
      .getByRole("combobox", { name: "סינון לפי סטטוס" })
      .selectOption("contacted");

    await expect(page.getByRole("link", { name: "יוסי לוי" })).toBeVisible();
    await expect(page.getByRole("link", { name: "דנה כהן" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "אבי מזרחי" })).toHaveCount(0);
  });
});

test.describe("Cal.com meeting scheduling (test-mode booker)", () => {
  test("viewer cannot see the schedule-meeting button", async ({ page }) => {
    await loadAs(page, "viewer", "/admin/applications");
    await page.getByRole("link", { name: "דנה כהן" }).click();
    await expect(page.getByRole("heading", { name: "דנה כהן" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "קביעת פגישה" }),
    ).toHaveCount(0);
  });

  test("admin schedules a meeting; status flips to interview and meeting shows", async ({
    page,
  }) => {
    // fixture-1 (דנה כהן) starts as "new" with no meeting.
    await loadAs(page, "admin", "/admin/applications");
    await page.getByRole("link", { name: "דנה כהן" }).click();
    await expect(page.getByRole("heading", { name: "דנה כהן" })).toBeVisible();

    // Open the animated booking modal.
    await page.getByRole("button", { name: "קביעת פגישה" }).click();
    await expect(page.getByRole("dialog", { name: "קביעת פגישה" })).toBeVisible();

    // The test-mode stand-in replaces the live Cal embed.
    const booker = page.getByTestId("cal-test-booker");
    await expect(booker).toBeVisible();
    await booker.getByRole("button", { name: "אשר קביעת פגישה" }).click();

    // Modal closes; meeting is recorded and status became "ראיון" (interview).
    await expect(
      page.getByRole("dialog", { name: "קביעת פגישה" }),
    ).toHaveCount(0);
    await expect(page.getByText("נקבעה פגישה")).toBeVisible();
    await expect(page.locator("select.adm-select")).toHaveValue("interview");
  });
});
