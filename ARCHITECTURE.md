# Architecture note

This follows the shape of a system-design discussion: requirements, API, data model,
architecture, two deep dives, tradeoffs. The difference is that everything here is sized
for a 4-6 hour build that a reviewer can run, not for a billion users.

## 1. Requirements

**Functional (all shipped)**

- Create, rename, edit, delete and reopen documents.
- Rich text: bold, italic, underline, strikethrough, headings 1-3, bullet and numbered lists, quotes, undo/redo.
- Import a `.txt`, `.md` or `.docx` file as a new document.
- Owner shares a document with another user as viewer or editor; UI distinguishes owned vs shared.
- Everything persists across refresh with formatting intact.
- Real accounts: email + password sign-up and sign-in, optional Google sign-in, server-side sessions.

**Non-functional (scoped for a demo)**

- Zero-cost to run: Vercel free tier + Neon free tier.
- Reviewer can exercise sharing immediately: three seeded accounts with a documented password, or sign up with any email.
- Failure modes are explicit: 400/401/403/404/409 from the API with human-readable messages; the UI surfaces them inline.
- Correctness of the access logic is unit tested because it guards every route, and the
  sharing matrix is also exercised end to end in Playwright with three signed-in browser contexts.

**Stretch features shipped**

Version history with restore, Markdown and PDF export, share-by-link with a role, and
presence indicators. Each was chosen because it falls out of the existing JSON content
model and the single permission chokepoint, so none of them added a new axis of risk.

**Explicitly out of scope**

Comments and suggestion mode (deep editor-engine work), live cursors and real-time
co-editing (needs a CRDT relay), email verification and password reset, folders, search. Each is listed with a "next 2-4 hours" plan at the end.

## 2. API contract

All routes require the session cookie. Responses are JSON; errors are `{ error: string }`.

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/documents` | any user | Create empty document (owner = caller) |
| GET | `/api/documents/:id` | owner, editor, viewer | Document + caller's role |
| PATCH | `/api/documents/:id` | owner, editor | Rename and/or save content; optional `baseUpdatedAt` for conflict detection (409) |
| DELETE | `/api/documents/:id` | owner | Delete (cascades shares) |
| POST | `/api/documents/:id/shares` | owner | Grant or change access `{ email, role }` |
| DELETE | `/api/documents/:id/shares/:userId` | owner | Revoke access |
| POST | `/api/documents/import` | any user | Multipart `file` -> new document |
| GET | `/api/users` | any user | Directory for the share dialog |

Sign-up, sign-in and sign-out are server actions (`src/app/actions/auth.ts`). Google
sign-in uses two route handlers: `GET /api/auth/google` (redirect with a state cookie) and
`GET /api/auth/google/callback` (code exchange, user upsert by email, session creation).

## 3. Data model

```
User            id, email (unique), name, color, passwordHash?, provider, image?
Session         id, tokenHash (unique), userId -> User, expiresAt
Document        id, title, content (JSON), excerpt, ownerId -> User, createdAt, updatedAt
DocumentShare   (documentId, userId) PK, role VIEWER | EDITOR
```

- `content` is the ProseMirror document JSON that Tiptap produces. Storing the editor's
  native format means zero lossy conversions on save or load. HTML would have been
  easier to eyeball but would need sanitising and re-parsing on every load.
- `excerpt` is a denormalised 200-character plain-text preview so the home page does
  not have to walk every document's JSON.
- Ownership is a column, not a share row with role OWNER. That keeps "who can delete /
  share" a one-line check and avoids a document ever having zero owners.
- `updatedAt` doubles as the version stamp for conflict detection.
- Sessions are rows, not JWTs. Sign-out actually invalidates, and a database leak does
  not leak live sessions because only the sha256 of the cookie token is stored.
- `passwordHash` is nullable so Google-only accounts exist without a password; a later
  password sign-up with the same email is refused and pointed at the Google button.

## 4. Architecture

```
Browser (React 19, Tiptap)  --fetch-->  Next.js route handlers  --Prisma-->  Postgres (Neon)
        |                                        |
   server components render               getDocumentForUser()
   home + editor shell with                resolves role and throws
   the user's role baked in                 403/404 before any work
```

The UI uses shadcn/ui primitives (Base UI underneath) with the Axiforma typeface and the
ZDocs brand palette. Motion follows the design-engineering skills checked into
`.claude/skills` (transform/opacity only, strong ease-out curves under 300 ms, press
feedback, reduced-motion fallbacks).

One Next.js app does all three jobs (UI, API, server rendering) so there is one deploy,
one set of environment variables and no CORS. Pages are rendered per request because
every page depends on the cookie; Cache Components was turned off deliberately.

## 5. Deep dive: how a save round-trips

1. Tiptap fires `onUpdate`; the editor serialises `getJSON()` plus a plain-text excerpt.
2. Changes are coalesced for 800 ms, then one PATCH is sent with `baseUpdatedAt` (the
   `updatedAt` the client last saw). A `beforeunload` guard warns if a save is pending.
3. The route validates with zod (title length, document shape, 1 MB cap), loads the
   document through `getDocumentForUser(id, user, "edit")`, and compares timestamps.
4. If someone else saved after `baseUpdatedAt`, it returns 409 and the editor shows a
   reload banner. Otherwise it writes and returns the new `updatedAt`, which becomes the
   next base.
5. On reload the JSON is passed straight into `useEditor({ content })`. Nothing is
   re-parsed, so every mark and node comes back exactly.

## 6. Deep dive: the permission chokepoint

`resolveAccess(doc, shares, userId)` in `src/lib/permissions.ts` is a pure function:
owner -> `owner`, EDITOR share -> `editor`, VIEWER share -> `viewer`, else `null`.
`access.ts` wraps it with the database read and throws typed errors for the three
required levels (`view`, `edit`, `manage`). Every route handler and the editor page call
that one function first, so there is exactly one place where authorisation can be wrong,
and that place has unit tests. The UI uses the same `canEdit` / `canManage` helpers to
decide whether to render the toolbar and the Share button, so what you see matches what
the API will accept.

## 7. Authentication

Passwords are hashed with Node's built-in scrypt (N=16384, r=8, p=1, 16-byte salt), so
there is no native dependency to compile on Vercel. Sign-in returns the same error for
unknown email and wrong password to avoid account enumeration. The session cookie is
httpOnly, SameSite=Lax and Secure in production, valid 30 days. Google OAuth is implemented
directly against Google's endpoints (about 60 lines) rather than through an auth framework:
it is enabled only when client credentials are present, uses a random `state` cookie to
prevent CSRF, and links to an existing account by email. The `next` redirect parameter is
restricted to same-origin paths.

## 8. Deep dive: version history without drowning in autosaves

Autosave fires 800 ms after typing stops, so a naive "row per save" would produce
hundreds of near-identical snapshots per editing session. `recordVersion` instead keeps
one open "head" version: consecutive autosaves by the same author within two minutes
update that row, and a new row starts when the author changes, the window lapses, or the
reason is not autosave (import, restore). Restoring writes the restored state as a new
"restore" version rather than deleting anything, so the action is visible and reversible.
The newest 50 versions are kept. The snapshot is written in `after()`, after the save
response is flushed, so history never slows down typing.

## 9. Design notes on the other stretch features

- **Export.** Markdown goes JSON -> HTML (the editor's own serialiser) -> Turndown, with
  rules for underline (`<u>`, since Markdown has none) and strike. PDF is rendered directly
  from the JSON with @react-pdf/renderer: headings, lists, quotes and marks map to a small
  set of primitives, and no headless browser is needed, which keeps the Vercel bundle light.
- **Share links.** A link row carries a role and a random token. Redeeming it materialises
  a normal `DocumentShare` row (never downgrading an existing editor), so every other code
  path keeps working unchanged. Revoking stops new redemptions but keeps existing access,
  matching the mental model people have from Google Docs.
- **Presence.** A heartbeat every 15 s into a `(documentId, userId, lastSeenAt)` table;
  anyone seen in the last 45 s is "here". The tab pauses heartbeats when hidden and sends a
  keepalive DELETE on unload. This is deliberately not a WebSocket: it needs no third-party
  account, scales with the database, and the 15 s lag is fine for an "also here" strip.
  Live cursors would need Yjs and a relay, which is the first item on the roadmap.

## 10. Import pipeline

`file -> HTML -> editor JSON`. Each format gets the cheapest faithful converter: plain
text is split into paragraphs; markdown goes through `marked`; `.docx` goes through
`mammoth`, which maps Word heading styles to `<h1>`-`<h3>` and keeps bold/italic/lists.
`@tiptap/html` then parses that HTML with the *same extension set the browser editor
uses*, so anything the editor cannot represent is dropped at import time rather than
breaking later. Type and size are checked on both client and server.

## 11. Tradeoffs made on purpose

| Decision | Why | Cost |
|---|---|---|
| shadcn/ui (Base UI) for primitives, hand-built cards and editor | Accessible dialogs, menus, sidebar and tabs without writing focus management; styling stays in Tailwind | One more dependency surface to keep updated |
| Hand-rolled sessions + OAuth over an auth framework | ~200 lines I can explain line by line; no beta-version risk on Next 16; Google is optional | No email verification, password reset or rate limiting yet |
| Last-write-wins with 409 detection | Real merging needs CRDT/OT infrastructure; detection prevents silent data loss | Two people editing simultaneously will see a reload banner |
| Heartbeat presence over WebSockets | Zero extra services for reviewers; scales with Postgres | 15 s lag; no live cursors |
| PDF from JSON over headless Chrome | Light bundle, deterministic output, runs anywhere Node runs | Layout fidelity is good, not pixel-identical to the editor |
| Debounced autosave over explicit Save | Matches Google Docs expectations; fewer lost edits | More write traffic (mitigated by 800 ms coalescing) |
| Three import formats | Covers the realistic cases; each has a solid library | PDF/HTML/Google Docs export not supported |
| Postgres over SQLite | Vercel's filesystem is ephemeral; Neon is free | One more account for the reviewer to understand (not to create) |
| Route handlers over server actions for documents | A REST surface is easier to test with curl and to document | Slightly more boilerplate |

## 12. Scaling posture (what "100k concurrent users" means here)

The app is stateless per request and deploys as serverless functions on Vercel, so the
compute tier scales horizontally by default. The work was in making sure each request is
cheap and the database is not the bottleneck:

| Concern | What is in place | What a real 100k-concurrent deployment adds |
|---|---|---|
| Connections | Neon pooled endpoint (PgBouncer) in front of Postgres; one Prisma client per instance | Neon autoscaling compute, read replicas for dashboard queries |
| Hot queries | Composite index `(ownerId, updatedAt desc)` for "my documents"; indexes on every join column and on `(userId, viewedAt desc)` for Recent | Materialised counts if the sidebar badges get expensive |
| Payload size | Dashboard lists capped at 60 rows; cards carry a 200-char excerpt, never full content; counts fetched in one transaction | Cursor pagination / infinite scroll |
| Writes | Autosave coalesces keystrokes into one PATCH per 800 ms; conflict check is a timestamp compare, not a diff | Yjs/CRDT with a WebSocket relay for true concurrent editing |
| Sessions | One indexed lookup by token hash per request; expired rows self-delete on access | Redis session cache to avoid the DB round trip entirely |
| Abuse | Per-email sign-in rate limit, same error for unknown email and wrong password | Upstash/Redis-backed limiter shared across instances, CAPTCHA after N failures |
| Side effects | "Recent" bookkeeping runs in `after()`, after the response is flushed | Queue (e.g. Inngest) for anything heavier than an upsert |
| Static assets | Logo and fonts self-hosted through Next's image/font pipeline with immutable caching | CDN already provided by Vercel |

Honest ceiling: with the current design a single Neon compute handles the dashboard and
editor load of tens of thousands of active users; the first thing to break at six figures
is write contention on `Document.updatedAt` from autosave, which is why the CRDT relay is
item one on the roadmap below.

## 13. Next 2-4 hours

1. **Live cursors and co-editing** (half a day): Yjs document bound to Tiptap, with a small relay (y-websocket on Fly, or Liveblocks free tier). Presence already gives the avatar strip.
2. **Comments** (3 h): a comment mark in the editor schema, a `Comment` table, a side panel with threads and resolve.
3. **Password reset + email verification** (1 h): signed, expiring tokens emailed via Resend's free tier.
4. **Diff view in history** (1 h): `generateHTML` -> turndown, served from `/api/documents/:id/export`.
