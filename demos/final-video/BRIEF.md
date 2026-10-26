# ZDocs product video — production notes

Built with the OpenMontage Remotion composer (`Explainer` composition) from the twelve
Playwright demo clips in `videos/`.

- **Pipeline:** screen-demo (real capture). Stages collapsed into one pass because the
  footage already existed and no narration was wanted.
- **Runtime:** Remotion. HyperFrames is not installed on this machine, and ffmpeg-only
  concat could not provide the title overlays and music fades.
- **Delivery:** one horizontal 1920x1080 MP4 at 30 fps, about 2:20 so it fits X/Twitter's
  limit as well as YouTube. No voice-over, no slides; the clips' own caption bars carry the
  explanation, plus a small section label per feature and a hero open and close.
- **Music:** Kevin MacLeod, "Wallpaper" (incompetech.com), CC BY 4.0, from the
  Archive.org discography item. Attribution line for the video description:
  "Music: Wallpaper by Kevin MacLeod (incompetech.com), licensed under CC BY 4.0".
  Pixabay (OpenMontage's keyless music source) returned 403 and Wikimedia Commons was
  unreachable from this network, so Archive.org was used instead.
- **Prep:** the Next.js dev badge was removed from each clip with ffmpeg `delogo`; the
  portrait phone clip was placed on a blurred 16:9 background.

## Rebuild

1. Clone OpenMontage next to this repo and run `npm install` inside its `remotion-composer`.
2. Copy the processed clips from `videos/.montage/` and `music.mp3` into
   `remotion-composer/public/zdocs/`.
3. Apply the one composer change recorded in `composer.patch` (makes the video vignette optional).
4. `node demos/final-video/build-edit.mjs` to regenerate `edit.json`.
5. From `remotion-composer`:
   `npx remotion render src/index.tsx Explainer <out>/final-video.mp4 --props=<repo>/demos/final-video/edit.json --codec=h264 --crf=18`
