import { describe, expect, it } from "vitest";
import { createStarterTimers, TEMPLATES } from "../model/timer";
import { MESSAGES } from "./language";
import { localizeNames } from "./names";

const { en, fr } = MESSAGES;

describe("localizeNames", () => {
  it("shows the names the app gave in the current language", () => {
    const [tabata] = createStarterTimers(fr.names);
    const localized = localizeNames(tabata, "en");

    expect(localized.name).toBe(en.names.classicTabata);
    expect(localized.steps.map((step) => step.name)).toEqual([en.names.work, en.names.rest]);
  });

  it("works in both directions and leaves a timer already in the language as it is", () => {
    const [tabata] = createStarterTimers(en.names);

    expect(localizeNames(tabata, "en")).toEqual(tabata);
    expect(localizeNames(localizeNames(tabata, "fr"), "en")).toEqual(tabata);
  });

  it("leaves names typed by the user alone", () => {
    const [tabata] = createStarterTimers(fr.names);
    const custom = {
      ...tabata,
      name: "Mardi soir",
      steps: tabata.steps.map((step, index) => (index === 0 ? { ...step, name: "Pompes" } : step)),
    };
    const localized = localizeNames(custom, "en");

    expect(localized.name).toBe("Mardi soir");
    expect(localized.steps.map((step) => step.name)).toEqual(["Pompes", en.names.rest]);
  });

  it("shows the blocks of a circuit and their steps in the current language", () => {
    const circuit = TEMPLATES.find((template) => template.id === "circuit")!.create(fr.names);
    const localized = localizeNames(circuit, "en");
    const blocks = localized.circuit?.blocks ?? [];

    expect(localized.name).toBe(en.names.circuit);
    expect(blocks.map((block) => block.name)).toEqual([en.names.tabata, en.names.pushUps, en.names.plank]);
    expect(blocks[0].type === "intervals" && blocks[0].steps.map((step) => step.name)).toEqual([
      en.names.work,
      en.names.rest,
    ]);
  });

  it("can tell the default names of a language apart", () => {
    for (const messages of Object.values(MESSAGES)) {
      const names = Object.values(messages.names);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
