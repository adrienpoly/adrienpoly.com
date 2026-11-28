import type { EffortTime } from "./session";
import type { EffortBlock, Phase, Timer } from "./timer";

// The efforts of a circuit are measured like challenges, and their results are
// kept the same way: in the results store, under the id of their block. Each
// block has its own records, apart from any challenge it was copied from: an
// effort done after a Tabata does not compare with one done fresh.

export function effortBlocks(timer: Timer): EffortBlock[] {
  return (timer.circuit?.blocks ?? []).filter((block): block is EffortBlock => block.type === "effort");
}

/** The ids of the efforts of `before` that `after` no longer has: their results can go. */
export function removedEfforts(before: Timer | undefined, after: Timer | null): string[] {
  const kept = new Set(after ? effortBlocks(after).map((block) => block.id) : []);
  return (before ? effortBlocks(before) : []).map((block) => block.id).filter((id) => !kept.has(id));
}

/** How one effort of a session went. */
export interface EffortOutcome {
  block: EffortBlock;
  /** Whole seconds, or null for an effort that was skipped. */
  seconds: number | null;
  reachedLimit: boolean;
  /**
   * True when the time is kept as a result. Not when the effort was skipped,
   * nor when the limit ended an effort whose goal is to be fast: it was not finished.
   */
  counts: boolean;
}

/** The efforts of a circuit, in order, with the times a session kept for them (by phase index). */
export function effortOutcomes(
  timer: Timer,
  phases: Phase[],
  efforts: Record<number, EffortTime>,
): EffortOutcome[] {
  const blocks = timer.circuit?.blocks ?? [];
  return phases.flatMap((phase, index) => {
    const block = phase.block === undefined ? undefined : blocks[phase.block];
    if (phase.kind !== "effort" || block?.type !== "effort") return [];

    const time = efforts[index];
    const reachedLimit = time?.reachedLimit ?? false;
    return [
      {
        block,
        seconds: time ? Math.floor(time.ms / 1000) : null,
        reachedLimit,
        counts: time !== undefined && !(reachedLimit && block.goal === "shortest"),
      },
    ];
  });
}
