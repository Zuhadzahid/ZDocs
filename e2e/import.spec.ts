import path from "node:path";
import { expect, test } from "@playwright/test";
import { ALICE, deleteDocument, signIn } from "./helpers";

test.describe("import", () => {
  test("a markdown file becomes a structured document", async ({ page }) => {
    await signIn(page, ALICE.email);
    await page.locator('input[type="file"]').setInputFiles(path.join(__dirname, "..", "samples", "sample-markdown.md"));
    await page.waitForURL(/\/docs\/[a-z0-9]+/);
    const id = page.url().split("/docs/")[1];
    try {
      await expect(page.locator(".tiptap h1")).toHaveText("Imported spec");
      await expect(page.locator(".tiptap ul li")).toHaveCount(2);
      await expect(page.locator(".tiptap ol li")).toHaveCount(2);
      await expect(page.locator(".tiptap strong")).toHaveText("markdown");
    } finally {
      await deleteDocument(page.request, id);
    }
  });

  test("unsupported and oversized files are rejected by the API", async ({ page }) => {
    await signIn(page, ALICE.email);
    const bad = await page.request.post("/api/documents/import", {
      multipart: { file: { name: "image.png", mimeType: "image/png", buffer: Buffer.from("not really") } },
    });
    expect(bad.status()).toBe(400);
    expect((await bad.json()).error).toContain("Unsupported file type");

    const big = await page.request.post("/api/documents/import", {
      multipart: { file: { name: "big.txt", mimeType: "text/plain", buffer: Buffer.alloc(2 * 1024 * 1024 + 1, 97) } },
    });
    expect(big.status()).toBe(400);
  });
});
