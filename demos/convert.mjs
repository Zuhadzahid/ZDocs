// Converts every videos/*.webm into an .mp4 next to it with the static ffmpeg
// shipped by the ffmpeg-static dev dependency (Playwright's own ffmpeg can only
// write WebM), then removes the .webm and the raw recording folder.
import { execFileSync } from "node:child_process";
import { readdirSync, rmSync, statSync, unlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const VIDEOS = join(process.cwd(), "videos");

function findFfmpeg() {
  try {
    return createRequire(import.meta.url)("ffmpeg-static");
  } catch {
    return "ffmpeg"; // fall back to a system install
  }
}

const ffmpeg = findFfmpeg();
const files = readdirSync(VIDEOS).filter((f) => f.endsWith(".webm"));
if (files.length === 0) {
  console.log("No .webm files in videos/. Run the demos first.");
  process.exit(0);
}
for (const f of files) {
  const input = join(VIDEOS, f);
  const output = input.replace(/\.webm$/, ".mp4");
  execFileSync(ffmpeg, ["-y", "-loglevel", "error", "-i", input, "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", "30", output], { stdio: "inherit" });
  const kb = Math.round(statSync(output).size / 1024);
  unlinkSync(input);
  console.log(`${f.replace(/\.webm$/, ".mp4")}  ${kb} KB`);
}
rmSync(join(VIDEOS, ".raw"), { recursive: true, force: true });
