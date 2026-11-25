import type { Phase, PhaseKind } from "./timer";

// A running session. Time is always derived from the clock: the session stores
// when the current phase was last resumed, and `sync` catches up from there.
// Nothing counts ticks, so the session is still right after the app has been
// suspended in the background.

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
}

export function createSession(phases: Phase[], now: number): Session {
  return {
    phases,
    index: 0,
    phaseElapsedMs: 0,
    resumedAt: phases.length > 0 ? now : null,
    spentMs: { prepare: 0, work: 0, rest: 0, recovery: 0 },
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

/** Leaves the current phase after `elapsedMs` and lands on `index` at its start. */
function moveTo(session: Session, index: number, elapsedMs: number, now: number): Session {
  const current = session.phases[session.index];
  const spentMs = { ...session.spentMs };
  if (current) spentMs[current.kind] += Math.min(elapsedMs, current.seconds * 1000);

  const finished = index >= session.phases.length;
  return {
    ...session,
    index,
    phaseElapsedMs: 0,
    resumedAt: finished || session.resumedAt === null ? null : now,
    spentMs,
  };
}

/**
 * Brings the session up to date with the clock, moving through as many phases
 * as have ended. Returns the same object when the current phase is still running.
 */
export function sync(session: Session, now: number): Session {
  let next = session;
  while (next.resumedAt !== null && !isFinished(next)) {
    const durationMs = next.phases[next.index].seconds * 1000;
    const elapsedMs = currentElapsedMs(next, now);
    if (elapsedMs < durationMs) break;

    // The next phase started when this one ended, which may be before `now`.
    const endedAt = now - (elapsedMs - durationMs);
    next = moveTo(next, next.index + 1, durationMs, endedAt);
  }
  return next;
}

export function pause(session: Session, now: number): Session {
  if (session.resumedAt === null) return session;
  return { ...session, phaseElapsedMs: currentElapsedMs(session, now), resumedAt: null };
}

export function resume(session: Session, now: number): Session {
  if (session.resumedAt !== null || isFinished(session)) return session;
  return { ...session, resumedAt: now };
}

/** Skips to the next phase. Skipping the last phase finishes the session. */
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
  /** Whole seconds left in the current phase, rounded up. */
  phaseRemainingSeconds: number;
  /** Whole seconds left in the session, rounded up. */
  totalRemainingSeconds: number;
}

/** What the screen shows at `now`. Call `sync` first. */
export function view(session: Session, now: number): SessionView {
  const phase = session.phases[session.index];
  if (!phase) {
    return {
      phase: undefined,
      nextPhase: undefined,
      phaseRemainingSeconds: 0,
      totalRemainingSeconds: 0,
    };
  }

  const remainingMs = Math.max(0, phase.seconds * 1000 - currentElapsedMs(session, now));
  const laterSeconds = session.phases
    .slice(session.index + 1)
    .reduce((sum, later) => sum + later.seconds, 0);

  return {
    phase,
    nextPhase: session.phases[session.index + 1],
    phaseRemainingSeconds: Math.ceil(remainingMs / 1000),
    totalRemainingSeconds: Math.ceil(remainingMs / 1000) + laterSeconds,
  };
}
