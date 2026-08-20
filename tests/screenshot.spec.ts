/**
 * Screenshot utility — captures the live site at various viewports and sections.
 * Usage: npx playwright test tests/screenshot.ts --project=desktop
 * Or run the dedicated script: npm run screenshot
 */
import { test } from "@playwright/test";

const SITE_URL = process.env.SITE_URL || "https://negev.sb0.tech";

const sections = ["hero", "program", "tracks", "bootcamp", "partners", "contact"];

test.describe("Screenshot capture", () => {
  test("full page - desktop", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    // Scroll through the entire page to trigger whileInView animations
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
      const height = document.body.scrollHeight;
      for (let i = 0; i < height; i += 400) {
        window.scrollTo(0, i);
        await delay(100);
      }
      window.scrollTo(0, 0);
      await delay(500);
    });
    await page.screenshot({
      path: "tests/screenshots/full-page-desktop.png",
      fullPage: true,
    });
  });

  test("full page - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
      const height = document.body.scrollHeight;
      for (let i = 0; i < height; i += 400) {
        window.scrollTo(0, i);
        await delay(100);
      }
      window.scrollTo(0, 0);
      await delay(500);
    });
    await page.screenshot({
      path: "tests/screenshots/full-page-mobile.png",
      fullPage: true,
    });
  });

  test("viewport sections - desktop", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    for (const section of sections) {
      const el = page.locator(`#${section}`);
      if (await el.count() > 0) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `tests/screenshots/section-${section}-desktop.png`,
        });
      }
    }
  });

  test("viewport sections - mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    for (const section of sections) {
      const el = page.locator(`#${section}`);
      if (await el.count() > 0) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `tests/screenshots/section-${section}-mobile.png`,
        });
      }
    }
  });

  test("above the fold - first impression", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "tests/screenshots/above-fold-desktop.png",
    });
  });
});
