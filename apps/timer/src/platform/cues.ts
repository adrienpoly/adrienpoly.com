import { Haptics } from "@capacitor/haptics";

// Sound, voice and vibration cues of a session.

let audio: AudioContext | null = null;

/**
 * Browsers only allow sound that starts from a tap. Call this in the tap that
 * starts a session; the cues that follow are then allowed to play.
 */
export function unlockCues() {
  audio ??= new AudioContext();
  if (audio.state === "suspended") void audio.resume();

  // Same rule for speech on iOS: the first utterance must come from a tap.
  if ("speechSynthesis" in window) {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
  }
}

function beep(frequency: number, durationMs: number, delayMs = 0) {
  if (!audio) return;

  const start = audio.currentTime + delayMs / 1000;
  const end = start + durationMs / 1000;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  // A short fade in and out avoids clicks.
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.25, start + 0.01);
  gain.gain.setValueAtTime(0.25, end - 0.03);
  gain.gain.linearRampToValueAtTime(0, end);

  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(end);
}

/** One of the 3-2-1 beeps at the end of a phase. */
export function beepCountdown() {
  beep(880, 110);
}

/** The longer, higher beep that starts a phase. */
export function beepPhaseStart() {
  beep(1320, 420);
}

export function beepFinish() {
  beep(1320, 160);
  beep(1320, 160, 240);
  beep(1760, 520, 480);
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
