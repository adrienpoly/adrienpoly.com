import { Haptics } from "@capacitor/haptics";
import type { Tone } from "./sounds";

// Sound, voice and vibration cues of a session.

let audio: AudioContext | null = null;

/**
 * Browsers only allow sound that starts from a tap. Call this in the tap that
 * plays a sound, or that starts something which will.
 */
export function unlockAudio() {
  audio ??= new AudioContext();
  if (audio.state === "suspended") void audio.resume();
}

/**
 * Call this in the tap that starts a session; the cues that follow are then
 * allowed to play.
 */
export function unlockCues() {
  unlockAudio();

  // Same rule for speech on iOS: the first utterance must come from a tap.
  if ("speechSynthesis" in window) {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
  }
}

/** Loudness of each wave shape, set so that the variants sound about as loud as each other. */
const LEVELS: Record<OscillatorType, number> = {
  square: 0.25,
  sawtooth: 0.25,
  sine: 0.5,
  triangle: 0.5,
  custom: 0.25,
};

/** Schedules the tones on the given context. Exported so that a sound can be rendered and checked. */
export function scheduleTones(context: BaseAudioContext, tones: readonly Tone[]) {
  for (const tone of tones) {
    const start = context.currentTime + (tone.delayMs ?? 0) / 1000;
    const end = start + tone.durationMs / 1000;
    const level = LEVELS[tone.wave];
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = tone.wave;
    oscillator.frequency.setValueAtTime(tone.frequency, start);
    if (tone.glideTo) oscillator.frequency.exponentialRampToValueAtTime(tone.glideTo, end);

    // A short fade in and out avoids clicks.
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + 0.01);
    if (tone.rings) {
      gain.gain.exponentialRampToValueAtTime(0.001, end);
    } else {
      gain.gain.setValueAtTime(level, end - 0.03);
      gain.gain.linearRampToValueAtTime(0, end);
    }

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end);
  }
}

/** Plays a sound from the catalogue (`SOUNDS[event][variant]`). Silent until `unlockAudio` has run. */
export function playSound(tones: readonly Tone[]) {
  if (audio) scheduleTones(audio, tones);
}

/** Speaks the text with a voice of the given language ("en-US", "fr-FR"). */
export function say(text: string, lang: string) {
  if (!("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/**
 * Vibrates through Capacitor: a real haptic inside a native app, the Vibration
 * API on the web. Safari on iOS has no Vibration API, so there it does nothing.
 */
export function vibrate() {
  void Haptics.vibrate({ duration: 300 }).catch(() => {});
}
