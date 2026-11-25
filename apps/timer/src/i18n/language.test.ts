import { describe, expect, it } from "vitest";
import { detectLanguage, resolveLanguage } from "./language";

describe("detectLanguage", () => {
  it("is French when the browser prefers French", () => {
    expect(detectLanguage(["fr-FR", "en-US"])).toBe("fr");
    expect(detectLanguage(["fr"])).toBe("fr");
    expect(detectLanguage(["FR-ca"])).toBe("fr");
  });

  it("is English when the browser prefers English", () => {
    expect(detectLanguage(["en-GB", "fr-FR"])).toBe("en");
  });

  it("takes the first language the app has", () => {
    expect(detectLanguage(["de-DE", "fr-FR", "en-US"])).toBe("fr");
  });

  it("falls back to English", () => {
    expect(detectLanguage(["de-DE", "es"])).toBe("en");
    expect(detectLanguage([])).toBe("en");
  });
});

describe("resolveLanguage", () => {
  it("follows the browser on automatic and the choice otherwise", () => {
    expect(resolveLanguage("auto", ["fr-FR"])).toBe("fr");
    expect(resolveLanguage("en", ["fr-FR"])).toBe("en");
    expect(resolveLanguage("fr", ["en-US"])).toBe("fr");
  });
});
