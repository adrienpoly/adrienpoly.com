import type { DefaultNames, Timer } from "../model/timer";
import { LANGUAGES, MESSAGES, type Language } from "./language";

// Timer and step names are stored as plain text, including the ones the app
// gave by itself ("Work", "Rest", "Classic Tabata"…). Those must follow the
// language, or a French voice would read English words. So a name that is one
// of the app's default names, in any language, is shown as the same default
// name in the current language. A name typed by the user never matches and is
// left alone.

function translate(name: string, language: Language): string {
  for (const source of LANGUAGES) {
    const names = MESSAGES[source].names;
    const key = (Object.keys(names) as Array<keyof DefaultNames>).find(
      (candidate) => names[candidate] === name,
    );
    if (key) return MESSAGES[language].names[key];
  }
  return name;
}

export function localizeNames(timer: Timer, language: Language): Timer {
  return {
    ...timer,
    name: translate(timer.name, language),
    steps: timer.steps.map((step) => ({ ...step, name: translate(step.name, language) })),
  };
}
