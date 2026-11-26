import { describe, expect, it } from "vitest";
import {
  buildPhases,
  canStart,
  createStarterTimers,
  formatDuration,
  summarize,
  TEMPLATES,
  totalSeconds,
  type Timer,
} from "./timer";
import { en } from "../i18n/en";

// The model holds no text: names come from the messages of a language.
const { names } = en;
const phases = (timer: Timer) => buildPhases(timer, en.phases);

const starter = (name: string): Timer => {
  const timer = createStarterTimers(names).find((candidate) => candidate.name === name);
  if (!timer) throw new Error(`No starter timer named ${name}`);
  return timer;
};

describe("formatDuration", () => {
  it("formats seconds as m:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(42)).toBe("0:42");
    expect(formatDuration(250)).toBe("4:10");
    expect(formatDuration(1510)).toBe("25:10");
  });
});

describe("buildPhases", () => {
  it("gives the starter timers the totals shown in the design", () => {
    const total = (name: string) => formatDuration(totalSeconds(phases(starter(name))));

    expect(total(names.classicTabata)).toBe("4:10");
    expect(total(names.morningCore)).toBe("13:40");
    expect(total(names.boxing)).toBe("12:10");
    expect(total(names.trackIntervals)).toBe("25:10");
  });

  it("orders phases as prepare, cycles of rounds, rest between cycles, recovery", () => {
    const timer: Timer = { ...starter(names.morningCore), rounds: 2, cycles: 2 };

    expect(phases(timer).map((phase) => `${phase.name} ${phase.round}/${phase.cycle}`)).toEqual([
      "Prepare 1/1",
      "Work 1/1",
      "Rest 1/1",
      "Work 2/1",
      "Rest 2/1",
      "Rest between cycles 2/1",
      "Work 1/2",
      "Rest 1/2",
      "Work 2/2",
      "Rest 2/2",
      "Cool down 2/2",
    ]);
  });

  it("leaves out phases that last zero seconds", () => {
    const timer: Timer = { ...starter(names.classicTabata), prepareSeconds: 0, rounds: 1 };
    timer.steps = timer.steps.map((step) => (step.kind === "rest" ? { ...step, seconds: 0 } : step));

    expect(phases(timer).map((phase) => phase.kind)).toEqual(["work"]);
  });
});

describe("summarize", () => {
  it("describes one round and the number of rounds and cycles", () => {
    expect(summarize(starter(names.classicTabata), en.counts.cycles)).toBe("8 × (0:20 / 0:10)");
    expect(summarize(starter(names.morningCore), en.counts.cycles)).toBe("5 × (1:00 / 0:15) · 2 cycles");
  });

  it("drops the brackets when a round has a single step", () => {
    const laps = TEMPLATES.find((template) => template.id === "laps")!.create(names);

    expect(summarize(laps, en.counts.cycles)).toBe("6 × 1:00");
  });
});

describe("the challenge template", () => {
  const challenge = TEMPLATES.find((template) => template.id === "challenge")!.create(names);

  it("is a timer without steps: only the preparation is a phase", () => {
    expect(challenge.challenge).toEqual({ goal: "shortest" });
    expect(phases(challenge).map((phase) => phase.kind)).toEqual(["prepare"]);
  });

  it("can start even without a preparation, unlike a timer without phases", () => {
    const direct = { ...challenge, prepareSeconds: 0 };
    const empty = { ...direct, challenge: undefined };

    expect(phases(direct)).toEqual([]);
    expect(canStart(direct, phases(direct))).toBe(true);
    expect(canStart(empty, phases(empty))).toBe(false);
  });

  it("is the only template that is a challenge", () => {
    const challenges = TEMPLATES.filter((template) => template.create(names).challenge);

    expect(challenges.map((template) => template.id)).toEqual(["challenge"]);
  });
});
