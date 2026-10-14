"use client";

import { useEditorState, type Editor } from "@tiptap/react";

/** Formatting toolbar. Reads editor state through useEditorState so buttons
 *  reflect the current selection (Tiptap v3 does not re-render on every transaction). */
export function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      quote: editor.isActive("blockquote"),
      block: editor.isActive("heading", { level: 1 })
        ? "h1"
        : editor.isActive("heading", { level: 2 })
          ? "h2"
          : editor.isActive("heading", { level: 3 })
            ? "h3"
            : "p",
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  const run = (fn: (c: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => () =>
    fn(editor.chain().focus()).run();

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm"
    >
      <Btn label="Undo (Ctrl+Z)" onClick={run((c) => c.undo())} disabled={!s.canUndo}>↶</Btn>
      <Btn label="Redo (Ctrl+Y)" onClick={run((c) => c.redo())} disabled={!s.canRedo}>↷</Btn>
      <Sep />
      <select
        aria-label="Text style"
        value={s.block}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
        }}
        className="h-8 rounded-md border border-transparent bg-transparent px-2 text-sm hover:bg-zinc-100 focus:border-zinc-300 focus:outline-none"
      >
        <option value="p">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
      <Sep />
      <Btn label="Bold (Ctrl+B)" active={s.bold} onClick={run((c) => c.toggleBold())}>
        <b>B</b>
      </Btn>
      <Btn label="Italic (Ctrl+I)" active={s.italic} onClick={run((c) => c.toggleItalic())}>
        <i>I</i>
      </Btn>
      <Btn label="Underline (Ctrl+U)" active={s.underline} onClick={run((c) => c.toggleUnderline())}>
        <u>U</u>
      </Btn>
      <Btn label="Strikethrough" active={s.strike} onClick={run((c) => c.toggleStrike())}>
        <s>S</s>
      </Btn>
      <Sep />
      <Btn label="Bulleted list" active={s.bullet} onClick={run((c) => c.toggleBulletList())}>
        • ≡
      </Btn>
      <Btn label="Numbered list" active={s.ordered} onClick={run((c) => c.toggleOrderedList())}>
        1. ≡
      </Btn>
      <Btn label="Quote" active={s.quote} onClick={run((c) => c.toggleBlockquote())}>
        ❝
      </Btn>
    </div>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />;
}

function Btn({
  label,
  active,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition disabled:opacity-40 ${
        active ? "bg-brand/10 text-brand" : "hover:bg-zinc-100"
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}
