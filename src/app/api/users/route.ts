import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";

/** GET /api/users - directory of accounts, used by the share dialog. */
export async function GET() {
  try {
    const me = await requireApiUser();
    const users = await prisma.user.findMany({
      where: { id: { not: me.id } },
      select: { id: true, name: true, email: true, color: true },
      orderBy: { name: "asc" },
    });
    return Response.json(users);
  } catch (err) {
    return errorResponse(err);
  }
}
