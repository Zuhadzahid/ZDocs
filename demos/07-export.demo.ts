import { ALICE, caption, click, demo, expect, signIn } from "./helpers";

demo("07-export", async ({ page }) => {
  await signIn(page, ALICE.email);
  await page.goto("/docs/doc_roadmap");
  await expect(page.locator(".tiptap h1")).toBeVisible();
  await caption(page, "Take any document with you", 900);

  await click(page, page.getByRole("button", { name: "Export" }), 600);
  await caption(page, "Markdown for the repo", 300);
  const md = page.waitForEvent("download");
  await click(page, page.getByRole("menuitem", { name: "Markdown (.md)" }), 200);
  const mdFile = await md;
  await caption(page, `Downloaded ${mdFile.suggestedFilename()}`, 1400);

  await click(page, page.getByRole("button", { name: "Export" }), 600);
  await caption(page, "PDF for the inbox, rendered on the server", 300);
  const pdf = page.waitForEvent("download");
  await click(page, page.getByRole("menuitem", { name: "PDF (.pdf)" }), 200);
  const pdfFile = await pdf;
  await caption(page, `Downloaded ${pdfFile.suggestedFilename()}`, 1800);
});
