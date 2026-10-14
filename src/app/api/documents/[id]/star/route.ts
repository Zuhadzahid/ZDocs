import { getDocumentForUser } from "@/lib/access";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/documents/:id/star - toggle the caller's star. Any role with access. */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    await getDocumentForUser(id, user.id, "view");

    const key = { userId_documentId: { userId: user.id, documentId: id } };
    const existing = await prisma.documentStar.findUnique({ where: key });
    if (existing) {
      await prisma.documentStar.delete({ where: key });
      return Response.json({ starred: false });
    }
    await prisma.documentStar.create({ data: { userId: user.id, documentId: id } });
    return Response.json({ starred: true });
  } catch (err) {
    return errorResponse(err);
  }
}
