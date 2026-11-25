import { isIos, type Browser } from "../platform/ios";

/** Which set of install steps to show: the way in differs with the device and the browser. */
export type InstallGuide = "ios" | "macSafari" | "android" | "desktop";

export function installGuide(browser: Browser): InstallGuide {
  if (isIos(browser)) return "ios";

  const { userAgent } = browser;
  if (/Android/.test(userAgent)) return "android";

  // Chrome, Edge and Opera on a Mac also say "Safari", next to their own name.
  const isMacSafari =
    /Macintosh/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome|Chromium|Edg|OPR/.test(userAgent);
  return isMacSafari ? "macSafari" : "desktop";
}
