import { test } from "@playwright/test";
import { ALICE, caption, click, demo, expect, pause, signIn } from "./helpers";

test.use({ viewport: { width: 390, height: 844 }, video: { mode: "on", size: { width: 390, height: 844 } }, isMobile: true, hasTouch: true });

demo("11-mobile", async ({ page }) => {
  await signIn(page, ALICE.email);
  await caption(page, "On a phone the sidebar tucks away", 1200);
  await click(page, page.getByRole("button", { name: "Toggle Sidebar" }), 900);
  await caption(page, "One tap brings it back", 1000);
  await click(page, page.getByRole("link", { name: "Shared with me" }), 1000);
  await caption(page, "Cards stack in one column", 800);
  await page.mouse.wheel(0, 500);
  await pause(page, 900);
  await page.mouse.wheel(0, -500);
  await pause(page, 600);
  await page.goto("/docs/doc_roadmap");
  await expect(page.locator(".tiptap h1")).toBeVisible();
  await caption(page, "The editor works the same, toolbar and all", 1600);
});
