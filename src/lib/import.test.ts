import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, detectKind, fileToHtml, markdownToHtml, textToHtml, titleFromFilename } from "./import";
import { documentToExcerpt, htmlToDocument } from "./tiptap-server";

describe("detectKind / titleFromFilename", () => {
  it("accepts supported extensions case-insensitively", () => {
    expect(detectKind("notes.TXT")).toBe("txt");
    expect(detectKind("README.md")).toBe("md");
    expect(detectKind("spec.docx")).toBe("docx");
  });
  it("rejects anything else", () => {
    expect(detectKind("image.png")).toBeNull();
    expect(detectKind("archive.doc")).toBeNull();
    expect(detectKind("noext")).toBeNull();
  });
  it("derives a title from the filename", () => {
    expect(titleFromFilename("Q4 roadmap.final.docx")).toBe("Q4 roadmap.final");
    expect(titleFromFilename(".md")).toBe("Imported document");
  });
});

describe("textToHtml", () => {
  it("splits paragraphs on blank lines and escapes HTML", () => {
    expect(textToHtml("a <b>\r\n\r\nc\nd")).toBe("<p>a &lt;b&gt;</p><p>c<br>d</p>");
  });
  it("returns an empty paragraph for whitespace-only input", () => {
    expect(textToHtml("  \n\n ")).toBe("<p></p>");
  });
});

describe("markdown import keeps structure", () => {
  it("converts headings, emphasis and lists into editor nodes", () => {
    const html = markdownToHtml("# Title\n\nSome **bold** and _italic_.\n\n- one\n- two\n\n1. first\n2. second\n");
    const doc = htmlToDocument(html);
    const types = doc.content?.map((n) => n.type);
    expect(types).toEqual(["heading", "paragraph", "bulletList", "orderedList"]);
    expect(doc.content?.[0].attrs?.level).toBe(1);
    const marks = doc.content?.[1].content?.flatMap((t) => t.marks?.map((m) => m.type) ?? []);
    expect(marks).toContain("bold");
    expect(marks).toContain("italic");
    expect(documentToExcerpt(doc)).toContain("Title Some bold and italic.");
  });
});

describe("fileToHtml validation", () => {
  it("rejects unsupported types", async () => {
    await expect(fileToHtml("x.pdf", Buffer.from("hi"))).rejects.toThrow(/Unsupported file type/);
  });
  it("rejects empty and oversize files", async () => {
    await expect(fileToHtml("x.txt", Buffer.alloc(0))).rejects.toThrow(/empty/);
    await expect(fileToHtml("x.txt", Buffer.alloc(MAX_UPLOAD_BYTES + 1))).rejects.toThrow(/too large/);
  });
  it("imports plain text", async () => {
    const out = await fileToHtml("hello world.txt", Buffer.from("Hello\n\nWorld"));
    expect(out.title).toBe("hello world");
    expect(out.html).toBe("<p>Hello</p><p>World</p>");
  });
});
