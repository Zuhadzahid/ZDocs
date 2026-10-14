import { expect, test } from "@playwright/test";
import { ALICE, deleteDocument, signIn, uniqueTitle } from "./helpers";

test.describe("documents", () => {
  const created: string[] = [];

  test.afterEach(async ({ page }) => {
    for (const id of created.splice(0)) await deleteDocument(page.request, id);
  });

  test("create from the sidebar, type with formatting, autosave, reload, rename", async ({ page }) => {
    await signIn(page, ALICE.email);

    await page.getByRole("button", { name: "New document" }).first().click();
    await page.waitForURL(/\/docs\/[a-z0-9]+/);
    created.push(page.url().split("/docs/")[1]);

    const body = page.getByRole("textbox", { name: "Document body" });
    await body.click();
    await page.keyboard.type("Playwright heading");
    await page.getByLabel("Text style").selectOption("h1");
    // The select takes focus; return to the editor before typing the next line.
    await body.click();
    await page.keyboard.press("Control+End");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Bold words here");
    await page.keyboard.press("Shift+Home");
    const isSave = (r: { url(): string; request(): { method(): string } }) =>
      r.url().includes("/api/documents/") && r.request().method() === "PATCH";
    await Promise.all([page.waitForResponse(isSave), page.getByRole("button", { name: /^Bold/ }).click()]);
    await expect(page.locator(".tiptap strong")).toHaveText("Bold words here");
    await expect(page.getByRole("status")).toHaveText("Saved");

    const title = uniqueTitle("Renamed by e2e");
    await Promise.all([page.waitForResponse(isSave), page.getByLabel("Document title").fill(title)]);
    await expect(page.getByRole("status")).toHaveText("Saved");

    await page.reload();
    await expect(page.getByLabel("Document title")).toHaveValue(title);
    await expect(page.locator(".tiptap h1")).toHaveText("Playwright heading");
    await expect(page.locator(".tiptap strong")).toHaveText("Bold words here");
  });

  test("new document appears in My documents and can be starred", async ({ page }) => {
    await signIn(page, ALICE.email);
    const title = uniqueTitle("Starred by e2e");
    const res = await page.request.post("/api/documents", { data: { title } });
    created.push((await res.json()).id);

    await page.goto("/");
    const card = page.getByRole("article").filter({ hasText: title });
    await expect(card).toBeVisible();
    // The star is optimistic in the UI; wait for the server to confirm before navigating.
    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/star") && r.ok()),
      card.getByRole("button", { name: "Star document" }).click(),
    ]);
    await expect(card.getByRole("button", { name: "Remove star" })).toBeVisible();

    await page.goto("/?view=starred");
    await expect(page.getByRole("article").filter({ hasText: title })).toBeVisible();
  });

  test("API validation: blank title is rejected and unknown ids are 404", async ({ page }) => {
    await signIn(page, ALICE.email);
    const res = await page.request.post("/api/documents", { data: { title: "   " } });
    expect(res.status()).toBe(400);
    const notFound = await page.request.get("/api/documents/does-not-exist");
    expect(notFound.status()).toBe(404);
  });
});
