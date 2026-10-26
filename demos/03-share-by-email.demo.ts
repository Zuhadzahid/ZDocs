import { ALICE, BOB, CAROL, caption, click, createDocument, demo, deleteDocument, doc, expect, heading, paragraph, pause, signIn, type } from "./helpers";

demo("03-share-by-email", async ({ page }) => {
  await signIn(page, ALICE.email);
  const id = await createDocument(page, "Launch checklist", doc(heading(1, "Launch checklist"), paragraph("Everything we need before Friday.")));
  try {
    await page.goto(`/docs/${id}`);
    await caption(page, "Share with the right people", 900);
    await click(page, page.getByRole("button", { name: "Share" }), 700);
    const dialog = page.getByRole("dialog");

    await caption(page, "Bob can edit", 300);
    await click(page, dialog.getByPlaceholder("Add people by email"), 100);
    await type(page, BOB.email);
    await dialog.getByLabel("Permission", { exact: true }).selectOption("EDITOR");
    await click(page, dialog.getByRole("button", { name: "Share", exact: true }), 900);
    await expect(dialog.getByText(BOB.name)).toBeVisible();

    await caption(page, "Carol can only view", 300);
    await click(page, dialog.getByPlaceholder("Add people by email"), 100);
    await type(page, CAROL.email);
    await dialog.getByLabel("Permission", { exact: true }).selectOption("VIEWER");
    await click(page, dialog.getByRole("button", { name: "Share", exact: true }), 1200);
    await expect(dialog.getByText(CAROL.name)).toBeVisible();
    await page.keyboard.press("Escape");
    await pause(page, 600);

    await caption(page, "Now as Carol: the document shows up under Shared with me", 500);
    await click(page, page.getByRole("button", { name: "Sign out" }), 400);
    await signIn(page, CAROL.email);
    await click(page, page.getByRole("link", { name: "Shared with me" }), 900);
    const card = page.getByRole("article").filter({ hasText: "Launch checklist" });
    await expect(card).toBeVisible();
    await click(page, card.getByRole("link", { name: "Launch checklist" }), 800);
    await expect(page.getByText("View only")).toBeVisible();
    await caption(page, "View only: no toolbar, typing does nothing", 1600);

    await caption(page, "The owner upgrades Carol to editor...", 600);
    // Carol cannot change her own role; do it as Alice through the API in the background.
    const alice = await page.context().browser()!.newContext();
    const ap = await alice.newPage();
    await signIn(ap, ALICE.email);
    await ap.request.post(`/api/documents/${id}/shares`, { data: { email: CAROL.email, role: "EDITOR" } });
    await alice.close();
    await page.reload();
    await expect(page.getByRole("toolbar")).toBeVisible();
    await caption(page, "...and the toolbar appears for her", 1600);
  } finally {
    const alice = await page.context().browser()!.newContext();
    const ap = await alice.newPage();
    await signIn(ap, ALICE.email);
    await deleteDocument(ap, id);
    await alice.close();
  }
});
