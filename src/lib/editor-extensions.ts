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
      // Not exposed in the toolbar; keep the schema small and predictable.
      codeBlock: false,
      horizontalRule: false,
    }),
  ];
}

export const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] } as const;
