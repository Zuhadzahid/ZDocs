import { prisma } from "./db";
import { forbidden, notFound } from "./errors";
import { canEdit, canManage, resolveAccess, type AccessRole } from "./permissions";

/**
 * Loads a document and resolves the caller's role in one place. Throws 404
 * when the document does not exist and 403 when the user has no access or
 * lacks the required level. Every document API route calls this first.
 */
export async function getDocumentForUser(
  documentId: string,
  userId: string,
  required: "view" | "edit" | "manage" = "view",
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, email: true, color: true } },
      shares: {
        include: { user: { select: { id: true, name: true, email: true, color: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!doc) throw notFound();

  const role: AccessRole | null = resolveAccess(doc, doc.shares, userId);
  if (!role) throw forbidden();
  if (required === "edit" && !canEdit(role)) throw forbidden("You have view-only access");
  if (required === "manage" && !canManage(role)) throw forbidden("Only the owner can do that");

  return { doc, role };
}
