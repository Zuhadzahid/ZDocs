import { ALICE, BOB, caption, click, createDocument, demo, deleteDocument, doc, expect, heading, otherUser, paragraph, signIn } from "./helpers";

demo("06-version-history", async ({ page, browser }) => {
  await signIn(page, ALICE.email);
  const id = await createDocument(page, "Release notes", doc(heading(1, "Release notes"), paragraph("v1.0: first draft written by Alice.")));
  try {
    // A second author creates a distinct version (same-author edits within two minutes coalesce).
    await page.request.post(`/api/documents/${id}/shares`, { data: { email: BOB.email, role: "EDITOR" } });
    const bob = await otherUser(browser, BOB.email);
    await bob.page.request.patch(`/api/documents/${id}`, { data: { content: doc(heading(1, "Release notes"), paragraph("v1.1: Bob rewrote the whole thing.")) } });
    await bob.context.close();
    await expect.poll(async () => (await (await page.request.get(`/api/documents/${id}/versions`)).json()).length).toBe(2);

    await page.goto(`/docs/${id}`);
    await expect(page.getByRole("textbox", { name: "Document body" })).toContainText("Bob rewrote");
    await caption(page, "Every change is kept. Bob rewrote Alice's draft", 1400);
    await click(page, page.getByRole("button", { name: "Version history" }), 900);
    await caption(page, "The history panel lists every version with who and when", 1200);
    const list = page.getByRole("list", { name: "Versions" });
    await click(page, list.getByRole("button").last(), 900);
    await caption(page, "Preview the earlier version...", 1200);
    await click(page, page.getByRole("button", { name: "Restore", exact: true }), 600);
    await click(page, page.getByRole("button", { name: "Confirm restore" }), 1200);
    await expect(page.getByRole("textbox", { name: "Document body" })).toContainText("first draft written by Alice");
    await caption(page, "...and restore it. The restore itself is recorded, so nothing is lost", 2200);
  } finally {
    await deleteDocument(page, id);
  }
});
