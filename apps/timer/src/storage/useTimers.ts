import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { MESSAGES, type Language } from "../i18n/language";
import { localizeNames } from "../i18n/names";
import { createStarterTimers, sortByRecent, type Timer } from "../model/timer";

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
 * The saved timers, the most recently created, changed or completed first,
 * with the names the app gave shown in `language`.
 * `timers` is null until they have been read from storage.
 */
export function useTimers(language: Language) {
  const [timers, setTimers] = useState<Timer[] | null>(null);
  // The timers as read from storage need not be written back.
  const loaded = useRef<Timer[] | null>(null);

  useEffect(() => {
    let current = true;
    void loadTimers().then((list) => {
      if (!current) return;
      loaded.current = list;
      setTimers(list);
    });
    return () => {
      current = false;
    };
  }, []);

  // Every change is written once it is in the state. Changes are made on the
  // current state, so the actions below never work on a stale list.
  useEffect(() => {
    if (timers === null || timers === loaded.current) return;
    void Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(timers) });
  }, [timers]);

  const update = useCallback((change: (current: Timer[]) => Timer[]) => {
    setTimers((current) => (current === null ? current : change(current)));
  }, []);

  const localized = useMemo(
    () => (timers && sortByRecent(timers).map((timer) => localizeNames(timer, language))) ?? null,
    [timers, language],
  );

  return {
    timers: localized,
    /** Adds the timer, or replaces the one with the same id. */
    save: useCallback(
      (timer: Timer) =>
        update((list) =>
          list.some((candidate) => candidate.id === timer.id)
            ? list.map((candidate) => (candidate.id === timer.id ? timer : candidate))
            : [...list, timer],
        ),
      [update],
    ),
    /** Marks the timer as used at `at` (a session of it was completed), which brings it to the top. */
    touch: useCallback(
      (id: string, at: number) =>
        update((list) => list.map((candidate) => (candidate.id === id ? { ...candidate, usedAt: at } : candidate))),
      [update],
    ),
    remove: useCallback(
      (id: string) => update((list) => list.filter((candidate) => candidate.id !== id)),
      [update],
    ),
  };
}
