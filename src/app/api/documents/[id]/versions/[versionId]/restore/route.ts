import { getDocumentForUser } from "@/lib/access";
import { requireApiUser } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { restoreVersion } from "@/lib/versions";

type Ctx = { params: Promise<{ id: string; versionId: string }> };

/** POST /api/documents/:id/versions/:versionId/restore - owners and editors. */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id, versionId } = await params;
    await getDocumentForUser(id, user.id, "edit");
    const result = await restoreVersion(id, versionId, user.id);
    return Response.json({ ...result.document, content: result.content });
  } catch (err) {
    return errorResponse(err);
  }
}
