import { ALICE, caption, click, demo, expect, pause, type } from "./helpers";

demo("09-accounts", async ({ page }) => {
  const email = `e2e-demo-${Date.now().toString(36)}@example.com`;
  await page.goto("/signup");
  await caption(page, "Create an account with any email", 900);
  const form = page.locator("form");
  await click(page, form.getByLabel("Name"), 100);
  await type(page, "Dana Rivera");
  await click(page, form.getByLabel("Email"), 100);
  await type(page, email);
  await click(page, form.getByLabel("Password", { exact: true }), 100);
  await type(page, "a-long-password", 50);
  await click(page, form.getByLabel("Confirm password"), 100);
  await type(page, "a-long-password", 50);
  await click(page, form.getByRole("button", { name: "Create account", exact: true }), 900);
  await expect(page.getByRole("heading", { name: "My documents" })).toBeVisible();
  await caption(page, "Signed in. A fresh, empty dashboard", 1500);

  await click(page, page.getByRole("button", { name: "Sign out" }), 800);
  await caption(page, "Sign out brings you back to the landing page", 1000);

  await page.goto("/login");
  await caption(page, "A wrong password is refused, without saying which part was wrong", 600);
  const f2 = page.locator("form");
  await click(page, f2.getByLabel("Email"), 100);
  await type(page, ALICE.email);
  await click(page, f2.getByLabel("Password", { exact: true }), 100);
  await type(page, "nope-nope", 50);
  await click(page, f2.getByRole("button", { name: "Sign in", exact: true }), 600);
  await expect(f2.getByRole("alert")).toHaveText("Incorrect email or password.");
  await pause(page, 1200);

  await caption(page, "Demo accounts fill in with one click", 500);
  await click(page, page.getByRole("button", { name: "Alice", exact: true }), 700);
  await click(page, f2.getByRole("button", { name: "Sign in", exact: true }), 800);
  await expect(page.getByRole("heading", { name: "My documents" })).toBeVisible();
  await caption(page, "Welcome back, Alice", 1400);
});
