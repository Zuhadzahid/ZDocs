import { generateJSON, generateHTML } from "@tiptap/html";
import { createExtensions } from "./editor-extensions";
import type { JSONContent } from "@tiptap/core";

/** Converts HTML (from an import) into the editor's JSON document format. */
export function htmlToDocument(html: string): JSONContent {
  const json = generateJSON(html, createExtensions());
  if (!json.content || json.content.length === 0) {
    json.content = [{ type: "paragraph" }];
  }
  return json;
}

export function documentToHtml(doc: JSONContent): string {
  return generateHTML(doc, createExtensions());
}

/** Plain-text preview, used for list cards. */
export function documentToExcerpt(doc: JSONContent, max = 200): string {
  const parts: string[] = [];
  const walk = (node: JSONContent) => {
    if (node.type === "text" && node.text) parts.push(node.text);
    node.content?.forEach(walk);
    if (node.type && node.type !== "text" && node.type !== "doc") parts.push(" ");
  };
  walk(doc);
  return parts.join("").replace(/\s+/g, " ").trim().slice(0, max);
}
