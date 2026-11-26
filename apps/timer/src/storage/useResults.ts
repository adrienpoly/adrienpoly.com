import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { parseResults, type Result, type ResultsByTimer } from "../model/challenge";

// Results are kept apart from the timers, by timer id: saving a timer from the
// editor can then never overwrite them.
const STORAGE_KEY = "results";

/** The results of the challenges, kept on the device. `results` is null until they have been read. */
export function useResults() {
  const [results, setResults] = useState<ResultsByTimer | null>(null);

  useEffect(() => {
    let current = true;
    void Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
      if (current) setResults(parseResults(value));
    });
    return () => {
      current = false;
    };
  }, []);

  function update(next: ResultsByTimer) {
    setResults(next);
    void Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(next) });
  }

  return {
    results,
    /** Adds the result, or replaces the one with the same id. */
    save(timerId: string, result: Result) {
      const list = results?.[timerId] ?? [];
      const exists = list.some((candidate) => candidate.id === result.id);
      update({
        ...results,
        [timerId]: exists ? list.map((c) => (c.id === result.id ? result : c)) : [...list, result],
      });
    },
    remove(timerId: string, resultId: string) {
      const list = results?.[timerId] ?? [];
      update({ ...results, [timerId]: list.filter((candidate) => candidate.id !== resultId) });
    },
    /** Forgets every result of a challenge that was deleted. */
    removeAll(timerId: string) {
      const { [timerId]: _removed, ...rest } = results ?? {};
      update(rest);
    },
  };
}
