/** What the checks below read from `navigator`. */
export interface Browser {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

/** True on an iPhone or an iPad, in any browser and in the installed app. */
export function isIos({ userAgent, platform, maxTouchPoints }: Browser): boolean {
  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    // iPadOS identifies as a Mac; touch support tells them apart.
    (platform === "MacIntel" && maxTouchPoints > 1)
  );
}
