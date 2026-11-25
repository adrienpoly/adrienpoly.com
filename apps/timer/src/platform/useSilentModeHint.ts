import { useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { isIos } from "./ios";

const STORAGE_KEY = "silentModeHintShown";

/**
 * On an iPhone, Silent Mode mutes the beeps and the voice, and a web app has
 * no way to know that it is on. So the first session on this device comes with
 * a reminder; `showOnce` does nothing after that.
 */
export function useSilentModeHint() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    close: () => setIsOpen(false),
    showOnce() {
      if (!isIos(navigator)) return;
      void Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
        if (value) return;
        setIsOpen(true);
        void Preferences.set({ key: STORAGE_KEY, value: "true" });
      });
    },
  };
}
