import { getDocumentForUser } from "@/lib/access";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string; userId: string }> };

/** DELETE /api/documents/:id/shares/:userId - revoke access. Owner only. */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id, userId } = await params;
    await getDocumentForUser(id, user.id, "manage");
    await prisma.documentShare.deleteMany({ where: { documentId: id, userId } });
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
