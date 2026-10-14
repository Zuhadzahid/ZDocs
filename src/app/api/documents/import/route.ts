import { requireApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { badRequest, errorResponse } from "@/lib/errors";
import { fileToHtml, MAX_UPLOAD_BYTES } from "@/lib/import";
import { documentToExcerpt, htmlToDocument } from "@/lib/tiptap-server";
import type { Prisma } from "@prisma/client";
import { after } from "next/server";
import { recordVersion } from "@/lib/versions";

/**
 * POST /api/documents/import - multipart form with a `file` field.
 * Supported: .txt, .md, .docx up to 2 MB. Creates a new document owned by
 * the caller and returns its id.
 */
export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw badRequest("Attach a file in the file field");
    if (file.size > MAX_UPLOAD_BYTES) {
      throw badRequest(`File is too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
    }

    let imported;
    try {
      imported = await fileToHtml(file.name, Buffer.from(await file.arrayBuffer()));
    } catch (e) {
      throw badRequest(e instanceof Error ? e.message : "Could not read that file");
    }

    const content = htmlToDocument(imported.html);
    const doc = await prisma.document.create({
      data: {
        title: imported.title.slice(0, 200),
        content: content as Prisma.InputJsonValue,
        excerpt: documentToExcerpt(content),
        ownerId: user.id,
      },
      select: { id: true, title: true },
    });
    after(() => recordVersion(doc.id, { content, title: doc.title, authorId: user.id, reason: "import" }).catch(() => {}));
    return Response.json(doc, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
