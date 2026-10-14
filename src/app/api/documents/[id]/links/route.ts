import { z } from "zod";
import { getDocumentForUser } from "@/lib/access";
import { requireApiUser } from "@/lib/auth";
import { badRequest, errorResponse } from "@/lib/errors";
import { buildShareUrl, createShareLink, listShareLinks } from "@/lib/share-links";
import { firstIssue } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

const createSchema = z.object({ role: z.enum(["VIEWER", "EDITOR"]) });

function withUrl<T extends { token: string }>(origin: string, link: T) {
  return { ...link, url: buildShareUrl(origin, link.token) };
}

/** GET /api/documents/:id/links - active links. Owner only. */
export async function GET(request: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    await getDocumentForUser(id, user.id, "manage");
    const origin = new URL(request.url).origin;
    const links = await listShareLinks(id);
    return Response.json(links.map((l) => withUrl(origin, l)));
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/documents/:id/links { role } - create a link. Owner only. */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw badRequest(firstIssue(parsed.error));
    await getDocumentForUser(id, user.id, "manage");
    const link = await createShareLink(id, parsed.data.role, user.id);
    return Response.json(withUrl(new URL(request.url).origin, { ...link, createdAt: link.createdAt.toISOString() }), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
