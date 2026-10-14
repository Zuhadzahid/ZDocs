# AI workflow note

## Tools used

- **Claude Code (Claude Fable 5.1)** inside the Claude desktop app, used as a pair programmer for the whole build: scaffolding, writing route handlers and components, running the app in its built-in browser, and exercising the API with curl.
- **Emil Kowalski's design-engineering skills** (`.claude/skills`, MIT) loaded into Claude Code for the UI pass: the animation decision framework, button press feedback, stagger rules and the "pick a library, don't hand-roll" guidance shaped the landing page, cards and sidebar.
- No other AI tools. No AI-generated images or copy outside this repository.

## Where AI materially sped things up

1. **Reading the framework docs I did not know.** The project scaffolded onto Next.js 16, which renamed middleware to proxy, made `cookies()` and `params` async, and turned on Cache Components by default. Claude read the bundled docs in `node_modules/next/dist/docs` before writing code, which avoided an hour of fighting the new rendering model.
2. **Boilerplate at volume.** Seven route handlers, zod schemas, the seed script and the Tailwind layouts were produced in one pass each and compiled first time. That left the time budget for product decisions and verification.
3. **Verification loops.** Claude drove the running app in a browser (sign in, type, apply bold, open the share dialog, add a user) and hit the API with curl for every 4xx path. That caught a real bug quickly (see below).
4. **Design-system adoption.** shadcn/ui init plus sixteen components, the Axiforma `next/font/local` wiring and the logo crop/export were done in minutes, leaving time to tune spacing, motion and empty states by hand.
5. **Test authoring.** The vitest suites for permissions and import were written alongside the code they cover, so the tests reflect intended behaviour rather than being retrofitted.

## What was changed or rejected

- **Cache Components / Partial Prerendering.** The scaffold enabled `cacheComponents: true`. Every page here depends on the session cookie, so the extra Suspense boundaries buy nothing. Turned it off and documented why in `next.config.ts`.
- **Upload type checking.** The first draft trusted the browser's MIME type. Replaced with an extension allowlist plus size checks on both client and server, because `.md` files arrive with inconsistent MIME types across operating systems.
- **Prisma connection string.** The first local run failed with `prepared statement "s0" already exists`. The suggested fix (switch to a different ORM) was rejected; the actual cause was a transaction pooler, fixed with `pgbouncer=true` and documented in `.env.example`.
- **Excerpt generation.** The initial `editor.getText()` call glued block boundaries together ("line.Q4 Product Roadmap"). Spotted on the mobile layout check; fixed with `blockSeparator`.
- **Hover-only card actions.** Rename/delete icons were hidden until hover, which does not exist on touch screens. Changed to always visible below the `sm` breakpoint.
- **Auth framework vs. hand-rolled.** When real authentication was added, the default suggestion was an auth library with a Prisma adapter. I rejected it: the library was in beta against Next 16, and credentials-based sign-in sits awkwardly in those libraries. The replacement is about 200 lines (scrypt hashing, a Session table, a minimal Google OAuth client) that I can defend line by line, with the Google provider switched on only when credentials exist.
- **scrypt typing.** The first password helper used `util.promisify(crypto.scrypt)`, which drops the options overload and failed type-checking. Replaced with an explicit Promise wrapper.
- **shadcn's `accent` token collided with mine.** The init overwrote my brand `--accent` variable with shadcn's neutral hover colour. Rather than fight the library, the brand colour moved to `--brand` and `--primary` was pointed at it, so shadcn buttons are blue by default.
- **shadcn's `use-mobile` hook failed lint** under React 19's `set-state-in-effect` rule. Rewritten with `useSyncExternalStore`.
- **Screenshot-driven fixes.** A mid-animation screenshot showed the card stagger; a later one showed a stale favicon. Both fixed before moving on.
- **Native `confirm()` for restore.** Worked by hand, but the headless e2e run never sent the restore request because the browser dialog swallowed the click. Replaced with an inline two-step confirm inside the panel, which is also better UX. The test caught a real design smell, not just a test problem.
- **Turndown list output.** Default rules turned Tiptap's `<li><p>` into `-   item` with blank lines. A custom list-item rule plus unwrapping single-paragraph items gives tight, conventional Markdown; the unit test pins the exact output.
- **Tiptap v3 toolbar state.** A first toolbar used `editor.isActive()` directly, which in v3 does not re-render on selection changes. Replaced with `useEditorState` selectors.

## How correctness, UX and reliability were verified

- **Type and lint gates:** `tsc --noEmit` and `eslint` clean before every run.
- **Unit tests:** 31 vitest assertions across version coalescing, Markdown export, presence windows, share-link role merging, the sign-in rate limiter, password hashing and auth validation, access resolution (owner/editor/viewer/none), capability helpers, filename and type detection, text and markdown conversion, markdown structure surviving into editor JSON, and rejection of empty, oversized and unsupported files.
- **API contract by curl:** unauthenticated 401 (including the retired mock cookie), signed-out page redirect to /login, Google route redirecting with a clear message when not configured, viewer PATCH 403, editor trying to share 403, missing document 404, blank title 400, unsupported import 400, successful `.md` and `.txt` import 201.
- **End-to-end tests:** 16 Playwright specs drive the real app in Chromium against the real database: auth flows, editor autosave with a reload, starring, import structure, and the full sharing matrix across three browser contexts. Three first-run failures were locator ambiguities (a nav link with a button role, Next's route announcer having `role=alert`) and two were timing assumptions (the star button is optimistic; a `<select>` steals keyboard focus from the editor). Each was fixed by making the test wait on the real network response rather than by loosening the assertion.
- **Browser walkthrough:** sign up as a brand-new user and land on an empty dashboard, sign out, attempt a wrong password and see the error, sign in as Alice, open a document, type and bold text, confirm "Saved" and re-fetch the JSON to confirm the mark persisted; share a private draft with Carol via the dialog and confirm Carol's home page lists it under "Shared with me" with the right badge and that her view of a view-only doc hides the toolbar; confirm Bob gets the access-denied page for a document not shared with him.
- **Responsive check:** home and editor at 375 px wide.
- **Production build:** `next build` run locally before deploy.

## Judgement calls that stayed human

Scope (three import formats, no real-time), the auth approach (sessions in rows, Google optional), the data model (ownership as a column, shares as a join table), the conflict strategy (detect, do not merge), and what to cut when the clock ran. AI proposed options; the decisions and the tradeoff table in `ARCHITECTURE.md` are mine.
