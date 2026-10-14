import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { redeemShareLink } from "@/lib/share-links";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/**
 * /share/:token - landing point for invite links. Signed-out visitors are
 * sent to sign in and come straight back here afterwards.
 */
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/share/${token}`)}`);

  const result = await redeemShareLink(token, user.id);
  if (result.ok) redirect(`/docs/${result.documentId}`);

  const revoked = result.reason === "revoked";
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">{revoked ? "This link has been turned off" : "This link is not valid"}</h1>
      <p className="max-w-md text-muted-foreground">
        {revoked
          ? "The owner revoked this invite link. Ask them to share the document with you directly."
          : "Check that you copied the whole link, or ask the owner for a new one."}
      </p>
      <Button nativeButton={false} render={<Link href="/" />}>
        Back to documents
      </Button>
    </main>
  );
}
