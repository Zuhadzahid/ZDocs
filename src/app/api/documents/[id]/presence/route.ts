import { getDocumentForUser } from "@/lib/access";
import { requireApiUser } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { heartbeat, leave } from "@/lib/presence";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/documents/:id/presence - heartbeat; returns the other people currently here. */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    await getDocumentForUser(id, user.id, "view");
    return Response.json({ others: await heartbeat(id, user.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/documents/:id/presence - called on leave (sendBeacon / keepalive). */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    await leave(id, user.id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
