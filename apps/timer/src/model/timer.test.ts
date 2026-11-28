import { describe, expect, it } from "vitest";
import {
  blockFromTimer,
  blockPhases,
  buildPhases,
  canStart,
  createBlock,
  createStarterTimers,
  duplicateBlock,
  effortCount,
  formatDuration,
  sortByRecent,
  summarize,
  TEMPLATES,
  totalSeconds,
  type Block,
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

describe("circuits", () => {
  const template = () => TEMPLATES.find((candidate) => candidate.id === "circuit")!.create(names);
  const withBlocks = (blocks: Block[], transitionSeconds = 30): Timer => ({
    ...template(),
    prepareSeconds: 10,
    recoverySeconds: 60,
    circuit: { blocks, transitionSeconds },
  });
  const rest = (seconds: number): Block => ({ ...createBlock("rest", names), seconds } as Block);
  const label = (timer: Timer) =>
    phases(timer).map((phase) => `${phase.kind} ${phase.name} ${phase.seconds ?? "open"} @${phase.block ?? "-"}`);

  it("runs the blocks one after the other, with a transition between two blocks", () => {
    expect(label(template())).toEqual([
      "prepare Prepare 10 @-",
      ...Array.from({ length: 8 }, () => ["work Work 20 @0", "rest Rest 10 @0"]).flat(),
      "prepare Transition 30 @1",
      "effort 10 push-ups 120 @1",
      "prepare Transition 30 @2",
      "effort Plank open @2",
      "recovery Cool down 60 @-",
    ]);
  });

  it("puts no transition next to a rest block", () => {
    const [intervals, effort] = [createBlock("intervals", names), createBlock("effort", names)];
    const timer = withBlocks([intervals, rest(45), effort, effort]);

    expect(label(timer).filter((line) => !line.startsWith("work") && !line.startsWith("rest Rest 10"))).toEqual([
      "prepare Prepare 10 @-",
      "rest Rest 45 @1",
      "effort 10 push-ups open @2",
      "prepare Transition 30 @3",
      "effort 10 push-ups open @3",
      "recovery Cool down 60 @-",
    ]);
  });

  it("counts rounds and cycles inside an intervals block", () => {
    const block = { ...createBlock("intervals", names), rounds: 2, cycles: 2, cycleRestSeconds: 15 } as Block;
    const lines = phases(withBlocks([block])).map((phase) => `${phase.name} ${phase.round}/${phase.cycle}`);

    expect(lines).toEqual([
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
      "Cool down 1/1",
    ]);
  });

  it("leaves the efforts out of the total time and counts them apart", () => {
    // 10 prepare + 8 × 30 + 2 × 30 transitions + 60 recovery; the limit of the push-ups does not count.
    expect(formatDuration(totalSeconds(phases(template())))).toBe("6:10");
    expect(effortCount(phases(template()))).toBe(2);
  });

  it("gives the phases of one block on its own", () => {
    const [tabata, pushUps] = template().circuit!.blocks;

    expect(totalSeconds(blockPhases(tabata, en.phases))).toBe(240);
    expect(blockPhases(pushUps, en.phases).map((phase) => phase.kind)).toEqual(["effort"]);
  });

  it("lists its blocks as its summary", () => {
    expect(summarize(template(), en.counts.cycles)).toBe("Tabata · 10 push-ups · Plank");
  });

  it("can start only with a block", () => {
    const empty = withBlocks([]);

    expect(canStart(template(), phases(template()))).toBe(true);
    expect(canStart(empty, phases(empty))).toBe(false);
  });

  it("copies a timer into an intervals block and a challenge into an effort", () => {
    const tabata = starter(names.classicTabata);
    const challenge = TEMPLATES.find((candidate) => candidate.id === "challenge")!.create(names);

    const intervals = blockFromTimer(tabata);
    expect(intervals).toMatchObject({ type: "intervals", name: tabata.name, rounds: 8, cycles: 1 });
    expect(intervals?.type === "intervals" && intervals.steps.map((step) => step.seconds)).toEqual([20, 10]);
    // The copy does not share its ids with the timer.
    expect(intervals?.type === "intervals" && intervals.steps[0].id).not.toBe(tabata.steps[0].id);

    expect(blockFromTimer(challenge)).toMatchObject({ type: "effort", name: challenge.name, goal: "shortest" });
    expect(blockFromTimer(template())).toBeNull();
  });

  it("duplicates a block with new ids", () => {
    const block = createBlock("intervals", names);
    const copy = duplicateBlock(block);

    expect(copy.id).not.toBe(block.id);
    expect(copy.type === "intervals" && copy.steps[0].id).not.toBe(block.type === "intervals" && block.steps[0].id);
  });
});

describe("sortByRecent", () => {
  const timer = (id: string, usedAt?: number) => ({ id, ...(usedAt !== undefined && { usedAt }) });
  const ids = (timers: Array<{ id: string }>) => timers.map((t) => t.id);

  it("puts the most recently used timer first", () => {
    expect(ids(sortByRecent([timer("a", 100), timer("b", 300), timer("c", 200)]))).toEqual(["b", "c", "a"]);
  });

  it("puts timers never used since the date existed last, in their saved order", () => {
    expect(ids(sortByRecent([timer("a"), timer("b", 100), timer("c"), timer("d")]))).toEqual(["b", "a", "c", "d"]);
  });

  it("leaves the list it is given alone", () => {
    const list = [timer("a", 1), timer("b", 2)];
    sortByRecent(list);
    expect(ids(list)).toEqual(["a", "b"]);
  });
});
