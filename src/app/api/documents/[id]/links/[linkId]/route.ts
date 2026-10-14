import { getDocumentForUser } from "@/lib/access";
import { requireApiUser } from "@/lib/auth";
import { errorResponse, notFound } from "@/lib/errors";
import { revokeShareLink } from "@/lib/share-links";

type Ctx = { params: Promise<{ id: string; linkId: string }> };

/** DELETE /api/documents/:id/links/:linkId - revoke. Owner only. */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id, linkId } = await params;
    await getDocumentForUser(id, user.id, "manage");
    if (!(await revokeShareLink(id, linkId))) throw notFound("Link");
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
