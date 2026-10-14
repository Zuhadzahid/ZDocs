import { expect, test } from "@playwright/test";
import { ALICE, BOB, CAROL, createDocument, deleteDocument, signIn, uniqueTitle } from "./helpers";

test.describe("share links and presence", () => {
  test("a view link grants access, revoking stops new users, existing access is kept", async ({ browser, page }) => {
    await signIn(page, ALICE.email);
    const title = uniqueTitle("Link e2e");
    const id = await createDocument(page.request, title);
    try {
      // Create a link through the dialog.
      await page.goto(`/docs/${id}`);
      await page.getByRole("button", { name: "Share" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Link permission").selectOption("VIEWER");
      await dialog.getByRole("button", { name: "Create link" }).click();
      const code = dialog.getByRole("list", { name: "Active links" }).locator("code").first();
      await expect(code).toBeVisible();
      const url = "http://" + (await code.getAttribute("title"))!.replace(/^https?:\/\//, "");
      expect(url).toMatch(/\/share\/[A-Za-z0-9_-]+$/);
      await page.keyboard.press("Escape");

      // Signed-out visitor is bounced to login and back.
      const bobCtx = await browser.newContext();
      const bob = await bobCtx.newPage();
      await bob.goto(url);
      await expect(bob).toHaveURL(/\/login\?next=/);
      await bob.getByLabel("Email").fill(BOB.email);
      await bob.getByLabel("Password", { exact: true }).fill("demo1234");
      await bob.locator("form").getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(bob).toHaveURL(new RegExp(`/docs/${id}$`));
      await expect(bob.getByText("View only")).toBeVisible();

      // Presence: Alice's page shows Bob here, Bob's page shows Alice.
      await page.goto(`/docs/${id}`);
      await expect(page.getByTitle(`${BOB.name} is viewing now`)).toBeVisible({ timeout: 20_000 });
      await expect(bob.getByTitle(`${ALICE.name} is viewing now`)).toBeVisible({ timeout: 20_000 });

      // Revoke: Bob keeps access, Carol cannot use the link.
      const links = await (await page.request.get(`/api/documents/${id}/links`)).json();
      expect(links).toHaveLength(1);
      expect((await page.request.delete(`/api/documents/${id}/links/${links[0].id}`)).status()).toBe(204);
      await bob.reload();
      await expect(bob.getByText("View only")).toBeVisible();
      await bobCtx.close();

      const carolCtx = await browser.newContext();
      const carol = await carolCtx.newPage();
      await signIn(carol, CAROL.email);
      await carol.goto(url);
      await expect(carol.getByRole("heading", { name: "This link has been turned off" })).toBeVisible();
      await carolCtx.close();

      // Non-owners cannot create links.
      const bobCtx2 = await browser.newContext();
      const bob2 = await bobCtx2.newPage();
      await signIn(bob2, BOB.email);
      const forbidden = await bob2.request.post(`/api/documents/${id}/links`, { data: { role: "EDITOR" } });
      expect(forbidden.status()).toBe(403);
      await bobCtx2.close();
    } finally {
      await deleteDocument(page.request, id);
    }
  });

  test("a bad token shows the invalid-link page", async ({ page }) => {
    await signIn(page, ALICE.email);
    await page.goto("/share/not-a-real-token");
    await expect(page.getByRole("heading", { name: "This link is not valid" })).toBeVisible();
  });
});
