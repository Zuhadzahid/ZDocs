import { expect, test } from "@playwright/test";
import { ALICE, BOB, CAROL, createDocument, deleteDocument, signIn, uniqueTitle } from "./helpers";

test.describe("sharing", () => {
  test("owner shares, viewer is read-only, unshared user is denied, editor gets the toolbar", async ({ browser, page }) => {
    await signIn(page, ALICE.email);
    const title = uniqueTitle("Shared by e2e");
    const id = await createDocument(page.request, title);

    try {
      await page.goto(`/docs/${id}`);
      await page.getByRole("button", { name: "Share" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByPlaceholder("Add people by email").fill(CAROL.email);
      await dialog.getByLabel("Permission", { exact: true }).selectOption("VIEWER");
      await dialog.getByRole("button", { name: "Share", exact: true }).click();
      await expect(dialog.getByText(CAROL.name)).toBeVisible();
      await page.keyboard.press("Escape");

      // Carol: sees it under Shared with me and opens it read-only.
      const carolCtx = await browser.newContext();
      const carol = await carolCtx.newPage();
      await signIn(carol, CAROL.email);
      await carol.goto("/?view=shared");
      const card = carol.getByRole("article").filter({ hasText: title });
      await expect(card).toBeVisible();
      await expect(card.getByText("Can view")).toBeVisible();
      await carol.goto(`/docs/${id}`);
      await expect(carol.getByText("View only")).toBeVisible();
      await expect(carol.getByRole("toolbar")).toHaveCount(0);
      const patch = await carol.request.patch(`/api/documents/${id}`, { data: { title: "hijacked" } });
      expect(patch.status()).toBe(403);
      await carolCtx.close();

      // Bob: no access at all, and cannot share it either.
      const bobCtx = await browser.newContext();
      const bob = await bobCtx.newPage();
      await signIn(bob, BOB.email);
      await bob.goto(`/docs/${id}`);
      await expect(bob.getByRole("heading", { name: "You do not have access" })).toBeVisible();
      const share = await bob.request.post(`/api/documents/${id}/shares`, { data: { email: CAROL.email, role: "EDITOR" } });
      expect(share.status()).toBe(403);
      await bobCtx.close();

      // Owner upgrades Carol to editor; Carol now gets the toolbar.
      const upgrade = await page.request.post(`/api/documents/${id}/shares`, { data: { email: CAROL.email, role: "EDITOR" } });
      expect(upgrade.status()).toBe(201);
      const carolCtx2 = await browser.newContext();
      const carol2 = await carolCtx2.newPage();
      await signIn(carol2, CAROL.email);
      await carol2.goto(`/docs/${id}`);
      await expect(carol2.getByRole("toolbar")).toBeVisible();
      await carolCtx2.close();
    } finally {
      await deleteDocument(page.request, id);
    }
  });
});
