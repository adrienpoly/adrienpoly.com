# Lessons

## 2026-11-24 — A screenshot check that could not see the thing it was checking

- Failure mode: I compared "390px wide" screenshots of the home page and called the mobile layout verified. Headless Chrome clamps the window to about 500px, so both shots were a wider layout cropped to 390.
- Detection signal: on a new page, text was cut off at the right edge of the "mobile" screenshot although the CSS had no overflow.
- Prevention rule: before trusting a visual check, confirm the tool renders the size asked for (for example, look for clipped content or log `innerWidth`). For phone widths, render through an iframe of the exact size.

## 2026-11-24 — Porting HTML into Astro changed whitespace

- Failure mode: moving `index.html` into an `.astro` file removed the space between a text node and the `<span>` on the next line, joining two words.
- Detection signal: pixel comparison against the baseline showed a shifted line of text.
- Prevention rule: when porting markup into a framework that minifies HTML, compare rendered output against a baseline, and write significant spaces explicitly (`{" "}`).

## Changing the root of the React tree broke every Ionic modal (2026-11-25)

- **Failure mode**: I wrapped `<IonApp>` in a context provider in the loaded render only, while the loading render still returned a bare `<IonApp />`. React replaced the `<ion-app>` element. Ionic React's modals read `document.querySelector("ion-app")` in their constructor, during that same render, so they attached to the element that was about to be removed. Every sheet and modal stopped opening.
- **Detection signal**: no error anywhere. Type check, unit tests and build all passed. Only the browser walk showed it: a click on a button that opens a sheet did nothing.
- **Prevention rule**: keep `<IonApp>` as the root element of every render (providers go inside it). After any change to the structure of `App.tsx`, open at least one sheet in a browser before calling it done; the automated checks cannot see this.

## A known platform limit shipped without a word to the user (2026-11-25)

- **Failure mode**: `CLAUDE.md` already listed "sound with the ringer switch off" as something only an iPhone could confirm. The app shipped without telling the user anything about it. The first test on a phone in Silent Mode looked like broken sound. I then asked "are you in silent mode?" without saying where to look: the user checked the Control Center, which does not show it, and answered no.
- **Detection signal**: on the device, the simplest possible case (one phrase spoken from a tap) was silent too, and only the variants that bypass Silent Mode made a sound.
- **Prevention rule**: when a platform can silently disable a feature and the app cannot detect it, ship a visible hint with the feature. When asking a user to check a device setting, say exactly where it is. For a bug I cannot reproduce, build a page of isolated variants for the user to run before changing the code.
