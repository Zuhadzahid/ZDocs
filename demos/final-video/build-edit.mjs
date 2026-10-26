// Builds the OpenMontage Explainer props (edit decision list) for the ZDocs
// product video: 12 demo clips trimmed to their payoff moments, a hero open and
// close, one section label per feature, and a light soundtrack. Output:
// edit.json, consumed by `npm run final-video` (see package.json).
import { writeFileSync } from "node:fs";

const FADE = 0.35;
const cuts = [];
const overlays = [];
let t = 0;

function video(id, src, from, len, label, sub) {
  cuts.push({
    id, source: `zdocs/${src}.mp4`, source_in_seconds: from,
    in_seconds: +t.toFixed(2), out_seconds: +(t + len).toFixed(2),
    animation: "none", vignette: false, backgroundColor: "#f7f8fb", transition_in: "fade", transition_out: "fade", transition_duration: FADE,
  });
  if (label) overlays.push({ type: "section_title", text: label, subtitle: sub, position: "bottom-left", in_seconds: +(t + 0.2).toFixed(2), out_seconds: +(t + len - 0.2).toFixed(2) });
  t += len;
}
function hero(id, text, subtitle, len) {
  // Plain brand-coloured card: a background clip showed through the scrim and fought the title.
  cuts.push({ id, type: "hero_title", text, heroSubtitle: subtitle, source: "", accentColor: "#1d5cf5",
    in_seconds: +t.toFixed(2), out_seconds: +(t + len).toFixed(2), transition_in: "fade", transition_out: "fade", transition_duration: 0.6 });
  t += len;
}

hero("open", "ZDocs", "Write it down. Share it in seconds.", 3.4);
video("landing",   "00-landing",            4.0, 7.0, "A small docs app", "for notes, drafts and quick sharing");
video("write",     "01-write-it-down",     21.0, 10.0, "Write it down", "01 / 07");
video("import-a",  "02-import-files",       7.0, 8.0, "Bring in your files", "02 / 07");
video("import-b",  "02-import-files",      25.0, 3.0, "Bring in your files", "02 / 07");
video("share-a",   "03-share-by-email",    10.0, 11.0, "Share with the right people", "03 / 07");
video("share-b",   "03-share-by-email",    38.0, 4.5, "Share with the right people", "03 / 07");
video("link-a",    "04-share-link",        12.0, 5.0, "Or just send a link", "04 / 07");
video("link-b",    "04-share-link",        24.0, 5.0, "Or just send a link", "04 / 07");
video("link-c",    "04-share-link",        46.0, 3.0, "Or just send a link", "04 / 07");
video("presence",  "05-presence",          17.0, 9.0, "See who is here", "05 / 07");
video("history",   "06-version-history",   20.0, 12.0, "Go back in time", "06 / 07");
video("export",    "07-export",            11.0, 9.0, "Take it with you", "07 / 07");
video("dash-a",    "08-dashboard",          8.0, 9.0, "Your dashboard", "My documents · Shared · Recent · Starred");
video("dash-b",    "08-dashboard",         29.0, 6.0, "Your dashboard", "Rename and delete from the card");
video("acct-a",    "09-accounts",           4.0, 7.0, "Accounts", "Sign up with any email");
video("acct-b",    "09-accounts",          23.0, 6.0, "Accounts", "Wrong passwords are refused");
video("conflict",  "10-conflict-detection", 19.0, 11.0, "Conflict detection", "No silent overwrites");
video("mobile",    "11-mobile",             4.0, 8.0, "On a phone", "Same app, one column");
hero("close", "ZDocs", "z-docs-ajaia.vercel.app  ·  github.com/Zuhadzahid/ZDocs", 3.6);

const props = {
  themeConfig: {
    primaryColor: "#1d5cf5", accentColor: "#1d5cf5", backgroundColor: "#f7f8fb", surfaceColor: "#ffffff",
    textColor: "#0b1633", mutedTextColor: "#4b5563", headingFont: "Space Grotesk", bodyFont: "Space Grotesk",
    chartColors: ["#1d5cf5", "#38bdf8", "#10b981", "#f59e0b"], springConfig: { damping: 20, stiffness: 120, mass: 1 },
    transitionDuration: 0.35, captionHighlightColor: "#1d5cf5", captionBackgroundColor: "rgba(255,255,255,0.85)",
  },
  cuts, overlays, captions: [],
  audio: { music: { src: "zdocs/music.mp3", volume: 0.16, fadeInSeconds: 1.5, fadeOutSeconds: 3.5, offsetSeconds: 0, loop: false } },
};
writeFileSync(new URL("./edit.json", import.meta.url), JSON.stringify(props, null, 2));
console.log(`edit.json: ${cuts.length} cuts, ${overlays.length} overlays, ${t.toFixed(1)}s total`);
