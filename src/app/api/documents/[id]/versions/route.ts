import { getDocumentForUser } from "@/lib/access";
import { requireApiUser } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { listVersions } from "@/lib/versions";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/documents/:id/versions - newest first. Anyone with access. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    await getDocumentForUser(id, user.id, "view");
    return Response.json(await listVersions(id));
  } catch (err) {
    return errorResponse(err);
  }
}
