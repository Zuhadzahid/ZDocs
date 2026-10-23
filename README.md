# ZDocs

A small, Google-Docs-inspired app for notes, drafts and quick sharing. Write or import a
document, format it, share it with view or edit access, keep its history, export it.
Originally built as a timeboxed product engineering demo; now a personal project.

- **Live application:** https://z-docs-ajaia.vercel.app/
- **Repository:** https://github.com/Zuhadzahid/ZDocs
- **Walkthrough video:** https://www.loom.com/share/9185c165815644f0992fd8d3bb771e78

Companion documents: [ARCHITECTURE.md](ARCHITECTURE.md) · [AI_WORKFLOW.md](AI_WORKFLOW.md) ·
[TESTING.md](TESTING.md) · [SUBMISSION.md](SUBMISSION.md) · [WALKTHROUGH_SCRIPT.md](WALKTHROUGH_SCRIPT.md)

---

## 1. Project overview

ZDocs lets a team create, edit, import and share rich-text documents in the browser. The
scope was chosen deliberately: depth in editing, sharing and persistence rather than
breadth across every Google Docs feature. Every document route goes through one
authorization chokepoint, content is stored as structured JSON so formatting round-trips
exactly, and the whole stack runs on free tiers so a reviewer can test it without paying
for anything.

## 2. Features

### Core

| Area | What you can do |
|---|---|
| Documents | Create, rename (on the card or in the editor header), delete, reopen, star |
| Editing | Bold, italic, underline, strikethrough, headings 1–3, bulleted and numbered lists, quotes, code blocks, undo/redo. Autosave 800 ms after you stop typing with a visible status |
| Conflict safety | Each save carries the version it was based on. If someone else saved first the API returns 409 and the editor shows a reload banner instead of overwriting |
| Import | Drop a `.txt`, `.md` or `.docx` (max 2 MB) onto the dashboard and it becomes a new editable document; headings, emphasis, lists and code blocks survive. Other types are rejected with a clear message |
| Sharing | Owner grants **Can edit** or **Can view** by email. Viewers get a read-only editor; editors cannot share or delete. Dashboard separates owned from shared documents |
| Dashboard | Google-Docs-style sidebar: New document, My documents, Shared with me, Recent, Starred |
| Authentication | Sign up with any email and password (scrypt-hashed), server-side sessions in an httpOnly cookie, optional Google sign-in when OAuth keys are configured |
| Persistence | Postgres via Prisma on Neon. Documents, shares, stars, views, versions and sessions all survive refresh and redeploys |

### Stretch features shipped

| Feature | Behaviour |
|---|---|
| Version history | Every save is snapshotted; edits by the same person within two minutes are grouped into one version. Preview any version and restore it; the restore is itself recorded. Newest 50 kept |
| Export | Download as **Markdown** or **PDF** from the editor header. PDF is rendered server-side from the document JSON with no headless browser |
| Share by link | Owner creates a link that grants Can view or Can edit to anyone who opens it while signed in. Links can be revoked; access already granted is kept |
| Presence | Avatars of everyone who currently has the document open, refreshed by a 15-second heartbeat |

### Deliberately not built

Comments and suggestion mode, live cursors and real-time co-editing, email verification and
password reset, folders, search. Reasons are in `ARCHITECTURE.md`.

## 3. Technology stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript | UI, API route handlers and server rendering in one deployable unit |
| Editor | Tiptap 3 on ProseMirror | Battle-tested schema and commands; stores JSON, which makes versioning and export trivial |
| Database | PostgreSQL on Neon, Prisma 6 | Relational model fits users / documents / shares; Neon is free and pools connections for serverless |
| UI | Tailwind CSS 4, shadcn/ui (Base UI), lucide icons, Sonner toasts | Accessible primitives without hand-rolling focus management |
| Typeface and brand | Axiforma (self-hosted via `next/font/local`), ZDocs logo | Product identity |
| Validation | Zod | Schema validation at every API boundary |
| Import / export | mammoth (.docx), marked (.md), Turndown (Markdown out), @react-pdf/renderer (PDF out) | Pure JavaScript; nothing to compile on Vercel |
| Testing | Vitest (unit), Playwright (end-to-end) | See `TESTING.md` |
| Hosting | Vercel | Git-based deploys, serverless scaling |

## 4. Installation and setup

Requirements: Node 20 or newer and a Postgres connection string. Neon's free tier works out
of the box; any local Postgres also works.

```bash
git clone https://github.com/Zuhadzahid/ZDocs.git
```

```bash
cd ZDocs && npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Open `.env` and set `DATABASE_URL` (see the next section). Then create the tables and seed
the demo accounts and documents:

```bash
npm run db:push && npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000, sign in with a demo account or create your own.

**No Postgres handy?** `npx prisma dev` starts a local Postgres-compatible server and prints a
connection string. Append `&pgbouncer=true` to it before putting it in `.env`.

## 5. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string. Use Neon's pooled URL (host contains `-pooler`) |
| `GOOGLE_CLIENT_ID` | No | Enables the **Continue with Google** button when set together with the secret |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `APP_URL` | No | Public origin for the Google redirect URI when behind a proxy that rewrites the host. Not needed on Vercel |

Google setup: create an OAuth client (type **Web application**) in Google Cloud Console and
add `<origin>/api/auth/google/callback` as an authorised redirect URI. A Google sign-in with
the same email as an existing password account signs into that account.

## 6. Demo accounts

All three use the password **`demo1234`**. Sign in with a second account in an incognito
window to see sharing and presence between two people.

| Name | Email | Owns | Shared with them |
|---|---|---|---|
| Alice Chen | alice@ajaia.test | Q4 Product Roadmap, New hire onboarding checklist, and the six project documents (README, Architecture, AI Workflow, Testing, Submission, Walkthrough) | Weekly sync notes (view) |
| Bob Martinez | bob@ajaia.test | Weekly sync notes | Q4 Product Roadmap (edit), all six project documents (edit) |
| Carol Okafor | carol@ajaia.test | – | Q4 Product Roadmap (view), all six project documents (view) |

## 7. How to run and test

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm start` | Serve the production build |
| `npm test` | Vitest unit tests (no database needed) |
| `npm run test:e2e` | Playwright end-to-end tests in Chromium against the database in `.env` |
| `npm run test:e2e:ui` | Playwright in interactive UI mode |
| `npm run lint` | ESLint |
| `npm run db:push` | Apply the Prisma schema to the database |
| `npm run db:seed` | Seed demo users, documents, shares, and the project docs |
| `npm run db:cleanup-e2e` | Remove throwaway accounts created by the sign-up e2e test |
| `npm run db:studio` | Prisma Studio to browse the data |

Before the first e2e run install the browser:

```bash
npx playwright install chromium
```

Full test design, coverage, and the latest results are in `TESTING.md`.

## 8. Deployment

The app is deployed on Vercel with a Neon Postgres database at https://z-docs-ajaia.vercel.app/

To deploy your own copy:

1. Create a Neon project and copy the **pooled** connection string.
2. Import the GitHub repository into Vercel. Keep the default build command.
3. Add `DATABASE_URL` (and optionally the Google variables) as Vercel environment variables.
4. From your machine, with the same `DATABASE_URL` in `.env`, run `npm run db:push && npm run db:seed` once.
5. Deploy. Sign in with a demo account.

## 9. Known limitations

- **No real-time co-editing.** Concurrent edits are detected (409 and a reload banner), not merged. Presence shows who is here, not live cursors.
- **No comments or suggestion mode.** Judged too deep in the editor engine for the timebox.
- **Import is text-focused.** Three formats, 2 MB cap, images in `.docx` are dropped, Markdown tables flatten to text because the editor schema has no table node.
- **Auth is minimal.** No email verification, password reset, or multi-factor. The sign-in rate limiter is per server instance.
- **Schema is applied with `prisma db push`.** Fine for a demo; a production deployment would switch to migrations.
- **PDF layout** is faithful to the structure but not pixel-identical to the editor.

## 10. Project layout

```
prisma/schema.prisma      data model (User, Session, Document, DocumentShare, DocumentStar,
                          DocumentView, DocumentVersion, DocumentPresence, ShareLink)
prisma/seed.ts            demo users, documents, shares, and the six project docs
src/app/
  page.tsx                landing page (signed out) or dashboard with ?view= (signed in)
  login/, signup/         email + password auth pages
  actions/auth.ts         signUp / signIn / signOut server actions
  api/auth/google/        Google OAuth start + callback
  docs/[id]/page.tsx      editor page; renders access-denied for 403
  share/[token]/          invite-link landing page
  api/documents/...       REST handlers: create, get/patch/delete, shares, star, import,
                          versions (+restore), export, presence, links
src/components/           landing, auth card, sidebar, dashboard, cards, editor, share dialog,
                          history panel, export menu, presence avatars
  ui/                     shadcn/ui primitives
src/lib/
  auth.ts                 sessions (httpOnly cookie + Session table)
  password.ts             scrypt hashing, session tokens
  permissions.ts          pure role resolution
  access.ts               load document + enforce required role (used by every route)
  documents.ts            dashboard queries
  versions.ts             snapshot coalescing, pruning, restore
  export.ts, pdf.tsx      Markdown and PDF export
  presence.ts             heartbeat presence
  share-links.ts          role-carrying invite links
  import.ts               txt/md/docx -> HTML
  tiptap-server.ts        HTML <-> editor JSON, excerpts
  validation.ts           zod schemas and limits
  rate-limit.ts           in-memory sign-in limiter
e2e/                      Playwright specs
samples/                  files to try the import with
design/                   original logo artwork
```
