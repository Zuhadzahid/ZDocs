import { describe, expect, it } from "vitest";
import { shouldStartNewVersion, COALESCE_WINDOW_MS } from "./versions";
import { contentDisposition, documentToMarkdown, exportFilename, isExportFormat, slugifyTitle } from "./export";
import { ACTIVE_WINDOW_MS, isActive } from "./presence";
import { buildShareUrl, mergeRole } from "./share-links";

describe("version coalescing", () => {
  const now = new Date("2026-10-14T12:00:00Z");
  const head = { authorId: "alice", reason: "autosave", updatedAt: new Date(now.getTime() - 30_000) };

  it("extends the head version for the same author within the window", () => {
    expect(shouldStartNewVersion(head, "alice", "autosave", now)).toBe(false);
  });
  it("starts a new version when the author changes", () => {
    expect(shouldStartNewVersion(head, "bob", "autosave", now)).toBe(true);
  });
  it("starts a new version when the window lapses", () => {
    const old = { ...head, updatedAt: new Date(now.getTime() - COALESCE_WINDOW_MS - 1) };
    expect(shouldStartNewVersion(old, "alice", "autosave", now)).toBe(true);
  });
  it("never coalesces into or out of non-autosave versions", () => {
    expect(shouldStartNewVersion(head, "alice", "restore", now)).toBe(true);
    expect(shouldStartNewVersion({ ...head, reason: "restore" }, "alice", "autosave", now)).toBe(true);
    expect(shouldStartNewVersion(null, "alice", "autosave", now)).toBe(true);
  });
});

describe("markdown export", () => {
  it("renders headings, marks and lists", () => {
    const md = documentToMarkdown({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Title" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Some " },
            { type: "text", text: "bold", marks: [{ type: "bold" }] },
            { type: "text", text: " and " },
            { type: "text", text: "under", marks: [{ type: "underline" }] },
            { type: "text", text: " and " },
            { type: "text", text: "gone", marks: [{ type: "strike" }] },
          ],
        },
        { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "one" }] }] }] },
        { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "first" }] }] }] },
      ],
    });
    expect(md).toBe("# Title\n\nSome **bold** and <u>under</u> and ~~gone~~\n\n- one\n\n1. first\n");
  });
  it("builds safe filenames and headers", () => {
    expect(slugifyTitle("Q4 Roadmap: Final!")).toBe("q4-roadmap-final");
    expect(slugifyTitle("   ")).toBe("document");
    expect(exportFilename("Notes", "markdown")).toBe("notes.md");
    expect(exportFilename("Notes", "pdf")).toBe("notes.pdf");
    expect(contentDisposition("plan.md")).toContain(`filename="plan.md"`);
    expect(isExportFormat("pdf")).toBe(true);
    expect(isExportFormat("docx")).toBe(false);
  });
});

describe("presence window", () => {
  const now = new Date("2026-10-14T12:00:00Z");
  it("counts recent heartbeats as active and old ones as gone", () => {
    expect(isActive(new Date(now.getTime() - 10_000), now)).toBe(true);
    expect(isActive(new Date(now.getTime() - ACTIVE_WINDOW_MS - 1), now)).toBe(false);
  });
});

describe("share links", () => {
  it("never downgrades an editor", () => {
    expect(mergeRole("EDITOR", "VIEWER")).toBe("EDITOR");
    expect(mergeRole("VIEWER", "EDITOR")).toBe("EDITOR");
    expect(mergeRole(null, "VIEWER")).toBe("VIEWER");
  });
  it("builds the public URL without double slashes", () => {
    expect(buildShareUrl("https://zdocs.app/", "abc")).toBe("https://zdocs.app/share/abc");
  });
});
