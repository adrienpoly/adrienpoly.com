import { describe, expect, it } from "vitest";
import {
  DEFAULT_SOUND_CHOICE,
  parseSoundChoice,
  SOUND_EVENTS,
  SOUND_VARIANTS,
  SOUNDS,
} from "./sounds";

describe("SOUNDS", () => {
  it("has every variant of every sound, each with tones that can be played", () => {
    for (const event of SOUND_EVENTS) {
      for (const variant of SOUND_VARIANTS) {
        const tones = SOUNDS[event][variant];
        expect(tones.length, `${event}/${variant}`).toBeGreaterThan(0);
        for (const tone of tones) {
          expect(tone.frequency).toBeGreaterThan(0);
          // The fade in and out need room inside the tone.
          expect(tone.durationMs).toBeGreaterThanOrEqual(60);
          expect(tone.delayMs ?? 0).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("keeps the countdown shorter than the second it marks", () => {
    for (const variant of SOUND_VARIANTS) {
      for (const tone of SOUNDS.countdown[variant]) {
        expect((tone.delayMs ?? 0) + tone.durationMs).toBeLessThan(1000);
      }
    }
  });
});

describe("parseSoundChoice", () => {
  it("gives the defaults when nothing is stored", () => {
    expect(parseSoundChoice(null)).toEqual(DEFAULT_SOUND_CHOICE);
  });

  it("reads a stored choice", () => {
    const stored = JSON.stringify({ countdown: "soft", phaseStart: "bell", finish: "arcade" });
    expect(parseSoundChoice(stored)).toEqual({ countdown: "soft", phaseStart: "bell", finish: "arcade" });
  });

  it("falls back to the default for a missing sound or a variant the app no longer has", () => {
    const stored = JSON.stringify({ countdown: "gong", finish: "soft" });
    expect(parseSoundChoice(stored)).toEqual({ ...DEFAULT_SOUND_CHOICE, finish: "soft" });
  });

  it("gives the defaults for text that is not a choice", () => {
    expect(parseSoundChoice("not json")).toEqual(DEFAULT_SOUND_CHOICE);
    expect(parseSoundChoice("null")).toEqual(DEFAULT_SOUND_CHOICE);
  });
});
