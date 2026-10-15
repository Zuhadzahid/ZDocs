# Walkthrough video script (3–5 minutes)

## Setup before recording

- Two browser windows side by side: a normal window signed in as **Alice**, an incognito window signed in as **Bob**. Both at the live URL.
- Dashboard open on both. Close unrelated tabs. Zoom to 110 percent so text is readable.
- Have `samples/sample-markdown.md` and a `.png` file on the desktop for the import demo.
- Loom or OBS at 1080p, microphone checked, notifications off.
- Keep this script on a second screen or printed. Aim for 4 minutes; stop at 5.

---

## 0:00 – 0:30  Introduction

> "This is ZDocs, my product engineering demo for the Ajaia Full Stack Product Engineer role. It is a scoped, Google-Docs-inspired editor: create, format, import and share documents with real accounts and permissions. I treated the brief like a system-design exercise: fix the requirements, pick a small data model, build one permission chokepoint, and ship something you can test in two minutes. Stack is Next.js, Tiptap, Prisma and Postgres on Neon, deployed on Vercel."

Show the landing page briefly, then the dashboard.

## 0:30 – 1:00  Dashboard

Walk the sidebar top to bottom.

> "New document, My documents, Shared with me, Recent and Starred. Accounts are real: hashed passwords, server-side sessions, optional Google sign-in. Three demo accounts are seeded so sharing can be shown immediately."

Click **Starred**, then back to **My documents**. Point at the avatars on a shared card.

## 1:00 – 1:45  Create, edit, format

1. Click **New document**. Type a title in the header.
2. Type a heading line, set **Heading 1** from the dropdown.
3. Add three bullets, bold one word, italic another.
4. Point at the **Saved** indicator.

> "Autosave coalesces keystrokes into one save every 800 milliseconds. Every save carries the version it was based on, so if someone else saved first the server returns 409 and you get a reload banner instead of silently losing their work."

5. Refresh the page. Formatting and title persist.

## 1:45 – 2:15  Import

1. Back on the dashboard, drop `sample-markdown.md` on the import box. It opens as a document.

> "Headings, emphasis and lists survived. The server converts text, Markdown or Word to HTML, then into the same editor schema the browser uses, so nothing unsupported sneaks in."

2. Drop the `.png`: toast says unsupported. "Three formats, two megabytes, stated in the UI and the README."

## 2:15 – 3:15  Sharing and permissions

1. Open the new document. Click **Share**. Add `bob@ajaia.test` as **Can view**.
2. Switch to Bob's window. Refresh the dashboard: the document is under **Shared with me** with a **Can view** badge. Open it: **View only**, no toolbar.
3. Back to Alice: change Bob to **Can edit**. Bob refreshes: toolbar appears, he types a word, Alice sees it on refresh.
4. Point at the **Here now** avatars on both screens.

> "Every route goes through one function, resolveAccess. Owner, editor, viewer or nothing. The UI uses the same helpers to decide what to render, so what you see matches what the API will accept. That function has unit tests, and the whole matrix runs end to end in Playwright with three signed-in browsers."

5. Quick: Share → **Create link** (Can view). "Links carry a role and can be revoked; access already granted stays."

## 3:15 – 3:45  History and export

1. Click **History**. Select an older version, click **Restore**, confirm. The editor shows the old content and a "Restored" entry appears.

> "Edits within two minutes by the same person group into one version so history stays readable."

2. **Export → PDF**. Open the file. "Rendered from the document JSON on the server, no headless browser."

## 3:45 – 4:20  Architecture and testing

Switch to `ARCHITECTURE.md` on GitHub for 20 seconds. Point at the ER diagram and the access flowchart.

> "Content is stored as ProseMirror JSON, not HTML, so formatting round-trips exactly and versions and export fall out for free. Ownership is a column, shares are a join table with a role, and the dashboard lists are capped and indexed for the common queries. Thirty-one unit tests cover the pure logic; sixteen Playwright specs drive the real app: autosave, import, the sharing matrix, history, export, links and presence."

## 4:20 – 4:50  Decisions, cuts, AI

> "I cut comments, suggestion mode and live cursors on purpose: they live deep in the editor engine or need a CRDT relay. With more time I would add live cursors with Yjs, then comments.

> I used Claude Code throughout. It read the Next 16 docs for me, produced the boilerplate, drove the browser and curl to verify every error path, and wrote the first draft of the tests. I rejected or changed several outputs: skipped a beta auth library for 200 explainable lines, turned off Cache Components, replaced a native confirm that broke under test, fixed a pooler connection issue it misdiagnosed. Details are in AI_WORKFLOW.md."

## 4:50 – 5:00  Closing

> "The repository has the README, architecture, testing and AI notes, the live URL and the demo accounts. Thanks for watching."

---

## Recording checklist

- [ ] Both windows signed in, dashboard loaded, no stale test documents visible
- [ ] Sample files ready; import box visible without scrolling
- [ ] Screen recorder captures both windows; cursor visible; audio level checked
- [ ] Walk the script once without recording to check timing (target 4:00)
- [ ] Record. If a step fails, keep going and say what happened; do not restart more than once
- [ ] Upload as unlisted; paste the link into `VIDEO_URL.txt` and `SUBMISSION.md`
- [ ] Watch it back once at 1.5x to confirm audio and that nothing sensitive is on screen
