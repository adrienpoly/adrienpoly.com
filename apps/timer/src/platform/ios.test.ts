import { describe, expect, it } from "vitest";
import { isIos } from "./ios";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1";
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36";

describe("isIos", () => {
  it("is true on an iPhone", () => {
    expect(isIos({ userAgent: IPHONE, platform: "iPhone", maxTouchPoints: 5 })).toBe(true);
  });

  it("is true on an iPad, which identifies as a Mac with a touch screen", () => {
    expect(isIos({ userAgent: MAC, platform: "MacIntel", maxTouchPoints: 5 })).toBe(true);
  });

  it("is false on a Mac and on Android", () => {
    expect(isIos({ userAgent: MAC, platform: "MacIntel", maxTouchPoints: 0 })).toBe(false);
    expect(isIos({ userAgent: ANDROID, platform: "Linux armv81", maxTouchPoints: 5 })).toBe(false);
  });
});
