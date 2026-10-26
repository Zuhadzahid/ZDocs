import { ALICE, BOB, caption, click, createDocument, demo, deleteDocument, doc, expect, heading, otherUser, paragraph, pause, signIn, type } from "./helpers";

demo("10-conflict-detection", async ({ page, browser }) => {
  await signIn(page, ALICE.email);
  const id = await createDocument(page, "Budget", doc(heading(1, "Budget"), paragraph("Q4 numbers go here.")));
  try {
    await page.request.post(`/api/documents/${id}/shares`, { data: { email: BOB.email, role: "EDITOR" } });
    await page.goto(`/docs/${id}`);
    await caption(page, "Alice has the budget open", 1200);

    const bob = await otherUser(browser, BOB.email);
    await caption(page, "Meanwhile Bob saves a newer version from his side...", 1200);
    await bob.page.request.patch(`/api/documents/${id}`, { data: { content: doc(heading(1, "Budget"), paragraph("Q4 numbers go here. Bob added the marketing line.")) } });
    await bob.context.close();
    await pause(page, 600);

    await caption(page, "...and Alice keeps typing on her stale copy", 500);
    await click(page, page.getByRole("textbox", { name: "Document body" }), 200);
    await page.keyboard.press("Control+End");
    await type(page, " Alice adds travel costs.");
    await expect(page.getByRole("status")).toContainText(/changed by someone else|Conflict/i, { timeout: 15_000 });
    await caption(page, "Her save is refused instead of silently overwriting Bob's work", 2200);
    await caption(page, "Reload to see the latest version", 600);
    await click(page, page.getByRole("button", { name: "Reload" }), 1200);
    await expect(page.locator(".tiptap")).toContainText("Bob added the marketing line");
    await caption(page, "Now she is on Bob's version and can add her line again", 2000);
  } finally {
    await deleteDocument(page, id);
  }
});
