import type { Block, DefaultNames, Step, Timer } from "../model/timer";
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

const localizeSteps = (steps: Step[], language: Language) =>
  steps.map((step) => ({ ...step, name: translate(step.name, language) }));

function localizeBlock(block: Block, language: Language): Block {
  const name = translate(block.name, language);
  if (block.type === "intervals") return { ...block, name, steps: localizeSteps(block.steps, language) };
  return { ...block, name };
}

export function localizeNames(timer: Timer, language: Language): Timer {
  return {
    ...timer,
    name: translate(timer.name, language),
    steps: localizeSteps(timer.steps, language),
    ...(timer.circuit && {
      circuit: {
        ...timer.circuit,
        blocks: timer.circuit.blocks.map((block) => localizeBlock(block, language)),
      },
    }),
  };
}
