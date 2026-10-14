import { cookies } from "next/headers";
import { generateToken } from "@/lib/password";
import { googleAuthUrl, googleEnabled } from "@/lib/google";

/** GET /api/auth/google - start the Google sign-in flow. */
export async function GET(request: Request) {
  if (!googleEnabled()) {
    return Response.redirect(new URL("/login?error=google_disabled", request.url), 302);
  }
  const url = new URL(request.url);
  const state = generateToken(16);
  const next = url.searchParams.get("next") ?? "/";

  const store = await cookies();
  const opts = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 600, secure: process.env.NODE_ENV === "production" };
  store.set("zdocs_oauth_state", state, opts);
  store.set("zdocs_oauth_next", next.startsWith("/") && !next.startsWith("//") ? next : "/", opts);

  return Response.redirect(googleAuthUrl(url.origin, state), 302);
}
