import { getDocumentForUser } from "@/lib/access";
import { requireApiUser } from "@/lib/auth";
import { badRequest, errorResponse } from "@/lib/errors";
import { contentDisposition, documentToMarkdown, exportFilename, isExportFormat } from "@/lib/export";
import { documentToPdf } from "@/lib/pdf";
import type { JSONContent } from "@tiptap/core";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/documents/:id/export?format=markdown|pdf - download. Anyone with access. */
export async function GET(request: Request, { params }: Ctx) {
  try {
    const user = await requireApiUser();
    const { id } = await params;
    const format = new URL(request.url).searchParams.get("format");
    if (!isExportFormat(format)) throw badRequest("format must be markdown or pdf");

    const { doc } = await getDocumentForUser(id, user.id, "view");
    const content = doc.content as JSONContent;
    const filename = exportFilename(doc.title, format);

    if (format === "markdown") {
      return new Response(documentToMarkdown(content), {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": contentDisposition(filename),
          "Cache-Control": "private, no-store",
        },
      });
    }

    const pdf = await documentToPdf(doc.title, content);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(filename),
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
