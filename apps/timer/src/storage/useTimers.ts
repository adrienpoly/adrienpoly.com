import { useEffect, useMemo, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { MESSAGES, type Language } from "../i18n/language";
import { localizeNames } from "../i18n/names";
import { createStarterTimers, type Timer } from "../model/timer";

// Capacitor Preferences stores the list in localStorage on the web and in
// native storage inside an iOS app, behind the same calls.
const STORAGE_KEY = "timers";

// Whatever language the starter timers are created in, their names are shown
// in the current one (see localizeNames).
const createStarters = () => createStarterTimers(MESSAGES.en.names);

async function loadTimers(): Promise<Timer[]> {
  const { value } = await Preferences.get({ key: STORAGE_KEY });
  if (value === null) return createStarters();

  try {
    const stored: unknown = JSON.parse(value);
    if (Array.isArray(stored)) return stored as Timer[];
  } catch {
    // Unreadable data: fall through to the starter list.
  }
  return createStarters();
}

/**
 * The saved timers, with the names the app gave shown in `language`.
 * `timers` is null until they have been read from storage.
 */
export function useTimers(language: Language) {
  const [timers, setTimers] = useState<Timer[] | null>(null);

  useEffect(() => {
    let current = true;
    void loadTimers().then((loaded) => {
      if (current) setTimers(loaded);
    });
    return () => {
      current = false;
    };
  }, []);

  function update(next: Timer[]) {
    setTimers(next);
    void Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(next) });
  }

  const localized = useMemo(
    () => timers?.map((timer) => localizeNames(timer, language)) ?? null,
    [timers, language],
  );

  return {
    timers: localized,
    /** Adds the timer, or replaces the one with the same id. */
    save(timer: Timer) {
      const list = timers ?? [];
      const exists = list.some((candidate) => candidate.id === timer.id);
      update(exists ? list.map((c) => (c.id === timer.id ? timer : c)) : [...list, timer]);
    },
    remove(id: string) {
      update((timers ?? []).filter((candidate) => candidate.id !== id));
    },
  };
}
