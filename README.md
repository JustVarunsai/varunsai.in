# VarunSai.in

Varun Sai’s personal portfolio. An intentionally light, editorial site made with plain HTML, CSS, and JavaScript. No package install, build step, backend, or API keys are required.

## Preview

```sh
python3 -m http.server 4173
```

Open http://localhost:4173. Leave the server running while editing; refresh to see changes.

## Site map

- `index.html`: introduction, interactive workbench, notes, photo roll, Spotify, and contact
- `notes/index.html`: three short product and interaction principles
- `builds/index.html`: directory of the site’s own interactive experiments
- `newsletter/index.html`: legacy route kept alive; points visitors to the notebook, no subscription service connected
- `debug/index.html`: implementation notes for this edition
- `404.html`: error page with root-relative assets and navigation
- `styles.css` / `script.js`: shared design and interactions
- `assets/gallery/`: the five original personal photographs from the live site

## Interactive details

**System brief builder:** three workflow templates (find an answer, sort an inbox, read a document). Template, step, and human-review controls update the explanation, and the visitor's audience, goal, and constraint fields feed a live preview. Copy and download both emit exactly the previewed text, so the copied brief can never disagree with the visible one. Clipboard failure falls back to the text download. There is no backend and no model call; the text stays in the tab and clears on reload.

**Pip:** an original SVG page companion inspired by [Ryan Stephen’s lil-agents](https://github.com/ryanstephen/lil-agents). Scroll position drives a back-and-forth walking target inside a dedicated bottom strip, clear of the reading area. Animation stops at rest, on hover/focus, with an open guide, and in background tabs. Reduced-motion preferences keep Pip still. Optional pause/hide preferences use guarded localStorage access. The guide provides navigation, not AI-generated chat. Native lil-agents code and character media are not copied or bundled.

**Photos:** horizontal photo roll on mobile with a count and previous/next controls; native modal viewer with previous/next controls, arrow keys, Escape, touch swipes, and focus restoration.

**Music:** preserves the live site’s Spotify track `0HE9a9ndSFMCELuobaW5yK`. The iframe loads only when opened. Spotify controls playback; closing unmounts it and stops playback. There is a direct Spotify fallback link.

## Checks

With Python Playwright and its Chromium browser installed, start the local server and run:

```sh
python3 scripts/check_site.py
```

Checks cover all six routes and local assets/anchors, five viewport widths, scenario controls, copy/download, gallery keyboard behavior, player lifecycle, companion preferences, reduced motion, unavailable storage, and content without JavaScript. Screenshots default to `/private/tmp/varunsai-review`; override with `PORTFOLIO_SCREENSHOTS`. Override the preview URL with `PORTFOLIO_URL`.

## Hosting

`varunsai.in` is served by Vercel from the `varunsai.in` project, which auto-deploys on every push to `main`. There is no build step: Vercel publishes the repository root as static files. DNS points the apex at Vercel (`76.76.21.21`) and `www` at `cname.vercel-dns.com`.

GitHub Pages is still enabled on this repository as a legacy secondary host at `varunsai.me/varunsai.in/`. It is not the live site, and because every path here is root-relative it is not expected to work from that subpath.

Google Fonts loads the typography; system fallback fonts are defined. Spotify is the only third-party interactive embed and loads on demand. No analytics or tracking code is included by this site.
