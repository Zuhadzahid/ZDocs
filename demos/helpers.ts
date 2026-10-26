import path from "node:path";
import { expect, test as base, type Browser, type BrowserContext, type Page } from "@playwright/test";

/**
 * Shared helpers for demo recordings.
 *
 * `demo(name, fn)` wraps a Playwright test: it adds a visible cursor and a
 * caption bar to every page, runs the scenario, then saves the primary page's
 * recording as videos/<name>.webm (convert.mjs turns it into .mp4).
 */

export const DEMO_PASSWORD = "demo1234";
export const ALICE = { email: "alice@ajaia.test", name: "Alice Chen" };
export const BOB = { email: "bob@ajaia.test", name: "Bob Martinez" };
export const CAROL = { email: "carol@ajaia.test", name: "Carol Okafor" };

const VIDEOS_DIR = path.join(process.cwd(), "videos");

/** Cursor dot + caption bar, injected before any page script runs. */
const OVERLAY_SCRIPT = `
(() => {
  if (window.__demoOverlay) return;
  window.__demoOverlay = true;
  const style = document.createElement("style");
  style.textContent = \`
    #__cursor { position: fixed; z-index: 2147483647; width: 18px; height: 18px; border-radius: 50%;
      background: rgba(29,92,245,.85); border: 2px solid #fff; box-shadow: 0 2px 10px rgba(11,22,51,.35);
      pointer-events: none; transform: translate(-50%, -50%); transition: transform 120ms ease, opacity 200ms ease; opacity: 0; left: 0; top: 0; }
    #__cursor.down { transform: translate(-50%, -50%) scale(.7); }
    #__caption { position: fixed; z-index: 2147483646; left: 50%; bottom: 22px; transform: translateX(-50%);
      max-width: 760px; padding: 10px 18px; border-radius: 999px; background: rgba(11,22,51,.92); color: #fff;
      font: 500 15px/1.4 var(--font-sans, system-ui, sans-serif); letter-spacing: .01em; pointer-events: none;
      opacity: 0; transition: opacity 220ms ease, transform 220ms ease; white-space: nowrap; }
    #__caption.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    #__caption:not(.show) { transform: translateX(-50%) translateY(8px); }
  \`;
  const mount = () => {
    document.head.appendChild(style);
    const c = document.createElement("div"); c.id = "__cursor"; document.body.appendChild(c);
    const cap = document.createElement("div"); cap.id = "__caption"; document.body.appendChild(cap);
    window.addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; c.style.opacity = "1"; }, true);
    window.addEventListener("mousedown", () => c.classList.add("down"), true);
    window.addEventListener("mouseup", () => c.classList.remove("down"), true);
  };
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
`;

export async function prepare(page: Page) {
  await page.addInitScript(OVERLAY_SCRIPT);
}

export const pause = (page: Page, ms = 900) => page.waitForTimeout(ms);

/** Show a caption for the current step (persists until replaced or cleared). */
export async function caption(page: Page, text: string, holdMs = 700) {
  await page.evaluate((t) => {
    const el = document.getElementById("__caption");
    if (!el) return;
    el.textContent = t;
    el.classList.toggle("show", Boolean(t));
  }, text);
  await pause(page, holdMs);
}

/** Move the cursor to an element and click it, so the dot is seen arriving. */
export async function click(page: Page, locator: ReturnType<Page["locator"]> | ReturnType<Page["getByRole"]>, settleMs = 500) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
  await pause(page, 180);
  await locator.click();
  await pause(page, settleMs);
}

/** Human-paced typing. */
export async function type(page: Page, text: string, delay = 38) {
  await page.keyboard.type(text, { delay });
}

export async function signIn(page: Page, email: string, { visible = false } = {}) {
  await page.goto("/login");
  const form = page.locator("form");
  if (visible) {
    await click(page, form.getByLabel("Email"), 100);
    await type(page, email);
    await click(page, form.getByLabel("Password", { exact: true }), 100);
    await type(page, DEMO_PASSWORD, 60);
    await click(page, form.getByRole("button", { name: "Sign in", exact: true }));
  } else {
    await form.getByLabel("Email").fill(email);
    await form.getByLabel("Password", { exact: true }).fill(DEMO_PASSWORD);
    await form.getByRole("button", { name: "Sign in", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "My documents" })).toBeVisible();
}

/** A second signed-in user in their own context (also recorded, but not saved). */
export async function otherUser(browser: Browser, email: string): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  await prepare(page);
  await signIn(page, email);
  return { context, page };
}

export async function createDocument(page: Page, title: string, content?: unknown): Promise<string> {
  const res = await page.request.post("/api/documents", { data: { title } });
  const { id } = await res.json();
  if (content) await page.request.patch(`/api/documents/${id}`, { data: { content } });
  return id as string;
}

export async function deleteDocument(page: Page, id: string) {
  await page.request.delete(`/api/documents/${id}`).catch(() => {});
}

export const paragraph = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });
export const heading = (level: number, text: string) => ({ type: "heading", attrs: { level }, content: [{ type: "text", text }] });
export const doc = (...nodes: unknown[]) => ({ type: "doc", content: nodes });

/**
 * Define a recorded scenario. The primary page's video is saved as
 * videos/<name>.webm once the context closes.
 */
export function demo(name: string, fn: (args: { page: Page; browser: Browser; context: BrowserContext }) => Promise<void>) {
  base(name, async ({ page, browser, context }) => {
    await prepare(page);
    await fn({ page, browser, context });
    await caption(page, "", 400);
    await pause(page, 900);
    const video = page.video();
    await context.close();
    if (video) await video.saveAs(path.join(VIDEOS_DIR, `${name}.webm`));
  });
}

export { expect };
