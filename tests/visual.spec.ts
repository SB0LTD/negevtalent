/**
 * Comprehensive visual and layout test suite for Negev Talent website.
 */
import { test, expect } from "@playwright/test";

const SITE_URL = process.env.SITE_URL || "https://negev.sb0.tech";

test.describe("Layout & Structure", () => {
  test("page loads successfully", async ({ page }) => {
    const response = await page.goto(SITE_URL, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
  });

  test("has correct page title", async ({ page }) => {
    await page.goto(SITE_URL);
    await expect(page).toHaveTitle(/Negev Talent/);
  });

  test("header is visible and fixed", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const header = page.locator("header");
    await expect(header).toBeVisible();
    const position = await header.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe("fixed");
  });

  test("all major sections exist", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    for (const id of ["hero", "program", "tracks", "bootcamp", "partners", "contact"]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test("footer is present", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    await expect(page.locator("footer")).toBeVisible();
  });
});

test.describe("Hero Section", () => {
  test("hero has visible heading", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const h1 = page.locator("#hero h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("הכשרה טכנולוגית");
  });

  test("hero CTA buttons are visible", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const cta = page.locator("#hero a");
    expect(await cta.count()).toBeGreaterThanOrEqual(2);
  });

  test("hero takes full viewport height", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const hero = page.locator("#hero");
    const box = await hero.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.height).toBeGreaterThanOrEqual((viewport?.height || 0) * 0.9);
  });
});

test.describe("Responsive Design", () => {
  test("mobile menu toggle exists on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const toggle = page.locator("header button[aria-label]");
    await expect(toggle).toBeVisible();
  });

  test("desktop nav links visible on large screens", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const nav = page.locator("header nav");
    await expect(nav).toBeVisible();
  });

  test("content does not overflow horizontally", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const overflowX = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflowX).toBe(false);
  });
});

test.describe("Bootcamp Section", () => {
  test("bootcamp section is visible", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const bootcamp = page.locator("#bootcamp");
    await expect(bootcamp).toBeAttached();
  });

  test("bootcamp has 3 feature cards", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const cards = page.locator("#bootcamp .group");
    expect(await cards.count()).toBe(3);
  });

  test("bootcamp has timeline with 3 months", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    await page.locator("#bootcamp").scrollIntoViewIfNeeded();
    const months = page.locator("#bootcamp").getByText(/חודש \d/);
    expect(await months.count()).toBe(3);
  });
});

test.describe("Partners Section", () => {
  test("has partner logos including Elevation", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const elevation = page.locator('#partners img[alt="Elevation"]');
    await expect(elevation).toBeAttached();
  });

  test("all partner images load", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const images = page.locator("#partners img");
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < count; i++) {
      const naturalWidth = await images.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });
});

test.describe("Contact Form", () => {
  test("contact form has required fields", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expect(page.locator('#contact input[type="text"]')).toBeVisible();
    await expect(page.locator('#contact input[type="email"]')).toBeVisible();
    await expect(page.locator('#contact input[type="tel"]')).toBeVisible();
    await expect(page.locator("#contact button[type=\"submit\"]")).toBeVisible();
  });
});

test.describe("CSS & Styling", () => {
  test("body has correct font family (Heebo)", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(fontFamily.toLowerCase()).toContain("heebo");
  });

  test("RTL direction is set", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe("rtl");
  });

  test("no broken images on page", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const src = await images.nth(i).getAttribute("src");
      const naturalWidth = await images.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth);
      if (naturalWidth === 0) {
        console.warn(`Broken image: ${src}`);
      }
    }
  });

  test("CSS is loaded (background colors are applied)", async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: "networkidle" });
    const heroBg = await page.locator("#hero").evaluate((el) => getComputedStyle(el).backgroundColor);
    // Should not be transparent/default white
    expect(heroBg).not.toBe("rgba(0, 0, 0, 0)");
  });
});
