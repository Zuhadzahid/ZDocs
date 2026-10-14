# Testing

ZDocs has two automated layers plus a manual checklist. Unit tests cover the pure logic
that must never be wrong (authorization, validation, conversions). End-to-end tests drive
the real application in a real browser against the real database, because the features
that matter here (sharing, presence, autosave) are only meaningful when several signed-in
users act on the same data.

## 1. Frameworks and commands

| Layer | Framework | Command | Needs database |
|---|---|---|---|
| Unit | Vitest 5 | `npm test` | No |
| End-to-end | Playwright 1.x, Chromium | `npm run test:e2e` | Yes, the `DATABASE_URL` in `.env` |
| Lint | ESLint 9 with Next and React Compiler rules | `npm run lint` | No |
| Types | TypeScript strict | `npx tsc --noEmit` | No |

Before the first e2e run:

```bash
npx playwright install chromium
```

Playwright starts `npm run dev` if nothing is listening on port 3000, otherwise reuses the
running server. Tests create their own documents and delete them afterwards. The sign-up
test creates a throwaway account each run; remove those with:

```bash
npm run db:cleanup-e2e
```

## 2. Automated tests and their purpose

### Unit (31 assertions in 5 files, `src/lib/*.test.ts`)

| File | What it protects | Why it matters |
|---|---|---|
| `permissions.test.ts` | `resolveAccess` maps owner / EDITOR share / VIEWER share / none to the right role; `canEdit` and `canManage` | This function gates **every** document route. If it is wrong, sharing is wrong |
| `import.test.ts` | Extension detection, title from filename, text-to-HTML paragraphing and escaping, Markdown structure surviving into editor JSON, rejection of empty, oversized and unsupported files | Import is the only place untrusted file content enters the system |
| `password.test.ts` | scrypt hash verifies the right password and rejects others, fresh salt per hash, malformed hashes rejected, token hashing deterministic; sign-up and sign-in schemas normalise email and enforce password rules | Authentication correctness |
| `rate-limit.test.ts` | Fixed-window limiter allows up to the limit, blocks after, rolls over, resets | Brute-force protection on sign-in |
| `features.test.ts` | Version coalescing rules, exact Markdown export output, presence active window, share-link role merging never downgrades an editor, share URL building | The stretch features' pure cores |

The single most important automated test is the sharing matrix in `permissions.test.ts`:
owner gets `owner`, an EDITOR share gets `editor`, a VIEWER share gets `viewer`, anyone
else gets `null`. Combined with `canEdit`/`canManage`, it is the specification for who can
read, write, share and delete.

### End-to-end (16 specs in 6 files, `e2e/*.spec.ts`)

| File | Scenarios |
|---|---|
| `auth.spec.ts` | Landing page shows the demo wording and auth card; wrong password shows an error; demo chip fills the form and signs in; sign-out returns to landing and a protected route redirects to login; sign-up creates an account and a duplicate email is refused |
| `documents.spec.ts` | Create from the sidebar, type, apply Heading 1 and bold from the toolbar, autosave, reload and verify title and formatting persisted; star a document and see it in Starred; blank title rejected (400) and unknown id is 404 |
| `import.spec.ts` | A Markdown file becomes a document with the right heading, lists and bold; unsupported type and oversized file rejected by the API |
| `sharing.spec.ts` | Owner shares with Carol as viewer; Carol sees it under Shared with me with a Can view badge, opens it read-only (no toolbar), and her PATCH is 403; Bob (not shared) gets the access-denied page and his share attempt is 403; owner upgrades Carol to editor and she gets the toolbar |
| `features.spec.ts` | Two autosaves by the same author coalesce into one version; preview in the history panel; restore writes a "restore" version; Markdown export has the right headers, filename and content; PDF export is a valid PDF; unsupported format is 400; export of a document you cannot access is 403 |
| `sharing-links.spec.ts` | Owner creates a view link in the dialog; a signed-out visitor is bounced to login and back to the document read-only; presence shows each user on the other's screen; revoking keeps existing access but blocks new users; non-owners cannot create links; a bad token shows the invalid-link page |

## 3. Manual testing checklist

Run through this on the deployed URL before recording the video. Tick each item.

### Document creation, editing, saving

- [ ] New document from the sidebar opens the editor with "Untitled document" and focus in the body
- [ ] Rename in the header; status shows Saved; title updates on the dashboard card
- [ ] Bold, italic, underline, strikethrough toggle from toolbar and from Ctrl+B / Ctrl+I / Ctrl+U
- [ ] Heading 1, 2, 3 via the text-style dropdown; bullet and numbered lists; quote
- [ ] Type, wait one second, see Saved; hard-refresh; everything is still there
- [ ] Open the same document in two tabs, edit in both; the second save shows the conflict banner
- [ ] Delete from the card menu; the card disappears and a toast confirms

### Importing

- [ ] Drop `samples/sample-markdown.md`: heading, bold, bullet and numbered lists intact
- [ ] Drop `samples/sample-plain-text.txt`: paragraphs split on blank lines
- [ ] Drop `samples/sample-word.docx`: headings, bold, italic and underline intact
- [ ] Drop a `.png` or `.pdf`: rejected with a clear message, nothing created
- [ ] File over 2 MB: rejected

### Owner, editor, viewer, unauthorized access

- [ ] As Alice (owner): Share button visible; can add Bob as Can edit and Carol as Can view
- [ ] As Bob (editor): toolbar present, can type and save; Share button absent; cannot delete
- [ ] As Carol (viewer): View only badge, no toolbar, typing does nothing; History opens but Restore is hidden
- [ ] As Bob opening a document not shared with him: "You do not have access" page
- [ ] Signed out, open `/docs/<id>`: redirected to login, then back after signing in
- [ ] Change Carol to Can edit; she refreshes and gets the toolbar. Remove her; she gets access denied

### Stretch features

- [ ] History panel lists versions with time and author; preview renders; Restore asks to confirm, then the editor shows the old content and a new "Restored" entry appears
- [ ] Export → Markdown downloads `<title>.md` with headings and lists; Export → PDF opens a readable PDF with the title footer
- [ ] Create a Can view link, open it in an incognito window as Bob: lands on the document read-only; revoke the link, Carol gets "This link has been turned off"
- [ ] Two users on the same document see each other's avatar with a green dot within 15 seconds

### Dashboard

- [ ] My documents, Shared with me, Recent and Starred each show the right set and counts
- [ ] Starring on a card moves it into Starred immediately
- [ ] Phone width: sidebar collapses behind the toggle; cards stack in one column

## 4. Latest results

Run on 2026-10-14 against the Neon database, Windows 11, Node 26, Chromium headless.

| Suite | Result | Time |
|---|---|---|
| `npm test` | 5 files, **31 passed**, 0 failed | about 1 s |
| `npm run test:e2e` | 6 files, **16 passed**, 0 failed | 3 min 42 s |
| `npm run lint` | 0 errors, 0 warnings | |
| `npx tsc --noEmit` | 0 errors | |
| `npm run build` | compiled, 24 routes | |

### Failures found and fixed during the e2e pass

These are kept here because they show what the suite caught, not just that it is green.

| Symptom | Root cause | Fix |
|---|---|---|
| Sign-in click matched two elements | The nav "Sign in" link is a Base UI button, so it has the button role too | Scope the click to the form |
| `getByRole('alert')` matched two elements | Next's route announcer has `role="alert"` | Scope to the form |
| Bold text missing after reload | The text-style `<select>` kept keyboard focus, so later keystrokes never reached the editor | Click back into the editor; apply bold from the toolbar; wait for the save response |
| Starred view empty right after starring | The star button updates optimistically; the test navigated before the server saved | Wait for the `/star` response |
| Restore never reached the server | The native `confirm()` dialog swallowed the click in headless mode | Replaced with an inline two-step confirm in the panel (also better UX) |
| Restore button "outside of the viewport" | The history panel's preview column had no `min-width: 0`, so the sheet overflowed horizontally | `minmax(0, 1fr)` grid column and `overflow-hidden` |

## 5. Known issues and gaps

- The sign-in rate limiter is in-process, so each serverless instance keeps its own counters.
- No tests run against a production build; e2e runs against the dev server.
- Presence has a 15-second heartbeat, so "Here now" can lag by up to that much and can briefly show someone who just closed the tab without the unload beacon landing.
- Markdown tables flatten to text on import because the editor schema has no table node.
- e2e tests share one database with the demo data. They clean up documents they create, but a hard crash mid-test can leave a stray document owned by Alice.
