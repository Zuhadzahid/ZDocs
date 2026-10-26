import { caption, click, demo, expect, pause } from "./helpers";

demo("00-landing", async ({ page }) => {
  await page.goto("/");
  await page.mouse.move(640, 360);
  await caption(page, "ZDocs: a small docs app for notes, drafts and quick sharing", 1600);

  // Hero
  await page.mouse.move(300, 250, { steps: 20 });
  await caption(page, "Write it down. Share it in seconds.", 1400);

  // Timeline
  const region = page.getByRole("region", { name: "What you can do with ZDocs" });
  await region.scrollIntoViewIfNeeded();
  await pause(page, 600);
  await caption(page, "Seven things you get, in one quiet place", 1000);

  const box = (await region.boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  // Drag through the first few cards, then flick.
  await page.mouse.move(cx + 120, cy, { steps: 10 });
  await page.mouse.down();
  await page.mouse.move(cx - 220, cy, { steps: 25 });
  await page.mouse.up();
  await pause(page, 1100);
  await page.mouse.move(cx + 140, cy, { steps: 8 });
  await page.mouse.down();
  await page.mouse.move(cx - 260, cy, { steps: 12 });
  await page.mouse.up();
  await pause(page, 1200);
  await caption(page, "Drag, flick, or use the arrow keys", 900);

  // Keyboard and buttons: back to the start, then step forward.
  await region.focus();
  await page.keyboard.press("Home");
  await pause(page, 1100);
  await click(page, page.getByRole("button", { name: "Next feature" }), 800);
  await click(page, page.getByRole("button", { name: "Next feature" }), 800);
  await click(page, page.getByRole("button", { name: "Previous feature" }), 800);

  // Sign-in card
  await page.mouse.move(640, 100, { steps: 10 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await pause(page, 900);
  await caption(page, "Sign in or create an account right from the landing page", 800);
  await click(page, page.getByRole("tab", { name: "Create account" }), 800);
  await click(page, page.getByRole("tab", { name: "Sign in" }), 800);
  await expect(page.getByRole("button", { name: "Alice", exact: true })).toBeVisible();
});
