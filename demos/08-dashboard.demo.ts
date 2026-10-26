import { ALICE, caption, click, createDocument, demo, deleteDocument, doc, expect, heading, paragraph, pause, signIn, type } from "./helpers";

demo("08-dashboard", async ({ page }) => {
  await signIn(page, ALICE.email);
  const id = await createDocument(page, "Grocery list", doc(heading(1, "Grocery list"), paragraph("Milk, eggs, coffee.")));
  try {
    await page.goto("/");
    await caption(page, "Your dashboard: everything you own, up front", 1200);
    await click(page, page.getByRole("link", { name: "Shared with me" }), 1000);
    await caption(page, "Shared with me: documents other people gave you access to", 1000);
    await click(page, page.getByRole("link", { name: "Recent" }), 1000);
    await caption(page, "Recent: whatever you opened last", 1000);
    await click(page, page.getByRole("link", { name: "Starred" }), 1000);
    await caption(page, "Starred: the ones you keep coming back to", 900);
    await click(page, page.getByRole("link", { name: "My documents" }), 900);

    const card = page.getByRole("article").filter({ hasText: "Grocery list" });
    await caption(page, "Star a document from its card", 400);
    await click(page, card.getByRole("button", { name: "Star document" }), 900);
    await click(page, page.getByRole("link", { name: "Starred" }), 900);
    await expect(page.getByRole("article").filter({ hasText: "Grocery list" })).toBeVisible();
    await pause(page, 800);
    await click(page, page.getByRole("link", { name: "My documents" }), 800);

    await caption(page, "Rename and delete from the card menu", 400);
    const card2 = page.getByRole("article").filter({ hasText: "Grocery list" });
    await click(page, card2.getByRole("button", { name: "Document actions" }), 500);
    await click(page, page.getByRole("menuitem", { name: "Rename" }), 300);
    await page.keyboard.press("Control+a");
    await type(page, "Shopping list");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("article").filter({ hasText: "Shopping list" })).toBeVisible();
    await pause(page, 900);
    const card3 = page.getByRole("article").filter({ hasText: "Shopping list" });
    await click(page, card3.getByRole("button", { name: "Document actions" }), 500);
    page.once("dialog", (d) => d.accept());
    await click(page, page.getByRole("menuitem", { name: "Delete" }), 300);
    await expect(page.getByRole("article").filter({ hasText: "Shopping list" })).toHaveCount(0);
    await caption(page, "Gone, with a toast to confirm", 1600);
  } finally {
    await deleteDocument(page, id);
  }
});
