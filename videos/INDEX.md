# ZDocs demo clips

Recorded automatically with `npm run demos` (Playwright, Chromium, 1280x720, demo accounts
against the local server). Re-run that command any time to refresh them. This folder is
git-ignored.

| Clip | Length | What it shows |
|---|---|---|
| `00-landing.mp4` | 0:23 | Landing page: hero, dragging and flicking through the feature timeline, keyboard and buttons, the sign-in / create-account card |
| `01-write-it-down.mp4` | 0:41 | New document from the sidebar, title, Heading 1, bulleted list, bold, the Saved indicator, reload with everything intact |
| `02-import-files.mp4` | 0:30 | Import a Markdown file into a live document with headings, bold and lists; edit it; a `.png` is rejected with a clear message |
| `03-share-by-email.mp4` | 1:01 | Share with Bob as editor and Carol as viewer; sign in as Carol, find it under Shared with me, open it read-only; the owner upgrades her and the toolbar appears |
| `04-share-link.mp4` | 0:53 | Create a view link; Bob opens it, signs in, lands on the document read-only; the owner turns the link off; Carol gets "This link has been turned off" |
| `05-presence.mp4` | 0:32 | Alice has a document open; Bob opens it elsewhere; his avatar appears on her screen within one heartbeat |
| `06-version-history.mp4` | 0:39 | Bob rewrote Alice's draft; open History, preview the earlier version, restore it with the inline confirm |
| `07-export.mp4` | 0:28 | Export menu: download as Markdown, then as PDF |
| `08-dashboard.mp4` | 0:42 | Sidebar views My documents, Shared with me, Recent, Starred; star a card; rename and delete from the card menu |
| `09-accounts.mp4` | 0:33 | Sign up with a new email, sign out, a wrong password is refused, sign in with the Alice demo chip |
| `10-conflict-detection.mp4` | 0:38 | Bob saves a newer version while Alice types on a stale copy; her save is refused with a banner; Reload shows Bob's version |
| `11-mobile.mp4` | 0:16 | Phone viewport: collapsed sidebar, one-tap toggle, single-column cards, the editor |

Total about 7.5 minutes, 9.8 MB.

## Final product video

`Z-Docs-Final-Video.mp4` (2:21, 1920x1080, 30 fps, H.264 + AAC, 19 MB) cuts all twelve clips into one
horizontal piece for YouTube and X: brand open and close, one short section label per
feature, the clips' own caption bars for explanation, no voice-over. Built with the
OpenMontage Remotion composer; edit list and notes in `demos/final-video/`.

Music credit for the video description:
"Music: Aitech by Kevin MacLeod (incompetech.com), licensed under CC BY 3.0".

Each scenario lives in `demos/<name>.demo.ts`. Scenarios create their own documents and
delete them at the end; the sign-up clip creates a throwaway account that
`npm run db:cleanup-e2e` removes.
