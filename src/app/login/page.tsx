import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { googleEnabled } from "@/lib/google";
import { Landing } from "@/components/Landing";

export const metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  google_disabled: "Google sign-in is not configured on this deployment. Use email and password.",
  google_state: "The Google sign-in request expired. Please try again.",
  google_failed: "Google sign-in failed. Please try again or use email and password.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { error, next } = await searchParams;
  return <Landing googleEnabled={googleEnabled()} defaultTab="signin" next={next} initialError={error ? ERRORS[error] : undefined} />;
}
