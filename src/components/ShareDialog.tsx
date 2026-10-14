"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "./Avatar";
import { ShareLinks } from "./ShareLinks";

export interface ShareEntry {
  user: { id: string; name: string; email: string; color: string };
  role: "VIEWER" | "EDITOR";
}
interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  color: string;
}

export function ShareDialog({
  documentId,
  title,
  owner,
  shares,
  onChange,
  onClose,
}: {
  documentId: string;
  title: string;
  owner: { name: string; email: string; color: string };
  shares: ShareEntry[];
  onChange: (shares: ShareEntry[]) => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VIEWER" | "EDITOR">("EDITOR");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);

  useEffect(() => {
    fetch("/api/users").then((r) => (r.ok ? r.json() : [])).then(setDirectory).catch(() => {});
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function grant(targetEmail: string, targetRole: "VIEWER" | "EDITOR") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, role: targetRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not share");
      const entry: ShareEntry = { user: data.user, role: data.role };
      const existed = shares.some((s) => s.user.id === entry.user.id);
      onChange([...shares.filter((s) => s.user.id !== entry.user.id), entry]);
      setEmail("");
      const roleLabel = entry.role === "EDITOR" ? "can edit" : "can view";
      toast.success(existed ? `${entry.user.name} now ${roleLabel}` : `Shared with ${entry.user.name}`, {
        description: existed ? undefined : `${entry.user.email} ${roleLabel}`,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not share";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(userId: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/documents/${documentId}/shares/${userId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not remove access");
      return;
    }
    const removed = shares.find((s) => s.user.id === userId);
    onChange(shares.filter((s) => s.user.id !== userId));
    if (removed) toast(`Removed ${removed.user.name}`, { description: "They can no longer open this document." });
  }

  const notYetShared = directory.filter((u) => !shares.some((s) => s.user.id === u.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="share-title" className="mb-1 text-lg font-semibold">
          Share &ldquo;{title}&rdquo;
        </h2>
        <p className="mb-4 text-sm text-zinc-500">People you add can open this document from their home page.</p>

        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) grant(email, role);
          }}
        >
          <input
            list="share-directory"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Add people by email"
            className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <datalist id="share-directory">
            {notYetShared.map((u) => (
              <option key={u.id} value={u.email}>
                {u.name}
              </option>
            ))}
          </datalist>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "VIEWER" | "EDITOR")}
            className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
            aria-label="Permission"
          >
            <option value="EDITOR">Can edit</option>
            <option value="VIEWER">Can view</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
          >
            Share
          </button>
        </form>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">People with access</h3>
        <ul className="space-y-2">
          <li className="flex items-center gap-3 text-sm">
            <Avatar name={owner.name} color={owner.color} size={28} />
            <span className="flex-1 truncate">
              {owner.name} <span className="text-zinc-500">({owner.email})</span>
            </span>
            <span className="text-zinc-500">Owner</span>
          </li>
          {shares.map((s) => (
            <li key={s.user.id} className="flex items-center gap-3 text-sm">
              <Avatar name={s.user.name} color={s.user.color} size={28} />
              <span className="flex-1 truncate">
                {s.user.name} <span className="text-zinc-500">({s.user.email})</span>
              </span>
              <select
                value={s.role}
                disabled={busy}
                onChange={(e) => grant(s.user.email, e.target.value as "VIEWER" | "EDITOR")}
                className="rounded-md border border-zinc-200 px-2 py-1 text-xs"
                aria-label={`Permission for ${s.user.name}`}
              >
                <option value="EDITOR">Can edit</option>
                <option value="VIEWER">Can view</option>
              </select>
              <button
                type="button"
                onClick={() => revoke(s.user.id)}
                disabled={busy}
                className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-red-600"
                aria-label={`Remove ${s.user.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div className="my-5 h-px bg-border" />
        <ShareLinks documentId={documentId} />

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-brand hover:bg-brand/5">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
