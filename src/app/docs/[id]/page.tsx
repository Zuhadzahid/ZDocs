import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { recordView } from "@/lib/documents";
import { prisma } from "@/lib/db";
import { getDocumentForUser } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { DocumentEditor } from "@/components/DocumentEditor";
import type { JSONContent } from "@tiptap/core";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await requireUser();
  const { id } = await params;
  try {
    const { doc } = await getDocumentForUser(id, user.id);
    return { title: doc.title };
  } catch {
    return { title: "Document" };
  }
}

export default async function DocumentPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  let loaded;
  try {
    loaded = await getDocumentForUser(id, user.id, "view");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    if (err instanceof ApiError && err.status === 403) return <AccessDenied />;
    throw err;
  }
  const { doc, role } = loaded;

  // Recent view bookkeeping runs after the response is sent so it never delays the page.
  after(() => recordView(user.id, doc.id).catch(() => {}));
  const starred = Boolean(
    await prisma.documentStar.findUnique({
      where: { userId_documentId: { userId: user.id, documentId: doc.id } },
      select: { userId: true },
    }),
  );

  return (
    <DocumentEditor
      currentUser={{ name: user.name, email: user.email, color: user.color }}
      role={role}
      starred={starred}
      document={{
        id: doc.id,
        title: doc.title,
        content: doc.content as JSONContent,
        updatedAt: doc.updatedAt.toISOString(),
        owner: { name: doc.owner.name, email: doc.owner.email, color: doc.owner.color },
        shares: doc.shares.map((s) => ({ user: s.user, role: s.role })),
      }}
    />
  );
}

function AccessDenied() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">You do not have access</h1>
      <p className="max-w-md text-zinc-600">
        This document belongs to someone else and has not been shared with you. Ask the owner to
        share it with your account.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-hover">
          Back to documents
        </Link>
      </div>
    </main>
  );
}
