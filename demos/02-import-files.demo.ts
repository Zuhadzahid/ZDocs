import path from "node:path";
import { ALICE, caption, click, demo, deleteDocument, expect, pause, signIn } from "./helpers";

demo("02-import-files", async ({ page }) => {
  await signIn(page, ALICE.email);
  const dropzone = page.getByRole("button", { name: "Import a file as a new document" });
  await caption(page, "Drop a .txt, .md or .docx on the dashboard", 900);
  const box = (await dropzone.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 16 });
  await pause(page, 600);

  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "samples", "sample-markdown.md"));
  await page.waitForURL(/\/docs\//);
  const id = page.url().split("/docs/")[1];
  try {
    await expect(page.locator(".tiptap h1")).toHaveText("Imported spec");
    await caption(page, "It becomes a live document. Headings, bold and lists survive", 1200);
    await page.mouse.move(500, 300, { steps: 12 });
    await pause(page, 1200);
    await click(page, page.getByRole("textbox", { name: "Document body" }), 200);
    await page.keyboard.press("Control+End");
    await page.keyboard.type(" (edited after import)", { delay: 40 });
    await expect(page.getByRole("status")).toHaveText("Saved");
    await pause(page, 900);

    await caption(page, "Other file types are rejected with a clear message", 600);
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: Buffer.from("not an image") });
    await expect(page.getByText("Unsupported file type")).toBeVisible();
    await pause(page, 2000);
  } finally {
    await deleteDocument(page, id);
  }
});
