import TurndownService from "turndown";
import type { JSONContent } from "@tiptap/core";
import { documentToHtml } from "./tiptap-server";

/**
 * Export helpers. Markdown goes JSON -> HTML (the editor's own serialiser)
 * -> Markdown via Turndown, so anything the editor can represent has a
 * deterministic textual form. PDF lives in pdf.tsx.
 */

export type ExportFormat = "markdown" | "pdf";
export const EXPORT_FORMATS: readonly ExportFormat[] = ["markdown", "pdf"];

export function isExportFormat(value: string | null): value is ExportFormat {
  return value !== null && (EXPORT_FORMATS as readonly string[]).includes(value);
}

function createTurndown() {
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
    strongDelimiter: "**",
  });

  // Markdown has no underline; GFM renderers accept inline <u>, so keep it.
  td.addRule("underline", {
    filter: ["u"],
    replacement: (content) => (content.trim() ? `<u>${content}</u>` : ""),
  });

  // Tiptap wraps list item text in <p>; the default rule pads that with blank
  // lines and three spaces. Emit tight "- item" / "1. item" lines instead.
  td.addRule("listItem", {
    filter: "li",
    replacement: (content, node, options) => {
      const body = content.replace(/^\n+/, "").replace(/\n+$/, "\n").replace(/\n/gm, "\n  ");
      const parent = node.parentNode as HTMLElement | null;
      let prefix = `${options.bulletListMarker} `;
      if (parent && parent.nodeName === "OL") {
        const start = Number(parent.getAttribute("start") ?? "1");
        const index = Array.prototype.indexOf.call(parent.children, node);
        prefix = `${start + index}. `;
      }
      return prefix + body + (node.nextSibling && !/\n$/.test(body) ? "\n" : "");
    },
  });

  td.addRule("strikethrough", {
    filter: ["s", "del"],
    replacement: (content) => (content.trim() ? `~~${content}~~` : ""),
  });
  return td;
}

export function documentToMarkdown(doc: JSONContent): string {
  // Unwrap single-paragraph list items so each becomes one Markdown line.
  const html = documentToHtml(doc).replace(/<li><p>([\s\S]*?)<\/p><\/li>/g, "<li>$1</li>");
  const md = createTurndown().turndown(html);
  return md.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/** "Q4 Roadmap: Final!" -> "q4-roadmap-final" */
export function slugifyTitle(title: string, fallback = "document"): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

export function exportFilename(title: string, format: ExportFormat): string {
  return `${slugifyTitle(title)}.${format === "markdown" ? "md" : "pdf"}`;
}

/** RFC 6266 attachment header that survives non-ASCII titles. */
export function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
