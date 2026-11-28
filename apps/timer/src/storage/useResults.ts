import { useCallback, useEffect, useRef, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { parseResults, type Result, type ResultsByTimer } from "../model/challenge";

// Results are kept apart from the timers, by timer id (for the efforts of a
// circuit, by block id): saving a timer from the editor can then never overwrite them.
const STORAGE_KEY = "results";

/** The results of the challenges and of the efforts of circuits, kept on the device. `results` is null until they have been read. */
export function useResults() {
  const [results, setResults] = useState<ResultsByTimer | null>(null);
  // The results as read from storage need not be written back.
  const loaded = useRef<ResultsByTimer | null>(null);

  useEffect(() => {
    let current = true;
    void Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
      if (!current) return;
      loaded.current = parseResults(value);
      setResults(loaded.current);
    });
    return () => {
      current = false;
    };
  }, []);

  // Every change is written once it is in the state. Changes are made on the
  // current state, so that several in a row (the efforts of a circuit) all count.
  useEffect(() => {
    if (results === null || results === loaded.current) return;
    void Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(results) });
  }, [results]);

  const update = useCallback((change: (current: ResultsByTimer) => ResultsByTimer) => {
    setResults((current) => (current === null ? current : change(current)));
  }, []);

  /** Adds each result, or replaces the one with the same id. */
  const saveAll = useCallback(
    (entries: Array<{ timerId: string; result: Result }>) =>
      update((current) => {
        const next = { ...current };
        for (const { timerId, result } of entries) {
          const list = next[timerId] ?? [];
          const exists = list.some((candidate) => candidate.id === result.id);
          next[timerId] = exists ? list.map((c) => (c.id === result.id ? result : c)) : [...list, result];
        }
        return next;
      }),
    [update],
  );

  return {
    results,
    saveAll,
    /** Adds the result, or replaces the one with the same id. */
    save: useCallback((timerId: string, result: Result) => saveAll([{ timerId, result }]), [saveAll]),
    remove: useCallback(
      (timerId: string, resultId: string) =>
        update((current) => ({
          ...current,
          [timerId]: (current[timerId] ?? []).filter((candidate) => candidate.id !== resultId),
        })),
      [update],
    ),
    /** Forgets every result of challenges (or efforts of circuits) that were deleted. */
    removeAll: useCallback(
      (...timerIds: string[]) =>
        update((current) => {
          if (!timerIds.some((id) => id in current)) return current;
          const next = { ...current };
          for (const id of timerIds) delete next[id];
          return next;
        }),
      [update],
    ),
  };
}
