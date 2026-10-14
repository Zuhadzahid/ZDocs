import { prisma } from "./db";

/**
 * Presence via heartbeat.
 *
 * The editor POSTs a heartbeat every HEARTBEAT_MS while the tab is visible.
 * Anyone whose last heartbeat is within ACTIVE_WINDOW_MS counts as "here".
 * This deliberately avoids a WebSocket service: it needs no extra account,
 * works on serverless, and a 15-second lag is acceptable for "who else has
 * this open". Live cursors would need a real channel (see ARCHITECTURE.md).
 */
export const HEARTBEAT_MS = 15_000;
export const ACTIVE_WINDOW_MS = 45_000;
const STALE_AFTER_MS = 10 * 60_000;

export function isActive(lastSeenAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - lastSeenAt.getTime() <= ACTIVE_WINDOW_MS;
}

export interface PresentUser {
  id: string;
  name: string;
  color: string;
  lastSeenAt: string;
}

/** Record `userId` as present and return everyone else who is active. */
export async function heartbeat(documentId: string, userId: string): Promise<PresentUser[]> {
  const now = new Date();
  const [, others] = await prisma.$transaction([
    prisma.documentPresence.upsert({
      where: { documentId_userId: { documentId, userId } },
      update: { lastSeenAt: now },
      create: { documentId, userId, lastSeenAt: now },
    }),
    prisma.documentPresence.findMany({
      where: { documentId, userId: { not: userId }, lastSeenAt: { gte: new Date(now.getTime() - ACTIVE_WINDOW_MS) } },
      include: { user: { select: { id: true, name: true, color: true } } },
      orderBy: { lastSeenAt: "desc" },
      take: 20,
    }),
    // Housekeeping for this document only; cheap because of the (documentId, lastSeenAt) index.
    prisma.documentPresence.deleteMany({ where: { documentId, lastSeenAt: { lt: new Date(now.getTime() - STALE_AFTER_MS) } } }),
  ]);
  return others.map((p) => ({ ...p.user, lastSeenAt: p.lastSeenAt.toISOString() }));
}

export async function leave(documentId: string, userId: string) {
  await prisma.documentPresence.deleteMany({ where: { documentId, userId } });
}
