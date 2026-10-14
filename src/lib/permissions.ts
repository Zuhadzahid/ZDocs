/**
 * Pure access-resolution logic. Kept free of database and framework imports
 * so it can be unit tested directly. Every document route goes through
 * `resolveAccess` (via `getDocumentForUser` in access.ts).
 */
import type { ShareRole } from "@prisma/client";

export type AccessRole = "owner" | "editor" | "viewer";

export interface DocumentLike {
  ownerId: string;
}

export interface ShareLike {
  userId: string;
  role: ShareRole;
}

/** Returns the user's effective role on a document, or null for no access. */
export function resolveAccess(
  doc: DocumentLike,
  shares: ShareLike[],
  userId: string,
): AccessRole | null {
  if (doc.ownerId === userId) return "owner";
  const share = shares.find((s) => s.userId === userId);
  if (!share) return null;
  return share.role === "EDITOR" ? "editor" : "viewer";
}

/** Owners and editors may change title and content. */
export function canEdit(role: AccessRole | null): boolean {
  return role === "owner" || role === "editor";
}

/** Only the owner may share, unshare, or delete. */
export function canManage(role: AccessRole | null): boolean {
  return role === "owner";
}

export const ROLE_LABEL: Record<AccessRole, string> = {
  owner: "Owner",
  editor: "Can edit",
  viewer: "Can view",
};
