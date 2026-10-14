import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { colorForEmail, createSession } from "@/lib/auth";
import { exchangeGoogleCode, googleEnabled } from "@/lib/google";

/** GET /api/auth/google/callback - finish Google sign-in, create or link the user. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const fail = (code: string) => Response.redirect(new URL(`/login?error=${code}`, url.origin), 302);
  if (!googleEnabled()) return fail("google_disabled");

  const store = await cookies();
  const expectedState = store.get("zdocs_oauth_state")?.value;
  const next = store.get("zdocs_oauth_next")?.value ?? "/";
  store.delete("zdocs_oauth_state");
  store.delete("zdocs_oauth_next");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || !expectedState || state !== expectedState) return fail("google_state");

  try {
    const profile = await exchangeGoogleCode(url.origin, code);
    const email = profile.email.toLowerCase();

    // Link by email: a password account that signs in with the same Google
    // email becomes the same user, so documents and shares follow the person.
    const user = await prisma.user.upsert({
      where: { email },
      update: { image: profile.picture ?? undefined, name: undefined },
      create: {
        email,
        name: profile.name || email.split("@")[0],
        image: profile.picture,
        provider: "google",
        color: colorForEmail(email),
      },
    });
    await createSession(user.id);
    return Response.redirect(new URL(next, url.origin), 302);
  } catch (err) {
    console.error("Google sign-in failed", err);
    return fail("google_failed");
  }
}
