import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Document not found</h1>
      <p className="text-zinc-600">It may have been deleted, or the link is wrong.</p>
      <Link href="/" className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-hover">
        Back to documents
      </Link>
    </main>
  );
}
