# ZDocs

A lightweight collaborative document editor inspired by Google Docs, built for the
Ajaia Full Stack Product Engineer assignment.

**Live demo:** _see `SUBMISSION.md`_ · **Walkthrough video:** _see `VIDEO_URL.txt`_

## What it does

| Area | Behaviour |
|---|---|
| Documents | Create, rename (inline on the card or in the editor header), delete, reopen |
| Editing | Rich text with bold, italic, underline, strikethrough, headings 1-3, bulleted and numbered lists, quotes, undo/redo. Autosaves 800 ms after you stop typing; status shown in the header |
| Import | Drop a `.txt`, `.md` or `.docx` file (max 2 MB) on the home page and it becomes a new editable document. Headings, emphasis and lists survive the import. Other file types are rejected with a clear message |
| Sharing | Owner shares with another account as **Can edit** or **Can view**. Home page separates **My documents** from **Shared with me**. Viewers get a read-only editor; editors cannot share or delete |
| Persistence | Postgres via Prisma. Content is stored as ProseMirror JSON so formatting round-trips exactly |
| Conflicts | Saves carry the version timestamp the client loaded. If someone else saved in between, the API returns 409 and the editor shows a reload banner instead of overwriting |

| Dashboard | Google-Docs-style sidebar: New document, My documents, Shared with me, Recent, Starred. Lists are capped at 60 and indexed for the common queries |
| Version history | Each save is snapshotted; edits by the same person within two minutes are grouped. Preview any version and restore it (the restore itself is recorded). Newest 50 kept |
| Export | Download as Markdown (.md) or PDF (.pdf) from the editor header. PDF is rendered server-side from the document JSON, no headless browser |
| Share links | Owner creates a link that grants Can view or Can edit to anyone who opens it while signed in. Links can be revoked; access already granted is kept |
| Presence | Avatars of everyone who has the document open, refreshed every 15 seconds via heartbeat (no WebSocket service needed) |
| Auth | Real accounts: sign up with any email and a password (scrypt-hashed), or with Google when OAuth credentials are configured. Sessions are server-side rows referenced by an httpOnly cookie |

To act as two users at once, sign in with a second account in an incognito window.

## Demo accounts

All three use the password `demo1234`.

| Name | Email | Owns | Shared with them |
|---|---|---|---|
| Alice Chen | alice@ajaia.test | Q4 Product Roadmap, New hire onboarding checklist | Weekly sync notes (view) |
| Bob Martinez | bob@ajaia.test | Weekly sync notes | Q4 Product Roadmap (edit) |
| Carol Okafor | carol@ajaia.test | – | Q4 Product Roadmap (view) |

You can also create your own account from the landing page.

## Run locally

Requirements: Node 20+ and a Postgres connection string (Neon free tier works, or any local Postgres).

```bash
npm install
```

Create `.env` from the example and set `DATABASE_URL`:

```bash
cp .env.example .env
```

Push the schema and seed demo data:

```bash
npm run db:push && npm run db:seed
```

Start the app:

```bash
npm run dev
```

Open http://localhost:3000, create an account or sign in with a demo account.

### Optional: Google sign-in

Create an OAuth client (type **Web application**) in Google Cloud Console, add
`http://localhost:3000/api/auth/google/callback` (and your production origin) as an
authorised redirect URI, then set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
The **Continue with Google** button appears automatically when both are set. A Google
sign-in with the same email as an existing password account signs into that account.

**No Postgres handy?** `npx prisma dev` starts a local Postgres-compatible server and
prints a connection string. Append `&pgbouncer=true` to that string before putting it in
`.env` (it runs behind a transaction pooler).

## Tests

Unit tests (Vitest, no database needed):

```bash
npm test
```

End-to-end tests (Playwright, Chromium). They start the dev server if it is not already running and use the database in `.env`, creating and deleting their own documents:

```bash
npx playwright install chromium
```

```bash
npm run test:e2e
```

The sign-up spec creates a throwaway account each run; remove them with `npm run db:cleanup-e2e`.

The e2e suite covers version history (coalescing, preview, restore), Markdown and PDF export including access checks, share links (sign-in bounce, grant, revoke, invalid token), presence between two signed-in browsers, and: landing page and auth card, wrong password, demo-account sign-in, sign-out and protected-route redirect, sign-up and duplicate-email refusal, create-type-format-autosave-reload-rename, star and the Starred view, API validation, markdown import structure, rejected uploads, and the full sharing matrix (viewer read-only, unshared user denied, editor gets the toolbar).

Vitest covers the access-resolution logic that gates every document route
(`src/lib/permissions.ts`), the file import pipeline (`src/lib/import.ts`) including
markdown structure surviving the conversion into editor JSON and rejection of unsupported
or oversized files, and password hashing plus the sign-up and sign-in validation rules
(`src/lib/password.ts`, `src/lib/validation.ts`), plus the sign-in rate limiter.

## Deploy (Vercel + Neon)

1. Create a Neon project and copy the pooled connection string.
2. Import the GitHub repo into Vercel. Build command is the default (`npm run build`, which runs `prisma generate` first).
3. Add `DATABASE_URL` (and optionally `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) as environment variables in Vercel.
4. From your machine, with the same `DATABASE_URL` in `.env`, run `npm run db:push && npm run db:seed` once to create tables and demo accounts.
5. Deploy. Sign in with a demo account or create a new one.

## Design system

- **Typeface:** Axiforma (self-hosted via `next/font/local`, `src/fonts/axiforma`).
- **Components:** [shadcn/ui](https://ui.shadcn.com) on Base UI (`src/components/ui`), lucide icons, Sonner toasts.
- **Brand:** colours sampled from the ZDocs logo (`public/logo.png`, `public/logo-mark.png`; original in `design/`).
- **Motion and UI craft:** Emil Kowalski's design-engineering skills are vendored in `.claude/skills` (MIT) and were applied to the landing page, cards and dialogs.

## Project layout

```
prisma/schema.prisma      data model (User, Session, Document, DocumentShare, DocumentStar,
                          DocumentView, DocumentVersion, DocumentPresence, ShareLink)
prisma/seed.ts            demo users, documents and shares
src/app/                  routes (App Router)
  page.tsx                landing page (signed out) or dashboard with ?view= (signed in)
  login/, signup/         email + password auth pages
  actions/auth.ts         signUp / signIn / signOut server actions
  api/auth/google/        Google OAuth start + callback
  docs/[id]/page.tsx      editor page; renders access-denied for 403
  api/documents/...       REST handlers: create, get/patch/delete, shares, star, import,
                          versions (+restore), export, presence, links
  share/[token]/          invite-link landing page
src/components/           landing, auth card, sidebar, dashboard, cards, editor, share dialog
  ui/                     shadcn/ui primitives
src/lib/
  auth.ts                 session create/lookup/destroy (httpOnly cookie + Session table)
  password.ts             scrypt hashing, session tokens (unit tested)
  google.ts               minimal Google OAuth client
  documents.ts            dashboard queries (mine / shared / recent / starred)
  versions.ts             snapshot coalescing, pruning, restore (unit tested)
  export.ts, pdf.tsx      Markdown via Turndown, PDF via @react-pdf/renderer (unit tested)
  presence.ts             heartbeat presence (unit tested)
  share-links.ts          role-carrying invite links (unit tested)
  rate-limit.ts           in-memory sign-in limiter (unit tested)
  permissions.ts          pure role resolution (unit tested)
  access.ts               load document + enforce required role (used by every route)
  import.ts               txt/md/docx -> HTML (unit tested)
  tiptap-server.ts        HTML -> editor JSON, excerpt extraction
  validation.ts           zod schemas and limits
samples/                  files to try the import with
e2e/                      Playwright specs (auth, documents, sharing, import)
```

See `ARCHITECTURE.md` for decisions and tradeoffs and `AI_WORKFLOW.md` for how AI tools were used.

## Known limits

- No real-time co-editing. Concurrent edits are detected (409) but not merged.
- No email verification or password reset yet; no rate limiting on sign-in.
- Import supports three text-based formats; images inside `.docx` are dropped.
- No comments or suggestion mode; presence shows who is here but not live cursors.
