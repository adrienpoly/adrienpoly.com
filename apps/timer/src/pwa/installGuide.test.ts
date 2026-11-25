import { describe, expect, it } from "vitest";
import { installGuide } from "./installGuide";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0.0.0 Mobile/15E148 Safari/604.1";
const MAC_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15";
const MAC_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";
const MAC_FIREFOX = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36";
const ANDROID_FIREFOX = "Mozilla/5.0 (Android 16; Mobile; rv:145.0) Gecko/145.0 Firefox/145.0";
const WINDOWS_EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0";

const browser = (userAgent: string, platform = "", maxTouchPoints = 0) => ({
  userAgent,
  platform,
  maxTouchPoints,
});

describe("installGuide", () => {
  it("gives the iOS steps on an iPhone, whatever the browser", () => {
    expect(installGuide(browser(IPHONE_SAFARI, "iPhone", 5))).toBe("ios");
    expect(installGuide(browser(IPHONE_CHROME, "iPhone", 5))).toBe("ios");
  });

  it("gives the iOS steps on an iPad, which identifies as a Mac with a touch screen", () => {
    expect(installGuide(browser(MAC_SAFARI, "MacIntel", 5))).toBe("ios");
  });

  it("gives the Safari steps on a Mac", () => {
    expect(installGuide(browser(MAC_SAFARI, "MacIntel", 0))).toBe("macSafari");
  });

  it("gives the desktop steps for other browsers on a Mac", () => {
    expect(installGuide(browser(MAC_CHROME, "MacIntel", 0))).toBe("desktop");
    expect(installGuide(browser(MAC_FIREFOX, "MacIntel", 0))).toBe("desktop");
  });

  it("gives the Android steps on Android", () => {
    expect(installGuide(browser(ANDROID_CHROME, "Linux armv81", 5))).toBe("android");
    expect(installGuide(browser(ANDROID_FIREFOX, "Linux armv81", 5))).toBe("android");
  });

  it("gives the desktop steps on Windows", () => {
    expect(installGuide(browser(WINDOWS_EDGE, "Win32", 0))).toBe("desktop");
  });
});
