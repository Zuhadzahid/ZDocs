import Link from "next/link";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { signOut } from "@/app/actions/auth";

export function AppHeader({
  user,
  children,
}: {
  user: { name: string; email: string; color: string };
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo />
          <span className="hidden sm:inline">ZDocs</span>
        </Link>
        <div className="flex-1 min-w-0">{children}</div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-sm leading-tight sm:block">
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-zinc-500">{user.email}</div>
          </div>
          <Avatar name={user.name} color={user.color} />
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
              title="Sign out"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
