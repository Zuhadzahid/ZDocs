/**
 * Minimal Google OAuth 2.0 (authorization code) client. Enabled only when
 * GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set, so the app runs fine
 * with email + password alone.
 */
export function googleEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(origin: string): string {
  const base = process.env.APP_URL?.replace(/\/$/, "") || origin;
  return `${base}/api/auth/google/callback`;
}

export function googleAuthUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export interface GoogleProfile {
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

export async function exchangeGoogleCode(origin: string, code: string): Promise<GoogleProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error("Google did not accept the sign-in code");
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!profileRes.ok) throw new Error("Could not read your Google profile");
  const profile = (await profileRes.json()) as GoogleProfile;
  if (!profile.email) throw new Error("Google did not return an email address");
  return profile;
}
