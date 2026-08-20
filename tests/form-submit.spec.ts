import { test, expect } from "@playwright/test";

const SITE_URL = "https://negev.sb0.tech";

test("wizard form completes successfully", async ({ page }) => {
  await page.goto(SITE_URL, { waitUntil: "networkidle" });

  // Scroll to form
  await page.locator("#apply").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Step 1 — fill personal info
  await page.getByPlaceholder("שם מלא").fill("ישראל ישראלי");
  await page.getByPlaceholder("טלפון").fill("0501234567");
  await page.getByPlaceholder("אימייל").fill("test@example.com");

  // Screenshot step 1
  await page.screenshot({ path: "tests/screenshots/form-step1.png" });

  // Click next
  await page.getByRole("button", { name: "המשך" }).click();
  await page.waitForTimeout(400);

  // Step 2 — fill background
  await page.getByPlaceholder("עיר מגורים").fill("באר שבע");
  await page.locator("select").first().selectOption("25-30");
  await page.locator("select").nth(1).selectOption("אין ניסיון");

  // Screenshot step 2
  await page.screenshot({ path: "tests/screenshots/form-step2.png" });

  // Submit
  await page.getByRole("button", { name: "שליחה" }).click();
  await page.waitForTimeout(2000);

  // Screenshot success
  await page.screenshot({ path: "tests/screenshots/form-done.png" });

  // Verify success state
  await expect(page.getByText("תודה")).toBeVisible();
});
