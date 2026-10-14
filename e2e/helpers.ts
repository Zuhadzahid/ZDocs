import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "demo1234";
export const ALICE = { email: "alice@ajaia.test", name: "Alice Chen" };
export const BOB = { email: "bob@ajaia.test", name: "Bob Martinez" };
export const CAROL = { email: "carol@ajaia.test", name: "Carol Okafor" };

/** Sign in through the real form and wait for the dashboard. */
export async function signIn(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "My documents" })).toBeVisible();
}

/** Create a document through the API using the page's session cookie. */
export async function createDocument(request: APIRequestContext, title: string): Promise<string> {
  const res = await request.post("/api/documents", { data: { title } });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return body.id as string;
}

export async function deleteDocument(request: APIRequestContext, id: string) {
  await request.delete(`/api/documents/${id}`);
}

export function uniqueTitle(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}`;
}
