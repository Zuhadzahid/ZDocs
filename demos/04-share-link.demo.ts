import { ALICE, BOB, CAROL, caption, click, createDocument, demo, doc, expect, heading, otherUser, paragraph, signIn, DEMO_PASSWORD, type } from "./helpers";

demo("04-share-link", async ({ page, browser }) => {
  await signIn(page, ALICE.email);
  const id = await createDocument(page, "Reading list", doc(heading(1, "Reading list"), paragraph("Books worth passing around.")));
  // The recorded page signs out and in as other people; keep an owner session for API calls.
  const owner = await otherUser(browser, ALICE.email);
  const alice = owner.page.request;
  try {
    await page.goto(`/docs/${id}`);
    await caption(page, "Or just send a link", 900);
    await click(page, page.getByRole("button", { name: "Share" }), 700);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Link permission").selectOption("VIEWER");
    await caption(page, "Anyone with this link can view", 400);
    await click(page, dialog.getByRole("button", { name: "Create link" }), 1200);
    const code = dialog.getByRole("list", { name: "Active links" }).locator("code").first();
    const url = (await code.getAttribute("title"))!;
    await caption(page, "Copied. Send it to anyone", 1200);
    await page.keyboard.press("Escape");

    await caption(page, "Bob opens the link. He is asked to sign in first...", 600);
    await click(page, page.getByRole("button", { name: "Sign out" }), 300);
    await page.goto(url);
    await expect(page).toHaveURL(/\/login\?next=/);
    const form = page.locator("form");
    await click(page, form.getByLabel("Email"), 100);
    await type(page, BOB.email);
    await click(page, form.getByLabel("Password", { exact: true }), 100);
    await type(page, DEMO_PASSWORD, 50);
    await click(page, form.getByRole("button", { name: "Sign in", exact: true }), 800);
    await expect(page).toHaveURL(new RegExp(`/docs/${id}$`));
    await expect(page.getByText("View only")).toBeVisible();
    await caption(page, "...and lands straight on the document, read-only", 1800);

    await caption(page, "The owner turns the link off", 700);
    const links = await (await alice.get(`/api/documents/${id}/links`)).json();
    await alice.delete(`/api/documents/${id}/links/${links[0].id}`);
    const carol = await otherUser(browser, CAROL.email);
    await caption(page, "Carol tries the same link later...", 500);
    await page.goto("/");
    await click(page, page.getByRole("button", { name: "Sign out" }), 300);
    await signIn(page, CAROL.email);
    await page.goto(url);
    await expect(page.getByRole("heading", { name: "This link has been turned off" })).toBeVisible();
    await caption(page, "...too late. Bob keeps his access, new people do not get in", 2000);
    await carol.context.close();
  } finally {
    await alice.delete(`/api/documents/${id}`);
    await owner.context.close();
  }
});
