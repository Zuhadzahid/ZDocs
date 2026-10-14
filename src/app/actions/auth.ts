"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { colorForEmail, createSession, destroySession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { firstIssue, signInSchema, signUpSchema } from "@/lib/validation";
import { signInLimiter } from "@/lib/rate-limit";

export interface AuthState {
  error?: string;
  values?: { name?: string; email?: string };
}

function safeNext(raw: FormDataEntryValue | null): string {
  const v = typeof raw === "string" ? raw : "";
  // Only allow same-origin relative paths to avoid open redirects.
  return v.startsWith("/") && !v.startsWith("//") ? v : "/";
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  };
  const values = { name: raw.name, email: raw.email };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { error: firstIssue(parsed.error), values };

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists. Sign in instead.", values };
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), color: colorForEmail(email) },
  });
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { email: raw.email };
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { error: firstIssue(parsed.error), values };

  if (!signInLimiter.check(parsed.data.email)) {
    return { error: "Too many sign-in attempts. Please wait a minute and try again.", values };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Same message for unknown email and wrong password so accounts cannot be enumerated.
  const ok = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !ok) {
    if (user && !user.passwordHash) {
      return { error: "This account uses Google sign-in. Use the Google button instead.", values };
    }
    return { error: "Incorrect email or password.", values };
  }

  signInLimiter.reset(parsed.data.email);
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  await destroySession();
  redirect("/");
}
