import { describe, expect, it } from "vitest";
import {
  createSession,
  finishEffort,
  isFinished,
  isPaused,
  pause,
  resume,
  skipBack,
  skipForward,
  sync,
  view,
} from "./session";
import type { Phase } from "./timer";

const phase = (kind: Exclude<Phase["kind"], "effort">, seconds: number): Phase => ({
  kind,
  name: kind,
  seconds,
  round: 1,
  cycle: 1,
});

/** An effort of a circuit: open, or ending by itself after `limit` seconds. */
const effort = (limit: number | null = null): Phase => ({
  kind: "effort",
  name: "effort",
  seconds: limit,
  round: 1,
  cycle: 1,
});

// prepare 10 s, work 20 s, rest 10 s
const PHASES = [phase("prepare", 10), phase("work", 20), phase("rest", 10)];
const START = 1_000_000;
const at = (seconds: number) => START + seconds * 1000;

describe("sync", () => {
  it("stays in the current phase until it ends", () => {
    const session = createSession(PHASES, START);

    expect(sync(session, at(9.9))).toBe(session);
    expect(view(session, at(9.1)).phaseRemainingSeconds).toBe(1);
  });

  it("moves to the next phase when the current one ends", () => {
    const session = sync(createSession(PHASES, START), at(10));

    expect(session.index).toBe(1);
    expect(view(session, at(10)).phaseRemainingSeconds).toBe(20);
  });

  it("catches up over several phases after a long gap, keeping the overshoot", () => {
    // 33 s in: prepare (10) and work (20) are over, rest has run for 3 s.
    const session = sync(createSession(PHASES, START), at(33));

    expect(session.index).toBe(2);
    expect(view(session, at(33)).phaseRemainingSeconds).toBe(7);
    expect(session.spentMs).toMatchObject({ prepare: 10_000, work: 20_000 });
  });

  it("finishes after the last phase and records the time spent", () => {
    const session = sync(createSession(PHASES, START), at(60));

    expect(isFinished(session)).toBe(true);
    expect(session.spentMs).toEqual({ prepare: 10_000, work: 20_000, rest: 10_000, recovery: 0, effort: 0 });
    expect(view(session, at(60)).phase).toBeUndefined();
  });
});

describe("pause and resume", () => {
  it("stops the clock while paused", () => {
    const paused = pause(createSession(PHASES, START), at(4));

    expect(isPaused(paused)).toBe(true);
    expect(sync(paused, at(500))).toBe(paused);
    expect(view(paused, at(500)).phaseRemainingSeconds).toBe(6);

    const resumed = resume(paused, at(500));
    expect(view(resumed, at(503)).phaseRemainingSeconds).toBe(3);
  });
});

describe("skipForward", () => {
  it("starts the next phase and counts only the time really spent", () => {
    const session = skipForward(createSession(PHASES, START), at(4));

    expect(session.index).toBe(1);
    expect(session.spentMs.prepare).toBe(4000);
    expect(view(session, at(4)).phaseRemainingSeconds).toBe(20);
  });

  it("stays paused when skipping while paused", () => {
    const session = skipForward(pause(createSession(PHASES, START), at(4)), at(9));

    expect(isPaused(session)).toBe(true);
    expect(view(session, at(99)).phaseRemainingSeconds).toBe(20);
  });

  it("finishes the session from the last phase", () => {
    const last = sync(createSession(PHASES, START), at(31));

    expect(isFinished(skipForward(last, at(32)))).toBe(true);
  });
});

describe("skipBack", () => {
  it("restarts the current phase when it is more than 3 seconds in", () => {
    const session = skipBack(sync(createSession(PHASES, START), at(15)), at(15));

    expect(session.index).toBe(1);
    expect(view(session, at(15)).phaseRemainingSeconds).toBe(20);
  });

  it("goes to the previous phase when the current one has just started", () => {
    const session = skipBack(sync(createSession(PHASES, START), at(11)), at(11));

    expect(session.index).toBe(0);
    expect(view(session, at(11)).phaseRemainingSeconds).toBe(10);
  });
});

describe("view", () => {
  it("gives the time left in the session and the phase that comes next", () => {
    const session = sync(createSession(PHASES, START), at(12));
    const current = view(session, at(12));

    expect(current.phase?.kind).toBe("work");
    expect(current.nextPhase?.kind).toBe("rest");
    expect(current.totalRemainingSeconds).toBe(28);
  });
});

describe("efforts", () => {
  // prepare 10 s, an open effort, rest 10 s
  const CIRCUIT = [phase("prepare", 10), effort(), phase("rest", 10)];

  it("never ends an open effort by itself, and counts its time up", () => {
    const session = sync(createSession(CIRCUIT, START), at(10));

    expect(session.index).toBe(1);
    expect(sync(session, at(5000))).toBe(session);
    const current = view(session, at(27.6));
    expect(current.phaseElapsedSeconds).toBe(17);
    expect(current.phaseRemainingSeconds).toBeNull();
  });

  it("keeps the time of an effort when the user finishes it, and moves on", () => {
    const session = finishEffort(sync(createSession(CIRCUIT, START), at(10)), at(31.4));

    expect(session.index).toBe(2);
    expect(session.efforts).toEqual({ 1: { ms: 21_400, reachedLimit: false } });
    expect(session.spentMs.effort).toBe(21_400);
    expect(view(session, at(31.4)).phaseRemainingSeconds).toBe(10);
  });

  it("ends an effort at its limit, and says so", () => {
    const limited = [phase("prepare", 10), effort(60), phase("rest", 10)];
    const session = sync(createSession(limited, START), at(75));

    expect(session.index).toBe(2);
    expect(session.efforts).toEqual({ 1: { ms: 60_000, reachedLimit: true } });
    expect(view(sync(createSession(limited, START), at(68.5)), at(68.5)).phaseRemainingSeconds).toBe(2);
  });

  it("does not let a late tap go past the limit", () => {
    const limited = [phase("prepare", 10), effort(60), phase("rest", 10)];
    const session = finishEffort(sync(createSession(limited, START), at(10)), at(72));

    expect(session.efforts).toEqual({ 1: { ms: 60_000, reachedLimit: true } });
    expect(session.index).toBe(2);
  });

  it("does nothing outside an effort", () => {
    const session = createSession(CIRCUIT, START);

    expect(finishEffort(session, at(2))).toBe(session);
  });

  it("keeps no time for a skipped effort, and forgets the time of an effort done again", () => {
    const inEffort = sync(createSession(CIRCUIT, START), at(10));
    expect(skipForward(inEffort, at(12)).efforts).toEqual({});

    const done = finishEffort(inEffort, at(30));
    expect(skipBack(done, at(31)).efforts).toEqual({});
  });

  it("leaves the efforts out of the time left, and counts them", () => {
    const session = createSession([phase("prepare", 10), effort(), phase("rest", 10), effort(30)], START);
    const start = view(session, at(4));

    expect(start.totalRemainingSeconds).toBe(16);
    expect(start.effortsLeft).toBe(2);
    expect(view(sync(session, at(10)), at(10)).effortsLeft).toBe(2);
    expect(view(finishEffort(sync(session, at(10)), at(15)), at(15)).effortsLeft).toBe(1);
  });
});
