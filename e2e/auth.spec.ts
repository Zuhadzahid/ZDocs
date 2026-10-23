import { expect, test } from "@playwright/test";
import { ALICE, signIn } from "./helpers";

test.describe("authentication", () => {
  test("landing page shows the hero, feature timeline and the auth card", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("A small docs app for notes, drafts and quick sharing")).toBeVisible();
    await expect(page.getByRole("region", { name: "What you can do with ZDocs" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Create account" })).toBeVisible();
  });

  test("wrong password shows an error and stays signed out", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ALICE.email);
    await page.getByLabel("Password", { exact: true }).fill("not-the-password");
    await page.locator("form").getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText("Incorrect email or password.");
  });

  test("demo chip fills the form and sign in lands on the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Alice", exact: true }).click();
    await expect(page.getByLabel("Email")).toHaveValue(ALICE.email);
    await page.locator("form").getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "My documents" })).toBeVisible();
    await expect(page.getByText(ALICE.name)).toBeVisible();
  });

  test("sign out returns to the landing page and protected routes redirect", async ({ page }) => {
    await signIn(page, ALICE.email);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("tab", { name: "Sign in" })).toBeVisible();
    await page.goto("/docs/doc_roadmap");
    await expect(page).toHaveURL(/\/login/);
  });

  test("sign up creates an account and signs in", async ({ page }) => {
    const email = `e2e-${Date.now().toString(36)}@example.com`;
    await page.goto("/signup");
    await page.getByLabel("Name").fill("E2E Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("testpass123");
    await page.getByLabel("Confirm password").fill("testpass123");
    await page.locator("form").getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("heading", { name: "My documents" })).toBeVisible();
    await expect(page.getByText("E2E Tester")).toBeVisible();
    // Signing up twice with the same email is refused.
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("tab", { name: "Sign in" })).toBeVisible();
    await page.goto("/signup");
    await page.getByLabel("Name").fill("Again");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("testpass123");
    await page.getByLabel("Confirm password").fill("testpass123");
    await page.locator("form").getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText("already exists");
  });
});
