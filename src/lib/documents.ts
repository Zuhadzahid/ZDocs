import { prisma } from "./db";
import { resolveAccess, type AccessRole } from "./permissions";

/**
 * Dashboard queries. Each returns a flat, serialisable card model so the
 * server component can hand it straight to client components. Every list is
 * capped (PAGE_SIZE) so a user with thousands of documents never makes the
 * dashboard pull them all; the index on (ownerId, updatedAt) serves the
 * common case directly.
 */
export const PAGE_SIZE = 60;

export type DashboardView = "mine" | "shared" | "recent" | "starred";

export interface Person {
  id: string;
  name: string;
  email: string;
  color: string;
}

export interface DocumentCardModel {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
  role: AccessRole;
  starred: boolean;
  owner: Person;
  sharedWith: { name: string; color: string; role: "VIEWER" | "EDITOR" }[];
}

const personSelect = { id: true, name: true, email: true, color: true } as const;
const docInclude = {
  owner: { select: personSelect },
  shares: { include: { user: { select: personSelect } } },
} as const;

type DocWithRelations = {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: Date;
  ownerId: string;
  owner: Person;
  shares: { userId: string; role: "VIEWER" | "EDITOR"; user: Person }[];
};

function toCard(doc: DocWithRelations, userId: string, starredIds: Set<string>): DocumentCardModel | null {
  const role = resolveAccess(doc, doc.shares, userId);
  if (!role) return null;
  return {
    id: doc.id,
    title: doc.title,
    excerpt: doc.excerpt,
    updatedAt: doc.updatedAt.toISOString(),
    role,
    starred: starredIds.has(doc.id),
    owner: doc.owner,
    sharedWith: doc.shares.map((s) => ({ name: s.user.name, color: s.user.color, role: s.role })),
  };
}

async function starredIdsFor(userId: string): Promise<Set<string>> {
  const stars = await prisma.documentStar.findMany({ where: { userId }, select: { documentId: true } });
  return new Set(stars.map((s) => s.documentId));
}

export async function listDocuments(userId: string, view: DashboardView): Promise<DocumentCardModel[]> {
  const starred = await starredIdsFor(userId);

  switch (view) {
    case "mine": {
      const docs = await prisma.document.findMany({
        where: { ownerId: userId },
        orderBy: { updatedAt: "desc" },
        take: PAGE_SIZE,
        include: docInclude,
      });
      return docs.map((d) => toCard(d, userId, starred)).filter(Boolean) as DocumentCardModel[];
    }
    case "shared": {
      const shares = await prisma.documentShare.findMany({
        where: { userId },
        orderBy: { document: { updatedAt: "desc" } },
        take: PAGE_SIZE,
        include: { document: { include: docInclude } },
      });
      return shares.map((s) => toCard(s.document, userId, starred)).filter(Boolean) as DocumentCardModel[];
    }
    case "recent": {
      const views = await prisma.documentView.findMany({
        where: { userId },
        orderBy: { viewedAt: "desc" },
        take: PAGE_SIZE,
        include: { document: { include: docInclude } },
      });
      // Access is re-checked here: a document un-shared since it was opened drops out.
      return views.map((v) => toCard(v.document, userId, starred)).filter(Boolean) as DocumentCardModel[];
    }
    case "starred": {
      const stars = await prisma.documentStar.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        include: { document: { include: docInclude } },
      });
      return stars.map((s) => toCard(s.document, userId, starred)).filter(Boolean) as DocumentCardModel[];
    }
  }
}

/** Counts for the sidebar badges, all in one round trip. */
export async function dashboardCounts(userId: string) {
  const [mine, shared, starred] = await prisma.$transaction([
    prisma.document.count({ where: { ownerId: userId } }),
    prisma.documentShare.count({ where: { userId } }),
    prisma.documentStar.count({ where: { userId } }),
  ]);
  return { mine, shared, starred };
}

/** Record that the user opened a document (drives the Recent view). */
export async function recordView(userId: string, documentId: string) {
  await prisma.documentView.upsert({
    where: { userId_documentId: { userId, documentId } },
    update: { viewedAt: new Date() },
    create: { userId, documentId },
  });
}
