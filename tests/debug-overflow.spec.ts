import { test, expect } from "@playwright/test";

test("debug bootcamp overflow", async ({ page }) => {
  await page.goto("https://negev.sb0.tech", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Temporarily remove overflow-x hidden to see real scroll width
  await page.evaluate(() => {
    document.documentElement.style.overflowX = "visible";
    document.body.style.overflowX = "visible";
  });

  const info = await page.evaluate(() => {
    const bootcamp = document.getElementById("bootcamp");
    const allDivs = bootcamp?.querySelectorAll(":scope > div") as NodeListOf<HTMLElement>;
    const contentDiv = allDivs?.[1]; // second direct child (first is blob wrapper)
    const grid = contentDiv?.querySelector(".grid") as HTMLElement;
    
    return {
      viewportWidth: window.innerWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bootcampRect: bootcamp?.getBoundingClientRect(),
      containerRect: contentDiv?.getBoundingClientRect(),
      gridRect: grid?.getBoundingClientRect(),
      gridChildren: Array.from(grid?.children || []).map((child) => ({
        text: (child as HTMLElement).innerText.substring(0, 30),
        rect: child.getBoundingClientRect(),
      })),
    };
  });

  console.log(JSON.stringify(info, null, 2));
  
  // The test will always pass, we just want the output
  expect(true).toBe(true);
});
