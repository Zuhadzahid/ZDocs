import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { unauthorized } from "./errors";
import { generateToken, hashToken } from "./password";

/**
 * Session-based authentication.
 *
 * A random token lives in an httpOnly cookie; only its sha256 hash is stored
 * in the Session table. Sessions expire after 30 days and are deleted on
 * sign-out. Users are created either by email + password (see
 * app/actions/auth.ts) or by Google sign-in (see api/auth/google).
 */
export const SESSION_COOKIE = "zdocs_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}

/** For pages: redirect to /login when nobody is signed in. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For route handlers: throw a 401 ApiError when nobody is signed in. */
export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

/** Deterministic avatar colour from the email so it is stable across sign-ins. */
export function colorForEmail(email: string): string {
  const palette = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#4f46e5"];
  let h = 0;
  for (const ch of email) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}
