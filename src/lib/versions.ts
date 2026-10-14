import type { Prisma } from "@prisma/client";
import type { JSONContent } from "@tiptap/core";
import { prisma } from "./db";
import { notFound } from "./errors";
import { documentToExcerpt } from "./tiptap-server";

/**
 * Version history.
 *
 * Autosave fires every 800 ms, so writing a row per save would bury useful
 * history under hundreds of near-identical snapshots. Instead, consecutive
 * autosaves by the same author within COALESCE_WINDOW_MS roll into one
 * version; a new row starts when the author changes, the window lapses, or
 * the reason is anything other than autosave. The newest MAX_VERSIONS rows
 * are kept per document.
 */
export const COALESCE_WINDOW_MS = 2 * 60 * 1000;
export const MAX_VERSIONS = 50;

export type VersionReason = "autosave" | "restore" | "import" | "created";

export interface VersionHead {
  authorId: string | null;
  reason: string;
  updatedAt: Date;
}

/** Pure: decide whether the next snapshot extends `head` or starts a new row. */
export function shouldStartNewVersion(
  head: VersionHead | null,
  authorId: string,
  reason: VersionReason,
  now: Date = new Date(),
): boolean {
  if (!head) return true;
  if (reason !== "autosave" || head.reason !== "autosave") return true;
  if (head.authorId !== authorId) return true;
  return now.getTime() - head.updatedAt.getTime() > COALESCE_WINDOW_MS;
}

export interface SnapshotInput {
  content: JSONContent;
  title: string;
  authorId: string;
  reason?: VersionReason;
}

export async function recordVersion(documentId: string, input: SnapshotInput) {
  const reason = input.reason ?? "autosave";
  const head = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    select: { id: true, authorId: true, reason: true, updatedAt: true },
  });

  const data = {
    content: input.content as Prisma.InputJsonValue,
    title: input.title,
    authorId: input.authorId,
    reason,
  };

  if (!shouldStartNewVersion(head, input.authorId, reason)) {
    return prisma.documentVersion.update({ where: { id: head!.id }, data });
  }

  const created = await prisma.documentVersion.create({ data: { documentId, ...data } });

  // Prune: keep the newest MAX_VERSIONS. Done after the insert so the count is exact.
  const stale = await prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    skip: MAX_VERSIONS,
    select: { id: true },
  });
  if (stale.length > 0) {
    await prisma.documentVersion.deleteMany({ where: { id: { in: stale.map((v) => v.id) } } });
  }
  return created;
}

const authorSelect = { id: true, name: true, color: true } as const;

export async function listVersions(documentId: string) {
  const rows = await prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    take: MAX_VERSIONS,
    select: { id: true, title: true, reason: true, createdAt: true, updatedAt: true, author: { select: authorSelect } },
  });
  return rows.map((v) => ({ ...v, createdAt: v.createdAt.toISOString(), updatedAt: v.updatedAt.toISOString() }));
}

export async function getVersion(documentId: string, versionId: string) {
  const v = await prisma.documentVersion.findFirst({
    where: { id: versionId, documentId },
    include: { author: { select: authorSelect } },
  });
  if (!v) throw notFound("Version");
  return v;
}

/**
 * Replace the live document with a past snapshot. The restored state is itself
 * recorded as a new "restore" version so the action is visible and reversible.
 */
export async function restoreVersion(documentId: string, versionId: string, userId: string) {
  const version = await getVersion(documentId, versionId);
  const content = version.content as JSONContent;

  const [updated] = await prisma.$transaction([
    prisma.document.update({
      where: { id: documentId },
      data: { content: content as Prisma.InputJsonValue, title: version.title, excerpt: documentToExcerpt(content) },
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.documentVersion.create({
      data: { documentId, content: content as Prisma.InputJsonValue, title: version.title, authorId: userId, reason: "restore" },
    }),
  ]);
  return { document: updated, content };
}
