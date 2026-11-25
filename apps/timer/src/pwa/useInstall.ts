import { useEffect, useState, useSyncExternalStore } from "react";
import { Preferences } from "@capacitor/preferences";
import { installGuide } from "./installGuide";
import { getInstallState, promptInstall, subscribe } from "./installStore";

const STORAGE_KEY = "installCardHidden";

/** What the app needs to invite the user to install it, and to remember that they declined. */
export function useInstall() {
  const { installed, canPrompt } = useSyncExternalStore(subscribe, getInstallState);
  // null until the choice has been read from storage, so that the card does not flash.
  const [hidden, setHidden] = useState<boolean | null>(null);

  useEffect(() => {
    let current = true;
    void Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
      if (current) setHidden(value === "true");
    });
    return () => {
      current = false;
    };
  }, []);

  return {
    /** False inside the installed app. */
    available: !installed,
    showCard: !installed && hidden === false,
    canPrompt,
    guide: installGuide(navigator),
    prompt: promptInstall,
    hideCard() {
      setHidden(true);
      void Preferences.set({ key: STORAGE_KEY, value: "true" });
    },
  };
}
