// The sounds of a session and their variants. All are synthesized: no audio files.

/** The moments of a session that have a sound. */
export const SOUND_EVENTS = ["countdown", "phaseStart", "finish"] as const;
export type SoundEvent = (typeof SOUND_EVENTS)[number];

export const SOUND_VARIANTS = ["classic", "soft", "bell", "arcade"] as const;
export type SoundVariant = (typeof SOUND_VARIANTS)[number];

/** One note. A sound is a list of them. */
export interface Tone {
  wave: OscillatorType;
  /** Hz. */
  frequency: number;
  /** When set, the pitch slides from `frequency` to this value over the tone. */
  glideTo?: number;
  durationMs: number;
  /** Start, counted from the start of the sound. */
  delayMs?: number;
  /** True for a note that rings out, like a bell, instead of holding its level. */
  rings?: boolean;
}

export const SOUNDS: Record<SoundEvent, Record<SoundVariant, Tone[]>> = {
  // One of the 3-2-1 beeps at the end of a phase.
  countdown: {
    classic: [{ wave: "square", frequency: 880, durationMs: 110 }],
    soft: [{ wave: "sine", frequency: 660, durationMs: 160 }],
    bell: [{ wave: "triangle", frequency: 1175, durationMs: 320, rings: true }],
    arcade: [{ wave: "sawtooth", frequency: 440, durationMs: 90 }],
  },
  // The longer, higher sound that starts a phase.
  phaseStart: {
    classic: [{ wave: "square", frequency: 1320, durationMs: 420 }],
    soft: [{ wave: "sine", frequency: 880, durationMs: 500 }],
    bell: [{ wave: "triangle", frequency: 1568, durationMs: 900, rings: true }],
    arcade: [{ wave: "square", frequency: 660, glideTo: 1320, durationMs: 320 }],
  },
  finish: {
    classic: [
      { wave: "square", frequency: 1320, durationMs: 160 },
      { wave: "square", frequency: 1320, durationMs: 160, delayMs: 240 },
      { wave: "square", frequency: 1760, durationMs: 520, delayMs: 480 },
    ],
    soft: [
      { wave: "sine", frequency: 660, durationMs: 220 },
      { wave: "sine", frequency: 880, durationMs: 220, delayMs: 260 },
      { wave: "sine", frequency: 1320, durationMs: 600, delayMs: 520 },
    ],
    bell: [
      { wave: "triangle", frequency: 1568, durationMs: 700, rings: true },
      { wave: "triangle", frequency: 1568, durationMs: 700, delayMs: 450, rings: true },
      { wave: "triangle", frequency: 2093, durationMs: 1400, delayMs: 900, rings: true },
    ],
    arcade: [
      { wave: "square", frequency: 523, durationMs: 110 },
      { wave: "square", frequency: 659, durationMs: 110, delayMs: 120 },
      { wave: "square", frequency: 784, durationMs: 110, delayMs: 240 },
      { wave: "square", frequency: 1047, durationMs: 420, delayMs: 360 },
    ],
  },
};

/** The variant chosen for each sound. */
export type SoundChoice = Record<SoundEvent, SoundVariant>;

export const DEFAULT_SOUND_CHOICE: SoundChoice = {
  countdown: "classic",
  phaseStart: "classic",
  finish: "classic",
};

/** Reads a stored choice. Anything missing or unknown becomes the default. */
export function parseSoundChoice(stored: string | null): SoundChoice {
  let values: Partial<Record<SoundEvent, unknown>> = {};
  try {
    values = (stored && JSON.parse(stored)) || {};
  } catch {
    // Not JSON: keep the defaults.
  }

  const choice = { ...DEFAULT_SOUND_CHOICE };
  for (const event of SOUND_EVENTS) {
    const variant = values[event] as SoundVariant;
    if (SOUND_VARIANTS.includes(variant)) choice[event] = variant;
  }
  return choice;
}
