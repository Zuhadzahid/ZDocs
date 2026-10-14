import StarterKit from "@tiptap/starter-kit";

/**
 * Single source of truth for the editor schema. Used by the browser editor
 * and by the server when converting imported HTML into document JSON, so
 * both sides agree on which nodes and marks exist.
 */
export function createExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: false, autolink: true },
      // Code blocks are kept so imported Markdown fences (and inline code) survive;
      // they are not in the toolbar. Horizontal rules stay out of the schema.
      horizontalRule: false,
    }),
  ];
}

export const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] } as const;
