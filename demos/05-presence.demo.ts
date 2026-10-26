import { ALICE, BOB, caption, createDocument, demo, deleteDocument, doc, expect, heading, otherUser, paragraph, signIn } from "./helpers";

demo("05-presence", async ({ page, browser }) => {
  await signIn(page, ALICE.email);
  const id = await createDocument(page, "Team notes", doc(heading(1, "Team notes"), paragraph("Who is reading this right now?")));
  try {
    await page.goto(`/docs/${id}`);
    await page.request.post(`/api/documents/${id}/shares`, { data: { email: BOB.email, role: "EDITOR" } });
    await caption(page, "Alice has the document open. Nobody else is here yet", 1500);

    const bob = await otherUser(browser, BOB.email);
    await bob.page.goto(`/docs/${id}`);
    await caption(page, "Bob opens the same document on his side...", 800);
    await expect(page.getByTitle(`${BOB.name} is viewing now`)).toBeVisible({ timeout: 25_000 });
    const avatar = page.getByTitle(`${BOB.name} is viewing now`);
    const box = (await avatar.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 20 });
    await caption(page, "...and his avatar appears next to the document", 2200);
    await bob.context.close();
  } finally {
    await deleteDocument(page, id);
  }
});
