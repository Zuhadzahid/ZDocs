# Walkthrough video script (3-5 minutes)

Record with Loom or OBS at the live URL. Have two browser windows ready: a normal one
signed in as Alice and an incognito one signed in as Carol. Speak in the order below.

## 0:00 - 0:30  Framing

"This is ZDocs, a scoped Google-Docs-style editor. I treated it like a system-design
exercise: define requirements, pick a small data model, build one permission chokepoint,
and ship something a reviewer can test in two minutes. Stack is Next.js, Tiptap, Prisma
and Postgres on Neon, deployed on Vercel."

## 0:30 - 1:30  Main flow (Alice)

1. Landing page, then sign in as Alice with `demo1234`: "Accounts are real: scrypt-hashed passwords, server-side sessions, optional Google sign-in. Three demo accounts are seeded so sharing can be demoed instantly."
2. Dashboard: walk the sidebar top to bottom: New document, My documents, Shared with me, Recent, Starred. Star the roadmap and show it appear under Starred.
3. Click **New document** in the sidebar. Type a heading, make it Heading 1, add bullets, bold a word.
   Point at the **Saved** indicator. "Autosave coalesces edits for 800 ms, and every save
   carries the version it was based on, so a stale save returns 409 instead of overwriting."
4. Rename the title in the header. Refresh the page: formatting and title persist.

## 1:30 - 2:15  Import

1. Back on home, drop `samples/sample-markdown.md` on the import box.
2. "Headings, emphasis and lists survived. The server converts text, markdown or Word to
   HTML, then into the same editor schema the browser uses, so nothing unsupported sneaks in."
3. Show the rejection message by dropping a `.png` or `.pdf`.

## 2:15 - 3:15  Sharing (Alice -> Carol)

1. Open "New hire onboarding checklist". Click **Share**, type `carol@ajaia.test`, choose **Can view**.
2. Switch to the incognito window as Carol. Refresh home: the doc appears under **Shared with me** with a **Can view** badge.
3. Open it as Carol: no toolbar, "View only" badge. Try to type: nothing happens.
4. Back as Alice, change Carol to **Can edit**. Carol refreshes: toolbar appears.
5. "Every route goes through one function, resolveAccess, and that function has unit tests.
   The UI uses the same helpers so what you see matches what the API accepts."

## 3:00 - 3:30  Stretch features (fast)

1. Open **History**, click an older version, **Restore**, confirm. "Edits within two minutes coalesce so history stays readable."
2. **Export** → PDF. Open the file. "Rendered from the document JSON, no headless browser."
3. **Share** → Create link (Can view). Paste it in the incognito window as Bob: he lands on the doc read-only. Point at the **Here now** avatars on both screens.

## 3:30 - 4:00  Decisions and cuts

- "Content is stored as ProseMirror JSON, not HTML, so formatting round-trips exactly."
- "Ownership is a column, shares are a join table with a role. Sessions are rows, so sign-out really invalidates."
- "I cut comments, suggestion mode and live cursors on purpose: they live deep in the editor engine or need a CRDT relay. Conflicts are detected, not merged. With 2-4 more hours I would add live cursors with Yjs, then comments."

## 4:00 - 4:30  AI workflow

- "I used Claude Code throughout. It read the Next 16 docs for me, produced the boilerplate, and drove the browser and curl to verify every error path."
- "I rejected or changed several outputs: skipped a beta auth library in favour of 200 explainable lines, turned off Cache Components, replaced MIME-based upload checks with an allowlist, fixed a pooler connection issue it misdiagnosed, and fixed excerpt and touch-screen issues found during the review pass. Details are in AI_WORKFLOW.md."

## 4:30  Close

"Repo, README, architecture and AI notes are in the Drive folder. Thanks."
