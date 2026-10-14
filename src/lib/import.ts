import { marked } from "marked";

/**
 * File import: turns an uploaded .txt, .md or .docx file into HTML that the
 * editor schema understands. HTML -> document JSON happens in
 * tiptap-server.ts so this module stays dependency-light and unit testable.
 */

export const SUPPORTED_EXTENSIONS = ["txt", "md", "docx"] as const;
export type SupportedKind = (typeof SUPPORTED_EXTENSIONS)[number];

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

export const SUPPORTED_ACCEPT =
  ".txt,.md,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function detectKind(filename: string): SupportedKind | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext) ? (ext as SupportedKind) : null;
}

/** "Q4 roadmap.final.docx" -> "Q4 roadmap.final" */
export function titleFromFilename(filename: string): string {
  const base = filename.split(/[\/]/).pop() ?? filename;
  const withoutExt = base.replace(/\.[^.]+$/, "").trim();
  return withoutExt || "Imported document";
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain text: blank lines separate paragraphs, single newlines become <br>. */
export function textToHtml(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n").replace(/^\uFEFF/, "");
  const blocks = normalized.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length === 0) return "<p></p>";
  return blocks.map((b) => `<p>${escapeHtml(b).replace(/\n/g, "<br>")}</p>`).join("");
}

export function markdownToHtml(md: string): string {
  const normalized = md.replace(/\r\n?/g, "\n").replace(/^\uFEFF/, "");
  return marked.parse(normalized, { async: false, gfm: true, breaks: false }) as string;
}

export async function docxToHtml(buffer: Buffer): Promise<string> {
  // Loaded lazily so the lightweight text paths never pull in mammoth.
  const mammoth = await import("mammoth");
  // Keep underline; mammoth drops it by default because Word uses it for links too.
  const result = await mammoth.convertToHtml({ buffer }, { styleMap: ["u => u"] });
  return result.value;
}

export interface ImportedFile {
  title: string;
  html: string;
}

/**
 * Validates and converts an uploaded file. Throws a plain Error with a
 * user-facing message on unsupported type or oversize input.
 */
export async function fileToHtml(filename: string, buffer: Buffer): Promise<ImportedFile> {
  const kind = detectKind(filename);
  if (!kind) {
    const list = SUPPORTED_EXTENSIONS.map((e) => "." + e).join(", ");
    throw new Error(`Unsupported file type. Upload a ${list} file.`);
  }
  if (buffer.byteLength === 0) throw new Error("The file is empty");
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
  }

  const title = titleFromFilename(filename);
  switch (kind) {
    case "txt":
      return { title, html: textToHtml(buffer.toString("utf8")) };
    case "md":
      return { title, html: markdownToHtml(buffer.toString("utf8")) };
    case "docx":
      return { title, html: await docxToHtml(buffer) };
  }
}
