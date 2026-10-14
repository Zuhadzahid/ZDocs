"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Star, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { DocumentCardModel } from "@/lib/documents";
import { ROLE_LABEL } from "@/lib/permissions";
import { MAX_TITLE_LENGTH } from "@/lib/validation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "./Avatar";

export function DocumentCard({ doc, showOwner }: { doc: DocumentCardModel; showOwner: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(doc.title);
  const [starred, setStarred] = useState(doc.starred);
  const isOwner = doc.role === "owner";

  async function saveTitle() {
    const next = title.trim();
    setRenaming(false);
    if (!next || next === doc.title) {
      setTitle(doc.title);
      return;
    }
    const res = await fetch(`/api/documents/${doc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: next }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Rename failed");
      setTitle(doc.title);
      return;
    }
    toast.success("Renamed", { description: next });
    startTransition(() => router.refresh());
  }

  async function remove() {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Delete failed");
      return;
    }
    toast.success("Document deleted", { description: doc.title });
    startTransition(() => router.refresh());
  }

  async function toggleStar() {
    const optimistic = !starred;
    setStarred(optimistic);
    const res = await fetch(`/api/documents/${doc.id}/star`, { method: "POST" });
    if (!res.ok) {
      setStarred(!optimistic);
      toast.error("Could not update star");
      return;
    }
    toast.success(optimistic ? "Added to Starred" : "Removed from Starred", { id: "star" });
    startTransition(() => router.refresh());
  }

  return (
    <article className="lift group relative flex min-h-48 flex-col rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(11,22,51,0.04)] hover:border-brand/40 hover:shadow-[0_10px_30px_-18px_rgba(29,92,245,0.45)]">
      <div className="mb-2 flex items-start gap-2">
        {renaming ? (
          <input
            autoFocus
            value={title}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") {
                setTitle(doc.title);
                setRenaming(false);
              }
            }}
            className="w-full rounded-md border border-brand px-2 py-1 font-semibold outline-none ring-2 ring-brand/20"
            aria-label="Document title"
          />
        ) : (
          <Link href={`/docs/${doc.id}`} className="line-clamp-2 flex-1 font-semibold leading-snug text-navy hover:underline">
            {doc.title}
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleStar}
          aria-pressed={starred}
          aria-label={starred ? "Remove star" : "Star document"}
          className={`pressable -mr-1 -mt-1 shrink-0 ${starred ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground/60 hover:text-foreground"}`}
        >
          <Star className="size-4" fill={starred ? "currentColor" : "none"} />
        </Button>
      </div>

      <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{doc.excerpt || "Empty document"}</p>

      <footer className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        {showOwner ? (
          <>
            <Avatar name={doc.owner.name} color={doc.owner.color} size={20} />
            <span className="truncate">{doc.owner.name}</span>
            <Badge variant="secondary" className="ml-auto rounded-full font-medium">
              {ROLE_LABEL[doc.role]}
            </Badge>
          </>
        ) : (
          <>
            <span>{formatDate(doc.updatedAt)}</span>
            {doc.sharedWith.length > 0 && (
              <span className="ml-auto flex -space-x-1" title={`Shared with ${doc.sharedWith.map((p) => p.name).join(", ")}`}>
                {doc.sharedWith.slice(0, 3).map((p) => (
                  <Avatar key={p.name} name={p.name} color={p.color} size={20} title={`${p.name} (${p.role === "EDITOR" ? "can edit" : "can view"})`} />
                ))}
              </span>
            )}
          </>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="pressable -mr-2 text-muted-foreground" aria-label="Document actions" />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem render={<Link href={`/docs/${doc.id}`} />}>
              <ExternalLink className="size-4" /> Open
            </DropdownMenuItem>
            {isOwner && (
              <>
                <DropdownMenuItem onClick={() => setRenaming(true)}>
                  <Pencil className="size-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={remove}>
                  <Trash2 className="size-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>
    </article>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? `Edited ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
    : `Edited ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}
