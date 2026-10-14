import { getDocumentForUser } from "@/lib/access";
import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApiError, badRequest, errorResponse } from "@/lib/errors";
import { firstIssue, updateDocumentSchema } from "@/lib/validation";
import type { Prisma } from "@prisma/client";
import type { JSONContent } from "@tiptap/core";
import { after } from "next/server";
import { recordVersion } from "@/lib/versions";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/documents/:id - document plus the caller's role. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const { doc, role } = await getDocumentForUser(id, user.id, "view");
    return Response.json({ ...doc, role });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * PATCH /api/documents/:id - rename and/or save content.
 * Owners and editors only. If the client sends `baseUpdatedAt` and the
 * stored document is newer, respond 409 so the UI can warn about a conflict
 * instead of silently overwriting another save.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body) throw badRequest("Invalid JSON body");
    const parsed = updateDocumentSchema.safeParse(body);
    if (!parsed.success) throw badRequest(firstIssue(parsed.error));
    const { title, content, excerpt, baseUpdatedAt } = parsed.data;

    const { doc } = await getDocumentForUser(id, user.id, "edit");

    if (content !== undefined && baseUpdatedAt) {
      const base = new Date(baseUpdatedAt).getTime();
      if (doc.updatedAt.getTime() > base + 1000) {
        throw new ApiError(
          409,
          "This document was changed by someone else. Reload to see the latest version.",
        );
      }
    }

    const data: Prisma.DocumentUpdateInput = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content as Prisma.InputJsonValue;
    if (excerpt !== undefined) data.excerpt = excerpt;

    const updated = await prisma.document.update({
      where: { id },
      data,
      select: { id: true, title: true, updatedAt: true },
    });

    // Version history is written after the response so saves stay fast.
    if (content !== undefined) {
      const snapshot = { content: content as JSONContent, title: title ?? doc.title, authorId: user.id };
      after(() => recordVersion(id, snapshot).catch((e) => console.error("recordVersion failed", e)));
    }
    return Response.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/documents/:id - owner only; cascades to shares. */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    await getDocumentForUser(id, user.id, "manage");
    await prisma.document.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
