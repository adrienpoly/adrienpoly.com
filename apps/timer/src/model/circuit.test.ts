import { describe, expect, it } from "vitest";
import { en } from "../i18n/en";
import { effortBlocks, effortOutcomes, removedEfforts } from "./circuit";
import { buildPhases, TEMPLATES, type Timer } from "./timer";

const circuit = () => TEMPLATES.find((template) => template.id === "circuit")!.create(en.names);

describe("effortBlocks", () => {
  it("lists the efforts of a circuit, and none for another timer", () => {
    expect(effortBlocks(circuit()).map((block) => block.name)).toEqual(["10 push-ups", "Plank"]);
    expect(effortBlocks(TEMPLATES[0].create(en.names))).toEqual([]);
  });
});

describe("removedEfforts", () => {
  it("gives the efforts that a new version of the circuit no longer has", () => {
    const before = circuit();
    const [, pushUps, plank] = before.circuit!.blocks;
    const after: Timer = { ...before, circuit: { ...before.circuit!, blocks: [plank] } };

    expect(removedEfforts(before, after)).toEqual([pushUps.id]);
    expect(removedEfforts(before, null)).toEqual([pushUps.id, plank.id]);
    expect(removedEfforts(undefined, after)).toEqual([]);
  });
});

describe("effortOutcomes", () => {
  // The template: prepare, 16 phases of Tabata, transition, push-ups (limit 2:00), transition, plank.
  const timer = circuit();
  const phases = buildPhases(timer, en.phases);
  const pushUps = phases.findIndex((phase) => phase.name === "10 push-ups");
  const plank = phases.findIndex((phase) => phase.name === "Plank");

  it("keeps the times of the efforts done, in whole seconds", () => {
    const outcomes = effortOutcomes(timer, phases, {
      [pushUps]: { ms: 21_900, reachedLimit: false },
      [plank]: { ms: 95_000, reachedLimit: false },
    });

    expect(outcomes.map(({ block, seconds, counts }) => [block.name, seconds, counts])).toEqual([
      ["10 push-ups", 21, true],
      ["Plank", 95, true],
    ]);
  });

  it("keeps nothing for a skipped effort", () => {
    const [skipped] = effortOutcomes(timer, phases, {});

    expect(skipped).toMatchObject({ seconds: null, counts: false });
  });

  it("does not count a fast effort that the limit ended, but counts a long one", () => {
    const limited: Timer = {
      ...timer,
      circuit: {
        ...timer.circuit!,
        blocks: timer.circuit!.blocks.map((block) =>
          block.type === "effort" ? { ...block, limitSeconds: 120 } : block,
        ),
      },
    };
    const outcomes = effortOutcomes(limited, buildPhases(limited, en.phases), {
      [pushUps]: { ms: 120_000, reachedLimit: true },
      [plank]: { ms: 120_000, reachedLimit: true },
    });

    expect(outcomes.map(({ reachedLimit, counts }) => [reachedLimit, counts])).toEqual([
      [true, false],
      [true, true],
    ]);
  });
});
