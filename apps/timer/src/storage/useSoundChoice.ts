import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import {
  DEFAULT_SOUND_CHOICE,
  parseSoundChoice,
  type SoundChoice,
  type SoundEvent,
  type SoundVariant,
} from "../platform/sounds";

const STORAGE_KEY = "sounds";

/** The variant chosen for each sound, kept on the device. The defaults apply until it has been read. */
export function useSoundChoice() {
  const [sounds, setSounds] = useState<SoundChoice>(DEFAULT_SOUND_CHOICE);

  useEffect(() => {
    let current = true;
    void Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
      if (current) setSounds(parseSoundChoice(value));
    });
    return () => {
      current = false;
    };
  }, []);

  return {
    sounds,
    choose(event: SoundEvent, variant: SoundVariant) {
      const next = { ...sounds, [event]: variant };
      setSounds(next);
      void Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(next) });
    },
  };
}
