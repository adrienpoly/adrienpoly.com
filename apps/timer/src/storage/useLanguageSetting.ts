import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { LANGUAGES, type Language, type LanguageSetting } from "../i18n/language";

const STORAGE_KEY = "language";

/** The language chosen in the settings. `setting` is null until it has been read from storage. */
export function useLanguageSetting() {
  const [setting, setSetting] = useState<LanguageSetting | null>(null);

  useEffect(() => {
    let current = true;
    void Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
      if (!current) return;
      // Nothing stored, or a language the app no longer has: follow the browser.
      setSetting(LANGUAGES.includes(value as Language) ? (value as Language) : "auto");
    });
    return () => {
      current = false;
    };
  }, []);

  return {
    setting,
    choose(next: LanguageSetting) {
      setSetting(next);
      void (next === "auto"
        ? Preferences.remove({ key: STORAGE_KEY })
        : Preferences.set({ key: STORAGE_KEY, value: next }));
    },
  };
}
