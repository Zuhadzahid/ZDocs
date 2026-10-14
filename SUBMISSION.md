# Submission contents

ZDocs: lightweight collaborative document editor for the Ajaia Full Stack Product Engineer assignment.

## Links

- **Live product:** `<fill in Vercel URL>`
- **Source repository:** `<fill in GitHub URL>`
- **Walkthrough video:** see `VIDEO_URL.txt`

## Test accounts

Open the live URL and sign in. All demo accounts use the password `demo1234`. You can also create your own account with any email.

| Account | Email | What to try |
|---|---|---|
| Alice Chen | alice@ajaia.test | Owns two documents; share "New hire onboarding checklist" with Carol |
| Bob Martinez | bob@ajaia.test | Editor on "Q4 Product Roadmap"; cannot share or delete it |
| Carol Okafor | carol@ajaia.test | Viewer on "Q4 Product Roadmap"; read-only editor |

To see two users at once, sign in with a second account in an incognito window.

## What is in this folder

| Item | File |
|---|---|
| Source code | `collab-docs/` (or the GitHub repo) |
| Setup and run instructions | `README.md` |
| Architecture note | `ARCHITECTURE.md` |
| AI workflow note | `AI_WORKFLOW.md` |
| This list | `SUBMISSION.md` |
| Video link | `VIDEO_URL.txt` |
| Sample files for the import feature | `samples/` |

## Status

**Working end to end**

- Email + password sign-up and sign-in with server-side sessions; optional Google sign-in
- Landing page with embedded sign-in / sign-up card; ZDocs branding, Axiforma type, shadcn/ui
- Dashboard with Google-Docs-style sidebar: New document, My documents, Shared with me, Recent, Starred
- Create, rename, edit, delete, reopen, star documents
- Rich text: bold, italic, underline, strikethrough, headings 1-3, bulleted and numbered lists, quotes, undo/redo
- Autosave with status indicator and conflict detection (409 + reload banner)
- Import `.txt`, `.md`, `.docx` (2 MB cap) as a new document, structure preserved
- Sharing with Can edit / Can view, owner-only management, owned vs shared sections
- Version history with preview and restore
- Export to Markdown and PDF
- Share-by-link with a role, revocable
- Presence indicators (who has the document open)
- Postgres persistence; seeded demo data
- Validation and error handling on every route; access-denied and not-found pages
- 22 unit tests (`npm test`) and 11 Playwright end-to-end tests (`npm run test:e2e`)
- Scaling posture documented in ARCHITECTURE.md (pooling, indexes, capped lists, rate limiting)
- Deployed on Vercel with Neon Postgres

**Incomplete / intentionally not built**

- Email verification, password reset, sign-in rate limiting
- Real-time co-editing (conflicts are detected, not merged)
- Comments and suggestion mode, live cursors / real-time co-editing, folders, search

**Next 2-4 hours:** comments anchored to text, live cursors via Yjs, password reset. Details in `ARCHITECTURE.md`.
