# AI workflow

This note explains how AI tools were used to build ZDocs, where they genuinely sped things
up, what they got wrong, and how everything they produced was verified. The short version:
AI wrote most of the first-draft code and tests; every architectural decision, scope cut and
acceptance check was mine, and the test suite is what proved the result rather than trust.

## 1. Tools used

| Tool | Role |
|---|---|
| **Claude Code** (Claude Fable 5.1) in the Claude desktop app | Pair programmer for the whole build: scaffolding, route handlers, components, tests, docs. It also drove a built-in browser and `curl` to verify behaviour |
| **Emil Kowalski's design-engineering skills** (`.claude/skills`, MIT, from github.com/emilkowalski/skills) | Loaded into Claude Code for the UI pass: animation decision framework, button press feedback, stagger rules, "pick a library, don't hand-roll" |
| **shadcn/ui CLI** | Component scaffolding (not AI, but AI chose and wired the components) |

No AI-generated images or copy outside this repository. The logo was supplied by me; AI
cropped and exported it.

## 2. How AI helped at each stage

### Planning

The assignment was pasted in together with a system-design interview video I wanted the
write-up to mirror. The first exchange produced a prioritised plan: the five must-haves in
order, a stack recommendation with reasons, a data model of three tables, and a list of
deliberate cuts to state out loud. I accepted the stack and the "one permission chokepoint"
idea, pushed back on nothing at this stage, and later overrode the auth and presence
approaches (see section 5).

### Coding

AI produced the first version of nearly every file. The pattern that worked: I described
the behaviour and the constraint, it wrote the module and the matching test, I ran the
checks and reviewed the diff. Things that were materially faster than doing them by hand:

- **Reading the framework docs I did not know.** The project scaffolded onto Next.js 16, which renamed middleware to proxy, made `cookies()` and `params` async, and turned on Cache Components by default. Claude read the bundled docs in `node_modules/next/dist/docs` before writing code, which avoided an hour of fighting the new rendering model.
- **Boilerplate at volume.** Seventeen route handlers, zod schemas, the seed script, the shadcn component wiring and the Tailwind layouts compiled first time.
- **Conversions.** The Markdown → editor JSON → PDF mapping and the Turndown rules were tedious to write and easy to get subtly wrong; the unit tests pin the exact output.

### Debugging

Claude ran the app in its browser pane and hit the API with `curl` for every error path,
reading server logs and console output. This caught, among others, a Postgres "prepared
statement already exists" error from a transaction pooler on the first run, a stale favicon,
an excerpt that glued block boundaries together, and a toolbar that did not reflect the
selection in Tiptap v3.

### Testing

Vitest suites were written alongside the code they cover. The Playwright suite was written
after the features worked by hand, and its first run failed ten of eleven specs. Every
failure was a real finding (see `TESTING.md`): ambiguous locators exposed accessibility
quirks, and two timing failures exposed a focus bug and an optimistic-update race. The fixes
went into the application or into the tests waiting on real network responses, never into
loosened assertions.

## 3. Examples of prompts used

Paraphrased from the session, in the order they were used:

1. *"This is a take-home I want to crack. Tell me what we have to do, using the framing from this system-design video."* → the plan, stack and cuts.
2. *"Start the thing."* → scaffold, schema, seed, auth, API, pages, verification in the browser.
3. *"Now I want proper authentication, a real person can authenticate with Gmail or any other email. Rename to ZDocs. Keep the three test users."* → scrypt passwords, Session table, optional Google OAuth, landing page.
4. *"Add the Axiforma fonts and the logo everywhere, add shadcn/ui and these design skills, build a Google-Docs-like sidebar: New document, My documents, Shared with me, Recent, Starred. Make it usable by a hundred thousand people concurrently."* → design system, dashboard, indexes, capped lists, the scaling section.
5. *"Confirm: is this written as a senior engineer or a full-stack developer?"* → an honest list of what a senior reviewer would flag, which became the next round of work.
6. *"Add Playwright so it becomes more good."* → sixteen specs.
7. *"Tell me what takes more time to build out of these five stretch features."* → a ranked estimate.
8. *"Do not build ranks 1, 2 and 3. Build 4 to 8 and test them properly."* → version history, export, share links, presence, with unit and e2e tests.
9. *"Push the code using this repo. Do not add any Claude attribution; only my name."* → commit and push as me.

## 4. How AI output was reviewed and verified

- **Gates before every run:** `tsc --noEmit`, ESLint (including React Compiler rules), Vitest. Nothing was accepted red.
- **API contract by `curl`:** 401 without a session (including the retired mock cookie), 403 for a viewer saving, an editor sharing, or exporting a document they cannot see, 404 for unknown ids, 400 for blank titles, unsupported imports and oversized files, 409 for conflicting saves.
- **Browser walkthroughs:** sign up, wrong password, sign in as each demo user, type and format, confirm "Saved", re-fetch the JSON to confirm the mark persisted, share through the dialog and confirm from the other account's dashboard and editor, star and check the Starred view, open the history panel, download Markdown and PDF, redeem and revoke a link.
- **End-to-end tests:** 16 Playwright specs across three signed-in browser contexts, run before every push.
- **Reading the diff.** Every generated file was read before it was kept. Comments that explained *why* were kept; comments that restated the code were removed.
- **Production build** run locally before deploy.

## 5. What was changed or rejected

| AI output | What I did instead | Why |
|---|---|---|
| Cache Components / Partial Prerendering left on by the scaffold | Turned off, documented in `next.config.ts` | Every page depends on the session cookie; the Suspense ceremony bought nothing |
| An auth library with a Prisma adapter for "real" auth | ~200 lines: scrypt, a Session table, a minimal Google OAuth client | The library was in beta against Next 16 and credentials sign-in sits awkwardly in it; I can defend every line of the replacement |
| A third-party realtime service for presence | Database heartbeat every 15 s | No extra account for reviewers; scales with Postgres; the lag is acceptable for "who is here" |
| Headless Chrome for PDF export | `@react-pdf/renderer` from the document JSON | Keeps the serverless bundle light and the output deterministic |
| Trusting the browser's MIME type on upload | Extension allowlist plus size checks on client and server | `.md` files arrive with inconsistent MIME types across operating systems |
| "Switch ORM" suggestion for the prepared-statement error | `pgbouncer=true` on the connection string | The cause was a transaction pooler, not the ORM |
| `util.promisify(crypto.scrypt)` | Explicit Promise wrapper | `promisify` drops the options overload and failed type-checking |
| shadcn's `use-mobile` hook as generated | Rewritten with `useSyncExternalStore` | Failed the React Compiler `set-state-in-effect` lint rule |
| shadcn's `--accent` token overwriting my brand variable | Brand moved to `--brand`, `--primary` pointed at it | Fight the library's conventions and you lose; adopt them and buttons are blue by default |
| `editor.getText()` for the excerpt | `getText({ blockSeparator: " " })` | Spotted "line.Q4 Product Roadmap" on the mobile layout check |
| Hover-only rename/delete icons on cards | Always visible below the `sm` breakpoint | Touch screens have no hover |
| Native `confirm()` before restoring a version | Inline two-step confirm in the panel | The headless e2e run showed the dialog swallowing the click; the inline confirm is also better UX |
| Turndown's default list output (`-   item` with blank lines) | Custom list-item rule plus unwrapping single-paragraph items | Tight, conventional Markdown, pinned by a unit test |
| Toolbar using `editor.isActive()` directly | `useEditorState` selectors | Tiptap v3 does not re-render on every transaction |

## 6. Challenges and lessons

- **AI is confident about frameworks it has not seen.** The single most valuable habit was making it read the installed docs before writing framework code.
- **Hand verification is not enough.** Several things that "worked when I clicked them" failed under Playwright for real reasons. The suite found a focus bug and a race that a human demo would never have surfaced.
- **Ask for the honest review.** Prompt 5 above ("senior or full-stack?") produced the most useful list of the session: integration tests, migrations, consistent dialogs, server-derived excerpts, skeletons, structured logging. Half of it shipped; the rest is listed as known gaps rather than hidden.
- **Decide, then delegate.** Scope (no comments, no live cursors), the data model, the conflict strategy and the presence approach were my calls. AI proposed options and implemented the decision; it did not make it.
