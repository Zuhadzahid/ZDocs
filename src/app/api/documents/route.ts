import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EMPTY_DOC } from "@/lib/editor-extensions";
import { badRequest, errorResponse } from "@/lib/errors";
import { createDocumentSchema, firstIssue } from "@/lib/validation";

/** POST /api/documents - create an empty document owned by the caller. */
export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = await request.json().catch(() => ({}));
    const parsed = createDocumentSchema.safeParse(body);
    if (!parsed.success) throw badRequest(firstIssue(parsed.error));

    const doc = await prisma.document.create({
      data: {
        title: parsed.data.title ?? "Untitled document",
        content: EMPTY_DOC,
        ownerId: user.id,
      },
      select: { id: true, title: true },
    });
    return Response.json(doc, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
