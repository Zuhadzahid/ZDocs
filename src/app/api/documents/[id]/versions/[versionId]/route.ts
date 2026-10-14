import { getDocumentForUser } from "@/lib/access";
import { requireApiUser } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { documentToHtml } from "@/lib/tiptap-server";
import { getVersion } from "@/lib/versions";
import type { JSONContent } from "@tiptap/core";

type Ctx = { params: Promise<{ id: string; versionId: string }> };

/** GET /api/documents/:id/versions/:versionId - snapshot content plus rendered HTML for preview. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id, versionId } = await params;
    await getDocumentForUser(id, user.id, "view");
    const v = await getVersion(id, versionId);
    return Response.json({
      id: v.id,
      title: v.title,
      reason: v.reason,
      createdAt: v.createdAt.toISOString(),
      author: v.author,
      html: documentToHtml(v.content as JSONContent),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
