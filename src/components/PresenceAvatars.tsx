"use client";

import { useEffect, useState } from "react";
import { HEARTBEAT_MS, type PresentUser } from "@/lib/presence";
import { Avatar } from "./Avatar";

/**
 * "Who else has this open" indicator. Sends a heartbeat while the tab is
 * visible, pauses when hidden, and tells the server when the page unloads.
 */
export function PresenceAvatars({ documentId }: { documentId: string }) {
  const [others, setOthers] = useState<PresentUser[]>([]);

  useEffect(() => {
    const url = `/api/documents/${documentId}/presence`;
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    async function beat() {
      try {
        const res = await fetch(url, { method: "POST" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { others: PresentUser[] };
        if (!cancelled) setOthers(data.others);
      } catch {
        // Network blips are fine; the next heartbeat will catch up.
      }
    }
    function start() {
      if (timer) return;
      beat();
      timer = setInterval(beat, HEARTBEAT_MS);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }
    function onVisibility() {
      if (document.visibilityState === "visible") start();
      else stop();
    }
    function onUnload() {
      // keepalive lets the request finish after the page is gone.
      fetch(url, { method: "DELETE", keepalive: true }).catch(() => {});
    }

    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onUnload);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onUnload);
      onUnload();
    };
  }, [documentId]);

  if (others.length === 0) return null;

  return (
    <div className="flex items-center gap-2" aria-live="polite" aria-label={`${others.length} other ${others.length === 1 ? "person" : "people"} here`}>
      <span className="hidden text-xs text-muted-foreground md:inline">Here now</span>
      <span className="flex -space-x-1.5">
        {others.slice(0, 5).map((u) => (
          <span key={u.id} className="relative rounded-full ring-2 ring-background">
            <Avatar name={u.name} color={u.color} size={26} title={`${u.name} is viewing now`} />
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500" aria-hidden />
          </span>
        ))}
        {others.length > 5 && (
          <span className="flex size-[26px] items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-background">
            +{others.length - 5}
          </span>
        )}
      </span>
    </div>
  );
}
