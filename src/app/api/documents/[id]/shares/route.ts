import { getDocumentForUser } from "@/lib/access";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { badRequest, errorResponse } from "@/lib/errors";
import { firstIssue, shareSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/documents/:id/shares - grant (or change) another user's access.
 * Body: { email, role: "VIEWER" | "EDITOR" }. Owner only.
 */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = shareSchema.safeParse(body);
    if (!parsed.success) throw badRequest(firstIssue(parsed.error));
    const { email, role } = parsed.data;

    const { doc } = await getDocumentForUser(id, user.id, "manage");

    const target = await prisma.user.findUnique({ where: { email } });
    if (!target) throw badRequest(`No user with the email ${email}. Try one of the seeded accounts.`);
    if (target.id === doc.ownerId) throw badRequest("The owner already has full access");

    const share = await prisma.documentShare.upsert({
      where: { documentId_userId: { documentId: id, userId: target.id } },
      update: { role },
      create: { documentId: id, userId: target.id, role },
      include: { user: { select: { id: true, name: true, email: true, color: true } } },
    });
    return Response.json(share, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
