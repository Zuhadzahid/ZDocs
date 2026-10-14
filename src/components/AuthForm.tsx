"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO = [
  { label: "Alice", email: "alice@ajaia.test" },
  { label: "Bob", email: "bob@ajaia.test" },
  { label: "Carol", email: "carol@ajaia.test" },
];
const DEMO_PASSWORD = "demo1234";

export function AuthForm({
  mode,
  next,
  googleEnabled,
  initialError,
  showLinks = true,
}: {
  mode: "signin" | "signup";
  next?: string;
  googleEnabled: boolean;
  initialError?: string;
  showLinks?: boolean;
}) {
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, { error: initialError });
  const [email, setEmail] = useState(state.values?.email ?? "");
  const [password, setPassword] = useState("");
  const suffix = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="space-y-4">
      {googleEnabled && (
        <>
          <Button variant="outline" size="lg" className="pressable w-full" nativeButton={false} render={<a href={`/api/auth/google${suffix}`} />}>
            <GoogleIcon />
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or with email
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form action={formAction} className="space-y-3" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor={`${mode}-name`}>Name</Label>
            <Input id={`${mode}-name`} name="name" autoComplete="name" required defaultValue={state.values?.name} className="h-10" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor={`${mode}-email`}>Email</Label>
          <Input
            id={`${mode}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${mode}-password`}>Password</Label>
          <Input
            id={`${mode}-password`}
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={mode === "signup" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            className="h-10"
          />
        </div>
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor={`${mode}-confirm`}>Confirm password</Label>
            <Input id={`${mode}-confirm`} name="confirm" type="password" autoComplete="new-password" required className="h-10" />
          </div>
        )}

        {state.error && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending} className="pressable h-10 w-full text-[0.95rem]">
          {pending ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      {mode === "signin" && (
        <div className="rounded-lg bg-muted/60 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Reviewing? Use a demo account</p>
          <div className="flex flex-wrap gap-2">
            {DEMO.map((d) => (
              <Button
                key={d.email}
                type="button"
                variant="outline"
                size="sm"
                className="pressable bg-background"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(DEMO_PASSWORD);
                }}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {showLinks && (
        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              New to ZDocs?{" "}
              <Link href={`/signup${suffix}`} className="font-medium text-brand hover:underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href={`/login${suffix}`} className="font-medium text-brand hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
      <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.8 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
