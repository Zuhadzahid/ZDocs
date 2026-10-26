import { ALICE, caption, click, demo, deleteDocument, expect, pause, signIn, type } from "./helpers";

demo("01-write-it-down", async ({ page }) => {
  await signIn(page, ALICE.email);
  await caption(page, "Start a new document from the sidebar", 900);
  await click(page, page.getByRole("button", { name: "New document" }).first(), 800);
  await page.waitForURL(/\/docs\//);
  const id = page.url().split("/docs/")[1];

  try {
    await caption(page, "Give it a title", 500);
    await click(page, page.getByLabel("Document title"), 100);
    await page.keyboard.press("Control+a");
    await type(page, "Weekend plan");

    await caption(page, "Just type. Headings, lists and formatting from the toolbar", 600);
    const body = page.getByRole("textbox", { name: "Document body" });
    await click(page, body, 200);
    await type(page, "Things to do this weekend");
    await click(page, page.getByLabel("Text style"), 100);
    await page.getByLabel("Text style").selectOption("h1");
    await click(page, body, 100);
    await page.keyboard.press("Control+End");
    await page.keyboard.press("Enter");
    await click(page, page.getByRole("button", { name: "Bulleted list" }), 100);
    await type(page, "Fix the bike");
    await page.keyboard.press("Enter");
    await type(page, "Call ");
    await page.keyboard.down("Control");
    await page.keyboard.press("b");
    await page.keyboard.up("Control");
    await type(page, "grandma");
    await page.keyboard.down("Control");
    await page.keyboard.press("b");
    await page.keyboard.up("Control");
    await page.keyboard.press("Enter");
    await type(page, "Read two chapters");

    await caption(page, "It saves itself while you write", 400);
    await expect(page.getByRole("status")).toHaveText("Saved");
    await page.mouse.move(690, 18, { steps: 12 });
    await pause(page, 1200);

    await caption(page, "Reload: everything is still here", 500);
    await page.reload();
    await expect(page.locator(".tiptap h1")).toHaveText("Things to do this weekend");
    await expect(page.locator(".tiptap strong")).toHaveText("grandma");
    await pause(page, 1500);
  } finally {
    await deleteDocument(page, id);
  }
});
