# Astro site with articles + installable PWAs

Full plan: `~/.claude/plans/delightful-puzzling-horizon.md`. Branch: `feat/astro-site-and-pwa`.

## Acceptance criteria

- Home page looks the same as the old `index.html` at desktop and mobile sizes.
- Articles are Markdown files with code blocks, quotes with attribution, footnotes and co-located images.
- Draft articles show in dev and are absent from the production build; the home "Articles" link only shows when a published article exists.
- `apps/timer` is an installable PWA (valid manifest, service worker, works offline) that builds for both `/` and `/timer/`.
- `pnpm -r build`, `astro check` and `tsc --noEmit` pass.
- Nothing reaches `master` or production without an explicit go-ahead.

## Checklist

- [x] 1. Workspace + home page parity
  - [x] Scaffold pnpm workspace and `site/` (Astro)
  - [x] Port `index.html` → `site/src/pages/index.astro`, move `assets/` and `CNAME`
  - [x] Verify: build, `astro check`, screenshot parity (1440×900, 1280×700, 390 wide): 0 differing pixels
- [x] 2. Articles
  - [x] Content collection + schema, list page, article page, RSS, sitemap
  - [x] Prose styles (code, blockquote + attribution, footnotes, figures, tables)
  - [x] Three fake draft articles
  - [x] Verify: drafts absent from prod build, features render at desktop + mobile, bad frontmatter fails the check
- [x] 3. Timer PWA (`apps/timer`) — scope changed on 2026-11-24: build the real app from the design, not a dummy
  - Design: https://claude.ai/artifact/CDZuGPZVqFCM4uSaJLF2gU ("Chrono sportif", hi-fi set A2 "Néon nuit", French UI)
  - [x] Toolchain: Vite + React + Ionic + vite-plugin-pwa + capacitor.config.ts builds, manifest + icons + service worker generated
  - [x] Model + unit tests: timer definition → phases, totals, summary; session engine (clock-based, pause, skip, previous)
  - [x] Screens: timers list, templates sheet, editor, duration sheet, session (portrait + landscape), done
  - [x] Cues: 3-2-1 beeps, voice, vibration, wake lock (written; not verifiable without a device)
  - [x] Verify: tests, typecheck, build, each screen against the design at 390×844 and 844×390, offline reload, `/timer/` sub-path build
- [ ] 4. CI and cut-over (each step needs a go-ahead)
  - [x] Workflows: `ci.yml`, `deploy-site.yml`, `deploy-apps.yml`; `apps/timer/wrangler.jsonc` (checked with `wrangler deploy --dry-run`)
  - [ ] a. Commit + push branch
  - [ ] b. Switch GitHub Pages source to GitHub Actions
  - [ ] c. Merge to `master`, verify live site
  - [ ] d. Cloudflare secrets added, app deployed to `timer.adrienpoly.com`
  - [ ] e. Install on a real iPhone (user)
- [x] 5. Wrap-up: rewrite `CLAUDE.md`, fill in Results below

## Working notes

- Production today: GitHub Pages, legacy build from `master` root, DNS on Cloudflare (proxied). A push to `master` without a root `index.html` breaks the live site while the legacy build is on.
- Versions checked on 2026-11-24: astro 7.4, vite 8.3, react 19.3, @ionic/react 9.0, vite-plugin-pwa 2.0, @capacitor/core 8.6, wrangler 4.168. Node 24, pnpm 9.15.
- Favicon URLs must stay at `/assets/...`.
- Astro 7 renders Markdown with Sätteri, not remark/rehype. Plugins are visitor objects (`site/src/markdown/hast-plugins.mjs`).
- Astro's HTML minifier drops a newline between text and an inline element: use `{" "}` where the space matters.
- Headless Chrome will not render narrower than ~500px. For phone widths, screenshot through an iframe of the exact size.
- `astro dev` detaches by itself when not run in a terminal; stop it with `astro dev stop`.
- `@astrojs/check` needs TypeScript < 7.
- Timer design has no screen for: the Rapide / Historique / Réglages tabs, "Démarrage rapide", the list's "Modifier" mode, count pickers (rounds, cycles), deleting a step. Left out or decided minimally; listed in Results.

## Results

What changed (branch `feat/astro-site-and-pwa`, nothing committed or deployed):

- Repo is a pnpm workspace: `site/` (Astro) and `apps/timer/` (Vite + React + Ionic PWA).
- Home page ported to `site/src/pages/index.astro`; old `index.html`, `assets/`, `CNAME` moved under `site/`.
- Articles: content collection, list and article pages, RSS, sitemap, three draft placeholders.
- Timer: the seven designed screens, working end to end, with 17 unit tests on the timing logic.
- CI and deploy workflows, Cloudflare config, `CLAUDE.md` rewritten.

How it was verified:

- `pnpm check`, `pnpm test` (17 passed), `pnpm build`, `wrangler deploy --dry-run`: all pass.
- Home page: pixel comparison with the original at 1440×900, 1280×700 and a true 390×844: 0 differing pixels.
- Articles: production build has no drafts and no home link; publishing one adds the page, the home link, the RSS item and the sitemap entry, and converts the JPEG to WebP; an invalid date fails check and build; pages reviewed at 1440 and 390 wide.
- Timer, driven in headless Chrome at 390×844: create from a template, edit durations and counts, add / rename a step, save, delete, reload (changes persist), run a session, pause, skip, landscape (844×390 and the rotate button), finish, restart flow back to the list; service worker active; reload works offline, at `/` and at `/timer/`; no console errors.

Not verified (needs a device or a decision):

- On an iPhone: install, sound, voice, vibration, wake lock, behavior after backgrounding, safe areas, wheel feel.
- Drag-to-reorder of steps (touch gesture) and the layout for times of 10:00 and more were not exercised.

Open points for the timer (no screen in the design, so left out or decided minimally):

- Tab bar (Rapide, Historique, Réglages) and "Démarrage rapide": left out.
- "Modifier" on the list: toggles delete buttons (with confirmation). No reordering of timers.
- Rounds / Cycles: same sheet as durations, with one wheel and ×N shortcuts.
- Steps can be deleted from their sheet ("Supprimer l'étape") when a round has more than one.
- Added steps are effort steps; only "Repos" is a rest step.
- Seconds move in steps of 5, as drawn.
- First launch starts with the four timers shown in the design.
- App name: "Chrono sportif" (home screen: "Chrono").

Follow-ups:

- JS bundle is 1.36 MB (304 kB gzipped), mostly Ionic. Fine for a precached app; could be reduced by importing fewer Ionic components.
- iOS splash screens are not generated.
- Site fonts still load from jsdelivr; self-hosting them would remove the third-party request.
- No 404 page on the site.

---

# Timer: language (English / French) and settings — 2026-11-25

Request: announcements (text to speech) and all texts follow a language. Default is the browser's language; it can be changed in a settings screen. English and French, each with its own voice.

## Acceptance criteria

- With no saved choice, the app is in French when the browser prefers French, in English otherwise.
- A settings screen (opened from the timers list) offers Automatic / English / Français; the choice is saved and survives a reload.
- Every text on every screen, the date on the end screen and the spoken announcements follow the language (`en-US` / `fr-FR` voice).
- Names the app gave by itself (starter timers, template names, "Work" / "Rest" steps) follow the language; names the user typed are left alone.
- `pnpm check`, `pnpm test`, `pnpm build` pass.

## Checklist

- [x] Tests first: `detectLanguage`, `localizeNames`, model tests adapted to names passed in
- [x] `src/i18n/`: `en.ts` (source of the `Messages` type), `fr.ts`, language detection, name localization, context
- [x] Model: no text left in `timer.ts` (phase names, default names, templates and colors take their text from the messages)
- [x] Screens, PWA prompts and cues read their text from the messages; `say` takes the voice language
- [x] Settings sheet + gear button on the timers list; choice stored with Capacitor Preferences
- [x] Static shell (`index.html`, manifest) in English, `<html lang>` and title set at runtime
- [x] Deleting a timer (asked on 2026-11-25 while this was in progress): slide a card to the left on the list, and "Delete timer" at the bottom of the editor
- [x] Verify: check, test, build; drive both languages in headless Chrome
- [x] Update `CLAUDE.md` and Results

## Working notes

- No i18n dependency: two typed dictionaries. `fr` is typed as `typeof en`, so a missing or extra key fails the type check.
- Step and timer names are stored data. To keep the voice in the right language, a name that equals one of the app's default names (in any language) is shown in the current language; anything else is untouched. Done when reading the list, not by rewriting storage.
- The web manifest is static, so the installed app name cannot follow the language.
- Ionic React modals capture `<ion-app>` when they are constructed. Wrapping `<IonApp>` in a provider only in the loaded render made React replace the element, and every sheet stopped opening with no error. `<IonApp>` stays the root in every render.
- `IonItemSliding` only moves an `ion-item`, so each card's content sits in one, with its padding moved to an inner div (the item's inner box clips shadows).

## Results

What changed (all in `apps/timer`, nothing committed):

- `src/i18n/`: English and French messages, language detection, localization of default names, `useMessages`.
- `src/storage/useLanguageSetting.ts`, `src/screens/SettingsSheet.tsx` (+ CSS) and a gear button on the list.
- `src/model/timer.ts` no longer contains text; `buildPhases`, `summarize`, `createStep`, `TEMPLATES` and `createStarterTimers` take names as arguments.
- Every screen, `InstallHint`, `UpdatePrompt` and `say` use the messages. `index.html`, the manifest and `capacitor.config.ts` are in English ("Sport Timer" / "Timer").
- Delete: `IonItemSliding` on the list cards, "Delete timer" in the editor (only for a timer that is already saved). The "Edit" button of the list still works.

How it was verified:

- `pnpm check` (0 errors), `pnpm test` (26 passed, 9 new), `pnpm build`.
- Headless Chrome at 390×844, dev server and production build: browser in French → French; browser in German → English; choose Français in settings → French, kept after reload; back to Automatic → English; starter timer and step names follow each switch; session speaks with `en-US` ("Prepare", "Work", "Last round. Work", "Finished"), checked by intercepting `speechSynthesis.speak`; end screen date in the locale; templates and editor in both languages; no console errors.
- Delete: touch swipe opens the card by 92px; cancel closes it and deletes nothing; confirm deletes; delete from the editor closes the editor; both survive a reload; a new unsaved timer shows no delete button.

Not verified:

- The real voices on an iPhone (which voice iOS picks for `en-US` and `fr-FR`), and the feel of the swipe on a touch screen.

Decisions to confirm:

- The installed app name is now "Sport Timer" / "Timer" (it cannot follow the language). It was "Chrono sportif" / "Chrono".
- English wording, in particular "Prepare", "Work", "Rest", "Cool down" (shown large and spoken).
- A name is translated only if it is exactly one of the app's default names; a timer renamed by the user keeps its name in every language.

### Follow-up, 2026-11-25: step name editable in place

- The step sheet no longer has a "Rename" button and alert. The name is a text field in the heading, like the timer name in the editor. It is saved with the duration on "Confirm" (`onConfirm(value, title)`), an empty name keeps the previous one, and closing the sheet without confirming changes nothing.
- Verified: check, 26 tests, build; in headless Chrome: rename + new duration in one confirm, empty name, dismiss without confirming, fixed rows (Prepare, counts) keep a plain heading, a new step opens with its default name in the field; no console errors.
- Not verified: how the iOS keyboard moves the sheet when the field is focused (needs a device).

### Follow-up, 2026-11-25: "Edit" button removed from the list

- Asked by the user. The header keeps the settings and "+" buttons, on the right. Deleting is by sliding a card or from the editor.

### Follow-up, 2026-11-25: home screen header

- Asked by the user: title on one line, subtitle removed, settings button kept at the top, "+" moved to the bottom right as a floating button (`slot="fixed"` in `IonContent`).
- The title is 60px where it fits and shrinks with the screen (`min(60px, 14vw)`). The empty-list message is kept, shown only when there is no timer.
- Verified: check, 26 tests, build; in headless Chrome the title is on one line at 320, 390 and 430 wide in both languages, the last card scrolls clear of the button, the button opens the templates, no console errors.
