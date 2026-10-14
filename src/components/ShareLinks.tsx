"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ShareLinkModel {
  id: string;
  url: string;
  role: "VIEWER" | "EDITOR";
  createdAt: string;
}

/** "Anyone with the link" section of the share dialog. Owner only. */
export function ShareLinks({ documentId }: { documentId: string }) {
  const [links, setLinks] = useState<ShareLinkModel[] | null>(null);
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/documents/${documentId}/links`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setLinks)
      .catch(() => setLinks([]));
  }, [documentId]);

  async function create() {
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create link");
      setLinks((prev) => [data, ...(prev ?? [])]);
      await copy(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create link");
    } finally {
      setBusy(false);
    }
  }

  async function copy(link: ShareLinkModel) {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      toast.success("Link copied", { description: `Anyone with it ${link.role === "EDITOR" ? "can edit" : "can view"}.` });
      setTimeout(() => setCopiedId((c) => (c === link.id ? null : c)), 2000);
    } catch {
      toast("Copy this link", { description: link.url, duration: 10_000 });
    }
  }

  async function revoke(link: ShareLinkModel) {
    const res = await fetch(`/api/documents/${documentId}/links/${link.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Could not revoke link");
    setLinks((prev) => (prev ?? []).filter((l) => l.id !== link.id));
    toast("Link turned off", { description: "People who already used it keep their access." });
  }

  return (
    <section aria-labelledby="share-links-heading" className="space-y-3">
      <h3 id="share-links-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Anyone with the link
      </h3>
      <div className="flex gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "VIEWER" | "EDITOR")}
          aria-label="Link permission"
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="VIEWER">Can view</option>
          <option value="EDITOR">Can edit</option>
        </select>
        <Button variant="outline" size="sm" onClick={create} disabled={busy} className="pressable gap-1.5">
          <Link2 className="size-3.5" /> Create link
        </Button>
      </div>

      {links && links.length > 0 && (
        <ul className="space-y-1.5" aria-label="Active links">
          {links.map((l) => (
            <li key={l.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-xs">
              <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
              <code className="min-w-0 flex-1 truncate" title={l.url}>
                {l.url.replace(/^https?:\/\//, "")}
              </code>
              <span className="shrink-0 rounded-full bg-background px-1.5 py-0.5 font-medium text-muted-foreground">
                {l.role === "EDITOR" ? "Can edit" : "Can view"}
              </span>
              <Button variant="ghost" size="icon-xs" onClick={() => copy(l)} aria-label="Copy link" className="pressable">
                {copiedId === l.id ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => revoke(l)} aria-label="Turn off link" className="pressable hover:text-destructive">
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
