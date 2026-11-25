/** Which set of install steps to show: the way in differs with the device and the browser. */
export type InstallGuide = "ios" | "macSafari" | "android" | "desktop";

export interface Browser {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

export function installGuide({ userAgent, platform, maxTouchPoints }: Browser): InstallGuide {
  const isIos =
    /iPad|iPhone|iPod/.test(userAgent) ||
    // iPadOS identifies as a Mac; touch support tells them apart.
    (platform === "MacIntel" && maxTouchPoints > 1);
  if (isIos) return "ios";

  if (/Android/.test(userAgent)) return "android";

  // Chrome, Edge and Opera on a Mac also say "Safari", next to their own name.
  const isMacSafari =
    /Macintosh/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome|Chromium|Edg|OPR/.test(userAgent);
  return isMacSafari ? "macSafari" : "desktop";
}
