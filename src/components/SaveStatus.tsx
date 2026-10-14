export type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict";

export function SaveStatus({ state, message }: { state: SaveState; message?: string }) {
  const map: Record<SaveState, { text: string; className: string }> = {
    saved: { text: "Saved", className: "text-zinc-500" },
    dirty: { text: "Unsaved changes", className: "text-zinc-500" },
    saving: { text: "Saving...", className: "text-zinc-500" },
    error: { text: message ?? "Save failed", className: "text-red-600" },
    conflict: { text: message ?? "Conflict", className: "text-amber-700" },
  };
  const { text, className } = map[state];
  return (
    <span className={`text-xs ${className}`} role="status" aria-live="polite">
      {text}
    </span>
  );
}
