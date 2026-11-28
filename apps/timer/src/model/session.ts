import { totalSeconds, type Phase, type PhaseKind } from "./timer";

// A running session. Time is always derived from the clock: the session stores
// when the current phase was last resumed, and `sync` catches up from there.
// Nothing counts ticks, so the session is still right after the app has been
// suspended in the background.
//
// An effort (in a circuit) is the one phase with no set length: it runs until
// the user finishes it (`finishEffort`), or until its limit if it has one, and
// the time it took is kept.

/** The time an effort took. */
export interface EffortTime {
  ms: number;
  /** True when the effort was ended by its limit, not by the user. */
  reachedLimit: boolean;
}

export interface Session {
  phases: Phase[];
  /** Index of the current phase. Equal to `phases.length` once finished. */
  index: number;
  /** Time (ms) spent in the current phase before `resumedAt`. */
  phaseElapsedMs: number;
  /** Clock time (ms) of the last resume, or null while paused or finished. */
  resumedAt: number | null;
  /** Time (ms) really spent in each kind of phase, in the phases already left. */
  spentMs: Record<PhaseKind, number>;
  /** The efforts done, by index of their phase. A skipped effort has none. */
  efforts: Record<number, EffortTime>;
}

export function createSession(phases: Phase[], now: number): Session {
  return {
    phases,
    index: 0,
    phaseElapsedMs: 0,
    resumedAt: phases.length > 0 ? now : null,
    spentMs: { prepare: 0, work: 0, rest: 0, recovery: 0, effort: 0 },
    efforts: {},
  };
}

export function isFinished(session: Session): boolean {
  return session.index >= session.phases.length;
}

export function isPaused(session: Session): boolean {
  return session.resumedAt === null && !isFinished(session);
}

/** Time (ms) spent in the current phase as of `now`. */
function currentElapsedMs(session: Session, now: number): number {
  if (session.resumedAt === null) return session.phaseElapsedMs;
  return session.phaseElapsedMs + Math.max(0, now - session.resumedAt);
}

/** The length of a phase in ms, or null for an effort without a limit. */
function durationMs(phase: Phase): number | null {
  return phase.seconds === null ? null : phase.seconds * 1000;
}

/**
 * Leaves the current phase after `elapsedMs` and lands on `index` at its start.
 * `effort` is the time to keep for the phase left, when it is an effort that was done.
 * The phase landed on starts afresh: an effort done again loses its earlier time.
 */
function moveTo(session: Session, index: number, elapsedMs: number, now: number, effort?: EffortTime): Session {
  const current = session.phases[session.index];
  const spentMs = { ...session.spentMs };
  if (current) spentMs[current.kind] += Math.min(elapsedMs, durationMs(current) ?? elapsedMs);

  const { [index]: _restarted, ...efforts } = session.efforts;
  if (effort) efforts[session.index] = effort;

  const finished = index >= session.phases.length;
  return {
    ...session,
    index,
    phaseElapsedMs: 0,
    resumedAt: finished || session.resumedAt === null ? null : now,
    spentMs,
    efforts,
  };
}

/**
 * Brings the session up to date with the clock, moving through as many phases
 * as have ended. Returns the same object when the current phase is still running.
 */
export function sync(session: Session, now: number): Session {
  let next = session;
  while (next.resumedAt !== null && !isFinished(next)) {
    const phase = next.phases[next.index];
    const lengthMs = durationMs(phase);
    const elapsedMs = currentElapsedMs(next, now);
    if (lengthMs === null || elapsedMs < lengthMs) break;

    // The next phase started when this one ended, which may be before `now`.
    const endedAt = now - (elapsedMs - lengthMs);
    const effort = phase.kind === "effort" ? { ms: lengthMs, reachedLimit: true } : undefined;
    next = moveTo(next, next.index + 1, lengthMs, endedAt, effort);
  }
  return next;
}

/** The user says the current effort is over: its time is kept, and the next phase starts. */
export function finishEffort(session: Session, now: number): Session {
  // A tap that comes after the limit changes nothing: the limit ended the effort.
  const synced = sync(session, now);
  if (synced !== session || isFinished(synced)) return synced;
  if (synced.phases[synced.index].kind !== "effort") return synced;

  const ms = currentElapsedMs(synced, now);
  return moveTo(synced, synced.index + 1, ms, now, { ms, reachedLimit: false });
}

export function pause(session: Session, now: number): Session {
  if (session.resumedAt === null) return session;
  return { ...session, phaseElapsedMs: currentElapsedMs(session, now), resumedAt: null };
}

export function resume(session: Session, now: number): Session {
  if (session.resumedAt !== null || isFinished(session)) return session;
  return { ...session, resumedAt: now };
}

/** Skips to the next phase. Skipping the last phase finishes the session. A skipped effort keeps no time. */
export function skipForward(session: Session, now: number): Session {
  if (isFinished(session)) return session;
  return moveTo(session, session.index + 1, currentElapsedMs(session, now), now);
}

const RESTART_THRESHOLD_MS = 3000;

/**
 * Goes back: to the start of the current phase when it is more than 3 seconds
 * in, to the previous phase otherwise (like the previous-track button of a player).
 */
export function skipBack(session: Session, now: number): Session {
  if (isFinished(session)) return session;
  const elapsedMs = currentElapsedMs(session, now);
  const restart = elapsedMs > RESTART_THRESHOLD_MS || session.index === 0;
  return moveTo(session, restart ? session.index : session.index - 1, elapsedMs, now);
}

export interface SessionView {
  /** The current phase, or undefined once finished. */
  phase: Phase | undefined;
  /** The phase after the current one, if any. */
  nextPhase: Phase | undefined;
  /** Whole seconds spent in the current phase, rounded down: what the stopwatch of an effort shows. */
  phaseElapsedSeconds: number;
  /** Whole seconds left in the current phase, rounded up. Null for an effort without a limit. */
  phaseRemainingSeconds: number | null;
  /** Whole seconds left in the session, rounded up, efforts left out (see `effortsLeft`). */
  totalRemainingSeconds: number;
  /** The efforts still to do, the current one included. */
  effortsLeft: number;
}

/** What the screen shows at `now`. Call `sync` first. */
export function view(session: Session, now: number): SessionView {
  const phase = session.phases[session.index];
  if (!phase) {
    return {
      phase: undefined,
      nextPhase: undefined,
      phaseElapsedSeconds: 0,
      phaseRemainingSeconds: 0,
      totalRemainingSeconds: 0,
      effortsLeft: 0,
    };
  }

  const elapsedMs = currentElapsedMs(session, now);
  const lengthMs = durationMs(phase);
  const phaseRemainingSeconds =
    lengthMs === null ? null : Math.ceil(Math.max(0, lengthMs - elapsedMs) / 1000);
  const ahead = session.phases.slice(session.index);
  const later = ahead.slice(1);

  return {
    phase,
    nextPhase: later[0],
    phaseElapsedSeconds: Math.floor(elapsedMs / 1000),
    phaseRemainingSeconds,
    totalRemainingSeconds:
      (phase.kind === "effort" ? 0 : (phaseRemainingSeconds ?? 0)) + totalSeconds(later),
    effortsLeft: ahead.filter((candidate) => candidate.kind === "effort").length,
  };
}
