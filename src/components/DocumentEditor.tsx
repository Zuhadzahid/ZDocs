"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import { createExtensions } from "@/lib/editor-extensions";
import { ROLE_LABEL, canEdit, canManage, type AccessRole } from "@/lib/permissions";
import { MAX_TITLE_LENGTH } from "@/lib/validation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppHeader } from "./AppHeader";
import { Avatar } from "./Avatar";
import { SaveStatus, type SaveState } from "./SaveStatus";
import { ShareDialog, type ShareEntry } from "./ShareDialog";
import { Toolbar } from "./Toolbar";
import { HistoryPanel } from "./HistoryPanel";
import { ExportMenu } from "./ExportMenu";
import { PresenceAvatars } from "./PresenceAvatars";

interface Person {
  name: string;
  email: string;
  color: string;
}

export function DocumentEditor({
  currentUser,
  role,
  starred: initialStarred,
  document: doc,
}: {
  currentUser: Person;
  role: AccessRole;
  starred: boolean;
  document: {
    id: string;
    title: string;
    content: JSONContent;
    updatedAt: string;
    owner: Person;
    shares: ShareEntry[];
  };
}) {
  const editable = canEdit(role);
  const [title, setTitle] = useState(doc.title);
  const [shares, setShares] = useState<ShareEntry[]>(doc.shares);
  const [sharing, setSharing] = useState(false);
  const [starred, setStarred] = useState(initialStarred);

  async function toggleStar() {
    const next = !starred;
    setStarred(next);
    const res = await fetch(`/api/documents/${doc.id}/star`, { method: "POST" });
    if (!res.ok) {
      setStarred(!next);
      toast.error("Could not update star");
      return;
    }
    toast.success(next ? "Added to Starred" : "Removed from Starred", { id: "star" });
  }
  const [save, setSave] = useState<{ state: SaveState; message?: string }>({ state: "saved" });

  // Autosave bookkeeping. `baseUpdatedAt` is the server version we last saw;
  // the API returns 409 if someone else saved after it.
  const baseUpdatedAt = useRef(doc.updatedAt);
  const pending = useRef<{ title?: string; content?: JSONContent; excerpt?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    const patch = pending.current;
    pending.current = {};
    if (patch.title === undefined && patch.content === undefined) return;
    setSave({ state: "saving" });
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patch, baseUpdatedAt: baseUpdatedAt.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setSave({ state: "conflict", message: data.error });
        toast.warning("Someone else changed this document", {
          description: "Reload to see the latest version. Your recent edits are kept until then.",
          duration: 8000,
        });
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      baseUpdatedAt.current = data.updatedAt;
      setSave({ state: "saved" });
    } catch (e) {
      pending.current = { ...patch, ...pending.current };
      const message = e instanceof Error ? e.message : "Save failed";
      setSave({ state: "error", message });
      toast.error("Could not save", { description: message, id: "save-error" });
    }
  }, [doc.id]);

  const schedule = useCallback(
    (patch: typeof pending.current) => {
      pending.current = { ...pending.current, ...patch };
      setSave((s) => (s.state === "conflict" ? s : { state: "dirty" }));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 800);
    },
    [flush],
  );

  const editor = useEditor({
    extensions: [...createExtensions(), Placeholder.configure({ placeholder: "Start writing..." })],
    content: doc.content,
    editable,
    immediatelyRender: false,
    editorProps: { attributes: { class: "tiptap", "aria-label": "Document body", spellcheck: "true" } },
    onUpdate: ({ editor }) => {
      schedule({ content: editor.getJSON(), excerpt: editor.getText({ blockSeparator: " " }).replace(/\s+/g, " ").trim().slice(0, 200) });
    },
  });

  /** Swap the live editor to a restored snapshot without triggering an autosave of it. */
  function handleRestored(next: { title: string; content: JSONContent; updatedAt: string }) {
    if (timer.current) clearTimeout(timer.current);
    pending.current = {};
    baseUpdatedAt.current = next.updatedAt;
    setTitle(next.title);
    editor?.commands.setContent(next.content, { emitUpdate: false });
    setSave({ state: "saved" });
  }

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (save.state === "dirty" || save.state === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [save.state]);

  function onTitleChange(next: string) {
    setTitle(next);
    if (next.trim()) schedule({ title: next.trim() });
  }

  return (
    <>
      <AppHeader user={currentUser}>
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="hidden text-sm text-zinc-500 hover:text-zinc-800 sm:inline" aria-label="Back to documents">
            ← Docs
          </Link>
          <input
            value={title}
            readOnly={!editable}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={() => {
              if (!title.trim()) onTitleChange("Untitled document");
            }}
            aria-label="Document title"
            className="min-w-0 flex-1 truncate rounded-md border border-transparent px-2 py-1 text-base font-medium hover:border-zinc-300 focus:border-brand focus:outline-none read-only:hover:border-transparent"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleStar}
            aria-pressed={starred}
            aria-label={starred ? "Remove star" : "Star document"}
            className={`pressable shrink-0 ${starred ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground/60"}`}
          >
            <Star className="size-4" fill={starred ? "currentColor" : "none"} />
          </Button>
          {editable ? (
            <SaveStatus state={save.state} message={save.message} />
          ) : (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">View only</span>
          )}
        </div>
      </AppHeader>

      <div className="sticky top-14 z-10 border-b border-zinc-200 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2">
          {editable && editor ? <Toolbar editor={editor} /> : <span className="text-sm text-zinc-500">{ROLE_LABEL[role]}</span>}
          <div className="ml-auto flex items-center gap-2">
            <PresenceAvatars documentId={doc.id} />
            <HistoryPanel documentId={doc.id} canRestore={editable} onRestored={handleRestored} />
            <ExportMenu documentId={doc.id} />
            <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
            <span className="flex -space-x-1" title={`Owner: ${doc.owner.name}`}>
              <Avatar name={doc.owner.name} color={doc.owner.color} size={26} title={`${doc.owner.name} (owner)`} />
              {shares.map((s) => (
                <Avatar key={s.user.id} name={s.user.name} color={s.user.color} size={26} title={`${s.user.name} (${s.role === "EDITOR" ? "can edit" : "can view"})`} />
              ))}
            </span>
            {canManage(role) ? (
              <button onClick={() => setSharing(true)} className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-hover">
                Share
              </button>
            ) : (
              <span className="text-xs text-zinc-500">Owned by {doc.owner.name}</span>
            )}
          </div>
        </div>
      </div>

      {save.state === "conflict" && (
        <div className="mx-auto mt-4 w-full max-w-3xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {save.message}{" "}
          <button onClick={() => window.location.reload()} className="font-medium underline">Reload</button>
        </div>
      )}

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <div className="editor-content min-h-[70vh] rounded-lg border border-zinc-200 bg-white px-10 py-12 shadow-sm sm:px-16" data-readonly={!editable}>
          <EditorContent editor={editor} />
        </div>
      </main>

      {sharing && (
        <ShareDialog
          documentId={doc.id}
          title={title}
          owner={doc.owner}
          shares={shares}
          onChange={setShares}
          onClose={() => setSharing(false)}
        />
      )}
    </>
  );
}
