import { getCurrentUser } from "@/lib/auth";
import { googleEnabled } from "@/lib/google";
import type { DashboardView } from "@/lib/documents";
import { Dashboard } from "@/components/Dashboard";
import { Landing } from "@/components/Landing";

export const dynamic = "force-dynamic";

const VIEWS: DashboardView[] = ["mine", "shared", "recent", "starred"];

/** Signed out: landing page with sign in / sign up. Signed in: the documents dashboard. */
export default async function HomePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return <Landing googleEnabled={googleEnabled()} />;

  const { view } = await searchParams;
  const active = VIEWS.includes(view as DashboardView) ? (view as DashboardView) : "mine";
  return <Dashboard user={user} view={active} />;
}
