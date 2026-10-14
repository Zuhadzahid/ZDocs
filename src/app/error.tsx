"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-zinc-600">
        {error.message || "An unexpected error occurred."} If the database is not reachable, check
        the DATABASE_URL in your environment.
      </p>
      <button onClick={reset} className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-hover">
        Try again
      </button>
    </main>
  );
}
