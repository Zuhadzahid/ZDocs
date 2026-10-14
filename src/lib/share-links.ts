import type { ShareRole } from "@prisma/client";
import { prisma } from "./db";
import { generateToken } from "./password";

/**
 * Share-by-link. A link carries a role; when a signed-in user opens it, a
 * DocumentShare row is created (or upgraded) for them and they are sent to
 * the document. Links can be revoked; existing shares created through a
 * revoked link are kept, matching how Google Docs behaves.
 */

export function buildShareUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/share/${token}`;
}

/** Pure: a link never downgrades access someone already has. */
export function mergeRole(existing: ShareRole | null, incoming: ShareRole): ShareRole {
  if (existing === "EDITOR") return "EDITOR";
  return incoming;
}

const linkSelect = { id: true, token: true, role: true, createdAt: true } as const;

export async function createShareLink(documentId: string, role: ShareRole, createdById: string) {
  return prisma.shareLink.create({
    data: { documentId, role, createdById, token: generateToken(24) },
    select: linkSelect,
  });
}

export async function listShareLinks(documentId: string) {
  const links = await prisma.shareLink.findMany({
    where: { documentId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: linkSelect,
  });
  return links.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() }));
}

export async function revokeShareLink(documentId: string, linkId: string): Promise<boolean> {
  const result = await prisma.shareLink.updateMany({
    where: { id: linkId, documentId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

export type RedeemResult = { ok: true; documentId: string } | { ok: false; reason: "invalid" | "revoked" };

/** Grant the link's role to `userId` and report where to send them. */
export async function redeemShareLink(token: string, userId: string): Promise<RedeemResult> {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: { document: { select: { id: true, ownerId: true } } },
  });
  if (!link) return { ok: false, reason: "invalid" };
  if (link.revokedAt) return { ok: false, reason: "revoked" };

  const { document } = link;
  if (document.ownerId === userId) return { ok: true, documentId: document.id };

  const existing = await prisma.documentShare.findUnique({
    where: { documentId_userId: { documentId: document.id, userId } },
    select: { role: true },
  });
  const role = mergeRole(existing?.role ?? null, link.role);
  await prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: document.id, userId } },
    update: { role },
    create: { documentId: document.id, userId, role },
  });
  return { ok: true, documentId: document.id };
}
