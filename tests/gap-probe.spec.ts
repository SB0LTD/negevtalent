import { test } from "@playwright/test";

test("measure gaps between sections", async ({ page }) => {
  await page.goto("https://negev.sb0.tech", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const ids = ["what", "program", "audience", "partners", "apply"];
    const rects: Record<string, { top: number; bottom: number; height: number }> = {};
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        const r = el.getBoundingClientRect();
        rects[id] = { top: Math.round(r.top + window.scrollY), bottom: Math.round(r.bottom + window.scrollY), height: Math.round(r.height) };
      }
    }
    // Also the code block bottom vs program heading top
    const code = document.querySelector("#what pre");
    const programHeading = document.querySelector("#program h2");
    const codeBottom = code ? Math.round(code.getBoundingClientRect().bottom + window.scrollY) : null;
    const headingTop = programHeading ? Math.round(programHeading.getBoundingClientRect().top + window.scrollY) : null;
    return { rects, codeBottom, headingTop, gapCodeToHeading: (headingTop && codeBottom) ? headingTop - codeBottom : null };
  });

  console.log(JSON.stringify(info, null, 2));
});
