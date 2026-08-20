import { test, expect } from "@playwright/test";

const SITE = "https://negev.sb0.tech";

test.describe("Apply Wizard — Full E2E", () => {

  test.describe("Step 1 — Validation", () => {

    test("shows errors when submitting empty fields", async ({ page }) => {
      await page.goto(SITE, { waitUntil: "networkidle" });
      await page.locator("#apply").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Click next without filling anything
      await page.getByRole("button", { name: "המשך" }).click();
      await page.waitForTimeout(300);

      // Should show validation errors
      await expect(page.getByText("שדה חובה").first()).toBeVisible();
      
      // Should still be on step 1
      await expect(page.getByText("ספרו לנו קצת על עצמכם")).toBeVisible();
    });

    test("validates phone format", async ({ page }) => {
      await page.goto(SITE, { waitUntil: "networkidle" });
      await page.locator("#apply").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Fill invalid phone
      const phoneInput = page.locator('#apply input[type="tel"]');
      await phoneInput.fill("123");
      await phoneInput.blur();
      await page.waitForTimeout(200);

      await expect(page.getByText("מספר טלפון לא תקין")).toBeVisible();
    });

    test("validates email format", async ({ page }) => {
      await page.goto(SITE, { waitUntil: "networkidle" });
      await page.locator("#apply").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Fill invalid email
      const emailInput = page.locator('#apply input[type="email"]');
      await emailInput.fill("notanemail");
      await emailInput.blur();
      await page.waitForTimeout(200);

      await expect(page.getByText("כתובת אימייל לא תקינה")).toBeVisible();
    });

    test("formats phone number as user types", async ({ page }) => {
      await page.goto(SITE, { waitUntil: "networkidle" });
      await page.locator("#apply").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const phoneInput = page.locator('#apply input[type="tel"]');
      await phoneInput.fill("0501234567");
      await page.waitForTimeout(100);

      // Should be formatted with dash
      const val = await phoneInput.inputValue();
      expect(val).toContain("-");
    });

    test("clears errors on valid input", async ({ page }) => {
      await page.goto(SITE, { waitUntil: "networkidle" });
      await page.locator("#apply").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Trigger error
      const emailInput = page.locator('#apply input[type="email"]');
      await emailInput.fill("bad");
      await emailInput.blur();
      await page.waitForTimeout(200);
      await expect(page.getByText("כתובת אימייל לא תקינה")).toBeVisible();

      // Fix it
      await emailInput.fill("good@email.com");
      await page.waitForTimeout(200);

      // Error should be gone
      await expect(page.getByText("כתובת אימייל לא תקינה")).not.toBeVisible();
    });
  });

  test.describe("Step 1 → Step 2 navigation", () => {

    test("advances to step 2 with valid data", async ({ page }) => {
      await page.goto(SITE, { waitUntil: "networkidle" });
      await page.locator("#apply").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Fill valid data
      await page.getByPlaceholder("ישראל ישראלי").fill("טסט משתמש");
      await page.locator('#apply input[type="tel"]').fill("0501234567");
      await page.locator('#apply input[type="email"]').fill("test@test.com");

      // Click next
      await page.getByRole("button", { name: "המשך" }).click();
      await page.waitForTimeout(400);

      // Should be on step 2
      await expect(page.getByText("עוד קצת פרטים")).toBeVisible();
    });

    test("back button returns to step 1 with data preserved", async ({ page }) => {
      await page.goto(SITE, { waitUntil: "networkidle" });
      await page.locator("#apply").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Fill and advance
      await page.getByPlaceholder("ישראל ישראלי").fill("טסט חזרה");
      await page.locator('#apply input[type="tel"]').fill("0509876543");
      await page.locator('#apply input[type="email"]').fill("back@test.com");
      await page.getByRole("button", { name: "המשך" }).click();
      await page.waitForTimeout(400);

      // Go back
      await page.getByRole("button", { name: "חזרה" }).click();
      await page.waitForTimeout(400);

      // Data should be preserved
      await expect(page.getByPlaceholder("ישראל ישראלי")).toHaveValue("טסט חזרה");
    });
  });

  test.describe("Step 2 — City autocomplete", () => {

    test("shows city suggestions when typing", async ({ page }) => {
      await page.goto(SITE, { waitUntil: "networkidle" });
      await page.locator("#apply").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Get to step 2
      await page.getByPlaceholder("ישראל ישראלי").fill("טסט ערים");
      await page.locator('#apply input[type="tel"]').fill("0501111111");
      await page.locator('#apply input[type="email"]').fill("city@test.com");
      await page.getByRole("button", { name: "המשך" }).click();
      await page.waitForTimeout(400);

      // Type in city field
      await page.getByPlaceholder("התחילו להקליד...").fill("באר");
      await page.waitForTimeout(300);

      // Should show "באר שבע" in suggestions
      await expect(page.getByText("באר שבע")).toBeVisible();
    });

    test("selects city from autocomplete", async ({ page }) => {
      await page.goto(SITE, { waitUntil: "networkidle" });
      await page.locator("#apply").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Get to step 2
      await page.getByPlaceholder("ישראל ישראלי").fill("טסט בחירה");
      await page.locator('#apply input[type="tel"]').fill("0502222222");
      await page.locator('#apply input[type="email"]').fill("select@test.com");
      await page.getByRole("button", { name: "המשך" }).click();
      await page.waitForTimeout(400);

      // Type and select
      await page.getByPlaceholder("התחילו להקליד...").fill("אופ");
      await page.waitForTimeout(300);
      await page.getByText("אופקים").click();
      await page.waitForTimeout(200);

      // Input should have the selected value
      await expect(page.getByPlaceholder("התחילו להקליד...")).toHaveValue("אופקים");
    });
  });

  test.describe("Full submission flow", () => {

    test("completes the full wizard and shows success", async ({ page }) => {
      await page.goto(SITE, { waitUntil: "networkidle" });
      await page.locator("#apply").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Step 1
      await page.getByPlaceholder("ישראל ישראלי").fill("Playwright Test");
      await page.locator('#apply input[type="tel"]').fill("0503333333");
      await page.locator('#apply input[type="email"]').fill("playwright@e2e.test");
      await page.getByRole("button", { name: "המשך" }).click();
      await page.waitForTimeout(400);

      // Step 2
      await page.getByPlaceholder("התחילו להקליד...").fill("באר שבע");
      await page.locator("select").first().selectOption("25-30");
      await page.locator("select").nth(1).selectOption("אין ניסיון");

      // Submit
      await page.getByRole("button", { name: "שליחה" }).click();
      await page.waitForTimeout(3000);

      // Should show success
      await expect(page.getByText("תודה!")).toBeVisible();
      await expect(page.getByText("קיבלנו את הפרטים שלכם")).toBeVisible();

      // Screenshot
      await page.screenshot({ path: "tests/screenshots/form-e2e-success.png" });
    });

    test("step 2 requires city before submission", async ({ page }) => {
      await page.goto(SITE, { waitUntil: "networkidle" });
      await page.locator("#apply").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Step 1
      await page.getByPlaceholder("ישראל ישראלי").fill("No City Test");
      await page.locator('#apply input[type="tel"]').fill("0504444444");
      await page.locator('#apply input[type="email"]').fill("nocity@test.com");
      await page.getByRole("button", { name: "המשך" }).click();
      await page.waitForTimeout(400);

      // Try to submit without city
      await page.getByRole("button", { name: "שליחה" }).click();
      await page.waitForTimeout(300);

      // Should show city required error
      await expect(page.getByText("שדה חובה")).toBeVisible();

      // Should NOT show success
      await expect(page.getByText("תודה!")).not.toBeVisible();
    });
  });

  test.describe("Progress bar", () => {

    test("progress bar advances with steps", async ({ page }) => {
      await page.goto(SITE, { waitUntil: "networkidle" });
      await page.locator("#apply").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      // Check step 1 label is active
      const step1Label = page.locator("#apply").getByText("פרטים אישיים");
      await expect(step1Label).toBeVisible();

      // Fill and advance
      await page.getByPlaceholder("ישראל ישראלי").fill("Progress Test");
      await page.locator('#apply input[type="tel"]').fill("0505555555");
      await page.locator('#apply input[type="email"]').fill("progress@test.com");
      await page.getByRole("button", { name: "המשך" }).click();
      await page.waitForTimeout(500);

      // Take screenshot showing step 2 active
      await page.screenshot({ path: "tests/screenshots/form-progress-step2.png" });
    });
  });
});
