"use client";

import { useCallback, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/core";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "./Avatar";

interface VersionSummary {
  id: string;
  title: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; color: string } | null;
}
interface VersionDetail extends VersionSummary {
  html: string;
}

const REASON_LABEL: Record<string, string> = {
  autosave: "Edited",
  restore: "Restored",
  import: "Imported",
  created: "Created",
};

export function HistoryPanel({
  documentId,
  canRestore,
  onRestored,
}: {
  documentId: string;
  canRestore: boolean;
  onRestored: (next: { title: string; content: JSONContent; updatedAt: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<VersionSummary[] | null>(null);
  const [selected, setSelected] = useState<VersionDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    setVersions(null);
    const res = await fetch(`/api/documents/${documentId}/versions`);
    if (!res.ok) {
      toast.error("Could not load history");
      setVersions([]);
      return;
    }
    setVersions(await res.json());
  }, [documentId]);

  // Load on open (from the event, not an effect, so no setState-in-effect cascade).
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setSelected(null);
      void load();
    }
  }

  async function preview(id: string) {
    setConfirming(false);
    const res = await fetch(`/api/documents/${documentId}/versions/${id}`);
    if (!res.ok) return toast.error("Could not load that version");
    setSelected(await res.json());
  }

  async function restore(id: string) {
    setConfirming(false);
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/versions/${id}/restore`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Restore failed");
      onRestored({ title: data.title, content: data.content, updatedAt: data.updatedAt });
      toast.success("Version restored", { description: "The previous state was saved to history." });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={<Button variant="ghost" size="sm" className="pressable gap-1.5 text-muted-foreground" aria-label="Version history" />}
      >
        <History className="size-4" />
        <span className="hidden sm:inline">History</span>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>Version history</SheetTitle>
          <SheetDescription>Edits within two minutes by the same person are grouped into one version.</SheetDescription>
        </SheetHeader>

        <div className="grid min-h-0 flex-1 grid-cols-[13rem_minmax(0,1fr)] overflow-hidden">
          <ScrollArea className="border-r border-border">
            <ul className="p-2" aria-label="Versions">
              {versions === null && (
                <li className="space-y-2 p-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </li>
              )}
              {versions?.length === 0 && <li className="p-3 text-sm text-muted-foreground">No versions yet. Start editing.</li>}
              {versions?.map((v, i) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => preview(v.id)}
                    aria-current={selected?.id === v.id}
                    className={`pressable flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted aria-[current=true]:bg-brand-soft aria-[current=true]:text-brand-hover`}
                  >
                    <span className="font-medium">
                      {formatWhen(v.updatedAt)}
                      {i === 0 && <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">Latest</span>}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {v.author && <Avatar name={v.author.name} color={v.author.color} size={14} />}
                      {REASON_LABEL[v.reason] ?? v.reason} {v.author ? `by ${v.author.name.split(" ")[0]}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>

          <div className="flex min-h-0 min-w-0 flex-col">
            {selected ? (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{selected.title}</div>
                    <div className="text-xs text-muted-foreground">{formatWhen(selected.createdAt)}</div>
                  </div>
                  {canRestore && !confirming && (
                    <Button size="sm" onClick={() => setConfirming(true)} disabled={busy} className="pressable gap-1.5">
                      <RotateCcw className="size-3.5" /> Restore
                    </Button>
                  )}
                  {canRestore && confirming && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Current content stays in history.</span>
                      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} className="pressable">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => restore(selected.id)} disabled={busy} className="pressable gap-1.5">
                        <RotateCcw className="size-3.5" /> Confirm restore
                      </Button>
                    </div>
                  )}
                </div>
                <ScrollArea className="min-h-0 flex-1">
                  <div className="editor-content px-6 py-5 text-sm" data-readonly="true">
                    <div className="tiptap" style={{ minHeight: 0 }} dangerouslySetInnerHTML={{ __html: selected.html }} />
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Select a version to preview it.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
