# Submission

**ZDocs** — lightweight collaborative document editor, built for the Ajaia Full Stack
Product Engineer assignment by Zuhad Zahid.

## 1. Links

| Item | Link |
|---|---|
| Live application | https://z-docs-ajaia.vercel.app/ |
| GitHub repository | https://github.com/Zuhadzahid/ZDocs |
| Walkthrough video | https://www.loom.com/share/9185c165815644f0992fd8d3bb771e78 (unlisted) |

## 2. Demo accounts

Open the live URL and click **Sign in**. All demo accounts use the password **`demo1234`**.
On the sign-in form, the **Alice / Bob / Carol** chips fill the credentials for you. You can
also create your own account with any email.

| Account | Email | What to try |
|---|---|---|
| Alice Chen | alice@ajaia.test | Owner of the roadmap, the onboarding checklist and the six project documents. Share, create links, restore history, export |
| Bob Martinez | bob@ajaia.test | Editor on the roadmap and the project docs; cannot share or delete them. Owns "Weekly sync notes" |
| Carol Okafor | carol@ajaia.test | Viewer on the roadmap and the project docs; read-only editor, no toolbar, Restore hidden |

To see two users at once, sign in with a second account in an incognito window. Open the
same document in both to see the **Here now** presence avatars.

The six project documents (README, Architecture, AI Workflow, Testing, Submission,
Walkthrough Script) are seeded into Alice's account from these very files and shared with
Bob (edit) and Carol (view), so the sharing model can be reviewed on real content.

## 3. Implemented features

**Core**

- Email + password sign-up and sign-in with scrypt hashing and server-side sessions; optional Google sign-in
- Landing page with embedded sign-in / sign-up card; ZDocs branding, Axiforma typeface, shadcn/ui
- Dashboard with Google-Docs-style sidebar: New document, My documents, Shared with me, Recent, Starred
- Create, rename, delete, reopen, star documents
- Rich text: bold, italic, underline, strikethrough, headings 1–3, bulleted and numbered lists, quotes, code blocks, undo/redo
- Autosave with status indicator and conflict detection (409 plus reload banner)
- Import `.txt`, `.md`, `.docx` (2 MB cap) as a new document with structure preserved; clear rejection of other types
- Sharing by email with **Can edit** / **Can view**; owner-only management; owned vs shared sections; access-denied and not-found pages
- Postgres persistence on Neon; seeded demo data
- Validation and error handling on every route

**Stretch**

- Version history with preview and restore (edits coalesced per author per two minutes, newest 50 kept)
- Export to Markdown and PDF
- Share-by-link with a role, revocable
- Presence indicators showing who has the document open

**Quality**

- 31 Vitest unit tests and 16 Playwright end-to-end specs, all passing (see `TESTING.md`)
- Scaling posture documented: pooled connections, indexes, capped lists, rate limiting, deferred side effects
- Deployed on Vercel with Neon Postgres

## 4. Known limitations

- No real-time co-editing or live cursors; concurrent edits are detected, not merged
- No comments or suggestion mode
- Import is text-focused: images in `.docx` are dropped, Markdown tables flatten to text
- No email verification, password reset or MFA; sign-in rate limiting is per server instance
- Schema applied with `prisma db push` rather than migrations
- PDF layout is structurally faithful, not pixel-identical to the editor

**With another 2–4 hours:** live cursors with Yjs, then comments anchored to text, then
password reset. Details and estimates in `ARCHITECTURE.md`.

## 5. Final submission checklist

- [x] Source code pushed to GitHub as Zuhad Zahid
- [x] `README.md` with overview, stack, setup, environment variables, run and test instructions, limitations
- [x] `ARCHITECTURE.md` with system architecture, ER diagram, access flowchart, save sequence diagram, tradeoffs
- [x] `AI_WORKFLOW.md` with tools, how AI helped, verification and corrections
- [x] `TESTING.md` with frameworks, commands, coverage, manual checklist and results
- [x] `WALKTHROUGH_SCRIPT.md` with the recording plan
- [x] Demo accounts seeded and documented
- [x] Sample import files included
- [x] Deployed to Vercel; live URL added to `README.md` and this file
- [x] Demo data seeded against the production database
- [x] Walkthrough video recorded; link added to `VIDEO_URL.txt` and this file
