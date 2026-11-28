# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A pnpm workspace with two kinds of deployables:

- `site/` is adrienpoly.com: the home page and Markdown articles, built with Astro into static HTML with no client JavaScript.
- `apps/<name>/` are installable PWAs, each served from its own subdomain. The first is `apps/timer` (timer.adrienpoly.com), a sport interval timer in English and French.

The two sides share nothing but the workspace and the toolchain (Vite, TypeScript). Node 24 and pnpm 9 (see `.nvmrc` and `packageManager`).

## Commands

Run from the repo root:

```sh
pnpm install
pnpm dev            # site on http://localhost:4321 (drafts visible)
pnpm dev:timer      # timer app on http://localhost:5173
pnpm check          # astro check + tsc, all packages
pnpm test           # unit tests (timer app only, Vitest)
pnpm build          # production build of everything
```

One package: `pnpm --filter site build`, `pnpm --filter timer check`.
One test file or test name: `pnpm --filter timer exec vitest run src/model/session.test.ts -t "catches up"`.

`astro dev` detaches into the background when it is not run from a terminal; stop it with `pnpm --filter site exec astro dev stop`.

## Deployment

- **Site**: `.github/workflows/deploy-site.yml` builds `site/` and publishes it to GitHub Pages on every push to `master` that touches it. The Pages source must be "GitHub Actions". `site/public/CNAME` holds the domain.
- **Apps**: `.github/workflows/deploy-apps.yml` builds each app and runs `wrangler deploy` (Cloudflare Workers static assets). The subdomain is the `routes` entry in the app's `wrangler.jsonc`; DNS is on Cloudflare, so the record is created by the deploy. Needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.
- `ci.yml` runs check, test and build on pull requests and deploys nothing.

A push to `master` is a production deploy.

## Site (`site/`)

- `src/layouts/Base.astro` is the document shell: `<head>`, fonts (Geist and Geist Mono from jsdelivr) and the design tokens as CSS variables (`--accent`, `--bg`, `--text`…). `Page.astro` adds the header and footer for every page except the home page.
- **Home page** (`src/pages/index.astro`) is the original hand-written page ported as is, including its `v5-` class names and literal colors. It is a fixed, non-scrolling viewport on desktop (`overflow: hidden`, `100dvh`): content taller than the screen is cut off, so check a short window (about 700px tall) after adding anything. Below 760px wide it scrolls. The "Articles" link only renders when at least one article is published.
- **Articles** live in `src/content/articles/<slug>/index.md`, with their images in the same folder. The frontmatter schema is in `src/content.config.ts` (`title`, `description`, `pubDate`, optional `updatedDate`, `draft`). `src/lib/articles.ts` is the single place that lists articles: drafts are included in dev and excluded from production builds, which also keeps them out of the RSS feed and sitemap.
- Markdown extras, each a small plugin wired in `astro.config.mjs`:
  - ` ```ruby title="app/models/user.rb" ` puts a file name above a code block (`src/markdown/shiki-code-title.mjs`).
  - `![alt](./photo.jpg "Caption")` alone on a line becomes a figure with a caption.
  - In a blockquote, a last line starting with `—` is styled as the attribution.
  - Footnotes (`[^1]`), tables and task lists come with GFM.
- Astro 7 renders Markdown with **Sätteri**, not remark/rehype. Plugins are visitor objects (`src/markdown/hast-plugins.mjs`), not unified plugins; remark/rehype packages will not work.
- Astro's HTML minifier drops a line break between text and an inline element. Where a space matters, write `{" "}`.
- Article styles are in `src/styles/prose.css`, scoped under `.prose`. Links are light text with an accent underline because the accent red is too dark to read as text on the background.

To add an article: create the folder and `index.md`, write it with `draft: true`, check it with `pnpm dev`, then remove `draft`.

## Timer app (`apps/timer/`)

Stack: Vite + React + TypeScript, Ionic (forced to iOS mode) for modals, sheets, alerts, toasts and drag-to-reorder, `vite-plugin-pwa` for the manifest and service worker, and Capacitor plugin APIs for storage and haptics. The Capacitor APIs fall back to web implementations, so the same code runs as a PWA and can later be wrapped as a native iOS app (`capacitor.config.ts` is in place; no `ios/` project is generated yet).

The UI follows a design made as a Claude artifact ("Chrono sportif", hi-fi set A2): https://claude.ai/artifact/CDZuGPZVqFCM4uSaJLF2gU. Colors and sizes in the CSS are taken from it; `src/theme.css` holds the tokens.

- `src/model/timer.ts`: one data shape for every timer (prepare, then cycles × rounds × steps, rest between cycles, recovery). `buildPhases` flattens a timer into the list of phases a session runs through. Templates and the starter timers are here too. The model holds no text: names are passed in from the messages.
- `src/i18n/`: two typed dictionaries, no library. `en.ts` is the reference and defines the `Messages` type; `fr.ts` must match it, so a missing key fails the type check. Components read texts with `useMessages()`; `App.tsx` provides them. The language is the one chosen in the settings sheet (stored with Capacitor Preferences), or by default the first of the browser's languages that the app has, English otherwise (`language.ts`). The voice follows it (`speechLang`). To add a text, add it to both files; to add a language, add a file and list it in `MESSAGES` and `LANGUAGE_NAMES`.
- Timer and step names are stored as plain text. `src/i18n/names.ts` shows a name that equals one of the app's default names (`names` in the messages) in the current language, so that the voice never reads words of another language; names typed by the user are left alone. Default names must stay unique within a language (there is a test).
- `<IonApp>` must stay the root element of every render of `App.tsx`. Ionic's modals look up `<ion-app>` once, when they are created; if React replaces that element, sheets and modals silently stop opening.
- **Challenges**: a challenge is a `Timer` with a `challenge` field (its goal: the shortest or the longest time) and no steps. After the preparation a stopwatch counts up until the user stops it, and the time is kept as a result. `src/model/challenge.ts` holds the attempt clock, the record and the history (each result compared with the best one before it), as pure, unit-tested functions; times are whole seconds. Results are stored apart from the timers (`src/storage/useResults.ts`, Preferences key `results`, by timer id) so that saving a timer can never overwrite them; deleting a challenge deletes its results. Screens: `ChallengeSession` (built on the session screen's CSS), `ChallengeDoneScreen`, `ChallengeScreen` (the page of a challenge: record, chart, results; opened by tapping the name on the home list) and `ResultSheet` (add or correct a result). In `App.tsx` the page is a layer between the list and a session, held by `challengeId`. `src/components/ResultsChart.tsx` draws the chart and the curve on the home card without measuring the screen: the line is an SVG stretched to its box, the dots are elements placed in percent.
- **Circuits**: a circuit is a `Timer` with a `circuit` field and no steps: blocks that run one after the other between the preparation and the recovery, with a transition between two blocks (none next to a rest block). A block is `intervals` (steps × rounds × cycles, like a timer), `effort` (measured like a challenge: a stopwatch counts up until "Done" / "Let go", with an optional time limit) or `rest`. Blocks are copies: one made from a timer or a challenge (`blockFromTimer`) does not follow it. In `buildPhases` an effort is a phase of kind `effort` whose `seconds` is its limit or null; the engine never ends an open phase by itself, `finishEffort` keeps its time (`session.efforts`, by phase index), a skipped effort keeps none. Totals leave efforts out and count them apart (`effortCount`, "6:10 + 2 efforts"). Each effort has its own records, stored in `results` under its block id (not shared with any challenge: an effort after a Tabata does not compare with one done fresh); `src/model/circuit.ts` turns a finished session into results (a fast effort ended by its limit does not count) and finds the results to delete when a block or a circuit goes. Screens: the circuit part of `EditorScreen`, `BlockEditor` (one block, full screen over the editor), `AddBlockSheet`, the effort view of `SessionScreen` and `CircuitDoneScreen`. `IntervalsFields` is the steps/rounds/cycles editor shared by timers and intervals blocks. The mock-up is on the design canvas, row "Circuits".
- `src/model/session.ts`: the session engine, as pure functions. Time is always derived from the clock (`sync(session, now)`), never from counting ticks, so a session is still right after the app was suspended. Both model files are unit-tested; change them test-first.
- `src/screens/`: one file and one CSS file per screen. A timer is deleted by sliding its card to the left (`IonItemSliding`) or from the bottom of the editor. `App.tsx` decides which is shown; there is no router. The session screen is a CSS size container: its layout switches on the container's orientation and its sizes are in `cqw`/`cqh`, which is what lets one set of rules serve a rotated phone and the "rotate by hand" button.
- `src/components/Wheel.tsx`: the picker wheel is a native scrolling list with scroll snapping. The sheet that holds it is an anchored modal without Ionic's drag gesture, because that gesture would compete with the wheel's scrolling.
- A bottom sheet is as tall as its content (`--height: auto`), so content taller than the screen is cut off. A sheet that can outgrow a short screen (the templates) limits its own height, scrolls, and carries the class `ion-content-scroll-host`, which makes Ionic's drag gesture wait until the list is at its top. Check 320 × 568 after adding anything to a sheet.
- `src/platform/cues.ts`: sounds (Web Audio), voice (speech synthesis) and vibration. `src/platform/sounds.ts` is the catalogue: each sound of a session (countdown, start of a phase, end) has variants, written as lists of tones and synthesized, with no audio files. The user picks a variant per sound in the settings ("Sounds" sheet, stored with Preferences); to add a variant, add its name to `SOUND_VARIANTS`, its tones to each sound and its label to the messages. Sound and speech only work after `unlockCues()` has run inside a tap, so every path that starts a session goes through `start()` in `App.tsx`. On an iPhone, Silent Mode mutes both the beeps and the voice, and a web app cannot detect it (confirmed on a device): the first session shows a reminder once (`useSilentModeHint`) and the editor's options carry a note.
- `src/pwa/`: the service worker prompt and the invitation to install. Outside the installed app, the home screen shows a card and the settings sheet an entry. Where the browser has an install dialog (Chrome, Edge), the button opens it; elsewhere, or if the browser refuses, a sheet lists the steps for this device (`installGuide.ts`, unit-tested). `installStore.ts` listens for `beforeinstallprompt` when the module loads, because the event fires once and early. A website cannot open an installed PWA by itself: iOS never does it, Android and desktop Chrome/Edge do it on their own for links; `launch_handler` in the manifest only makes them reuse the open window.
- `src/storage/useTimers.ts`: timers are saved as JSON through Capacitor Preferences (localStorage on the web). The list is sorted by `usedAt`, most recent first (`sortByRecent`): `App.tsx` sets it when a timer is saved from the editor and `touch` when a session of it is completed (a stopped session does not count). Timers without it come last, in their saved order.
- Icons and the manifest's icon list are generated from `public/logo.svg` at build time (`pwa-assets.config.ts`). The manifest is static, so the installed name ("Sport Timer" / "Timer") is the same in every language.
- The app builds for the root of its subdomain. For a sub-path, pass the base: `pnpm --filter timer build --base=/timer/` (manifest and service worker scope follow).

Things that only a real iPhone can confirm: installation from Safari, sound with the ringer switch off, speech, the screen wake lock and behavior after the app has been in the background.

To add an app: copy `apps/timer` to `apps/<name>`, change the `name` in `package.json`, the worker name and route in `wrangler.jsonc`, the manifest in `vite.config.ts` and `capacitor.config.ts`, then add the folder name to the matrix in `deploy-apps.yml`.
