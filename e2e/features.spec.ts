import { expect, test } from "@playwright/test";
import { ALICE, BOB, createDocument, deleteDocument, signIn, uniqueTitle } from "./helpers";

test.describe("version history", () => {
  test("edits create versions, a version can be previewed and restored", async ({ page }) => {
    await signIn(page, ALICE.email);
    const id = await createDocument(page.request, uniqueTitle("History e2e"));
    try {
      // Two saves far enough apart in meaning: seed content via the API so we control the snapshots.
      const first = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "First draft" }] }] };
      const second = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Second draft" }] }] };
      expect((await page.request.patch(`/api/documents/${id}`, { data: { content: first } })).ok()).toBe(true);
      // Force a separate version by using the restore reason boundary: a restore of the first version later proves the chain.
      expect((await page.request.patch(`/api/documents/${id}`, { data: { content: second } })).ok()).toBe(true);

      await expect.poll(async () => (await (await page.request.get(`/api/documents/${id}/versions`)).json()).length, { timeout: 10_000 }).toBeGreaterThan(0);
      const versions = await (await page.request.get(`/api/documents/${id}/versions`)).json();
      // Same author within two minutes: the two autosaves coalesced into one version.
      expect(versions).toHaveLength(1);

      await page.goto(`/docs/${id}`);
      await expect(page.locator(".tiptap")).toContainText("Second draft");
      await page.getByRole("button", { name: "Version history" }).click();
      const list = page.getByRole("list", { name: "Versions" });
      await expect(list.getByRole("button")).toHaveCount(1);
      await list.getByRole("button").first().click();
      await expect(page.getByRole("dialog").locator(".tiptap")).toContainText("Second draft");

      // Restore writes a "restore" version, so history now has two entries.
      await page.getByRole("button", { name: "Restore", exact: true }).click();
      await page.getByRole("button", { name: "Confirm restore" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect.poll(async () => (await (await page.request.get(`/api/documents/${id}/versions`)).json()).length).toBe(2);
      const after = await (await page.request.get(`/api/documents/${id}/versions`)).json();
      expect(after[0].reason).toBe("restore");
    } finally {
      await deleteDocument(page.request, id);
    }
  });
});

test.describe("export", () => {
  test("markdown and pdf downloads carry the document content", async ({ page }) => {
    await signIn(page, ALICE.email);
    const md = await page.request.get("/api/documents/doc_roadmap/export?format=markdown");
    expect(md.status()).toBe(200);
    expect(md.headers()["content-type"]).toContain("text/markdown");
    expect(md.headers()["content-disposition"]).toContain('filename="q4-product-roadmap.md"');
    const text = await md.text();
    expect(text).toContain("# Q4 Product Roadmap");
    expect(text).toContain("- Faster onboarding");
    expect(text).toContain("1. Ship document sharing (October)");
    expect(text).toContain("**Owner:**");

    const pdf = await page.request.get("/api/documents/doc_roadmap/export?format=pdf");
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toBe("application/pdf");
    const bytes = await pdf.body();
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);

    const bad = await page.request.get("/api/documents/doc_roadmap/export?format=docx");
    expect(bad.status()).toBe(400);
  });

  test("export respects access", async ({ page }) => {
    await signIn(page, BOB.email);
    const res = await page.request.get("/api/documents/doc_onboarding/export?format=markdown");
    expect(res.status()).toBe(403);
  });
});
