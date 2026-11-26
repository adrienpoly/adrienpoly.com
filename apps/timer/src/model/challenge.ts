import type { ChallengeGoal } from "./timer";

// A challenge is a timer that measures instead of counting down: after the
// preparation a stopwatch runs until the user stops it, and the time is kept
// as a result. Which result is the best depends on the goal of the challenge.
//
// Times are whole seconds: the tap that stops the stopwatch is not more
// precise than that, and a result can be corrected afterwards.

/** One attempt in progress. As in a session, time is always derived from the clock. */
export interface Attempt {
  /** Clock time (ms) at which the preparation started. */
  startedAt: number;
  prepareSeconds: number;
}

export interface AttemptView {
  /** False during the preparation. */
  running: boolean;
  /** Seconds left in the preparation (rounded up), then seconds on the stopwatch (rounded down). */
  seconds: number;
}

export function viewAttempt(attempt: Attempt, now: number): AttemptView {
  const stopwatchMs = now - attempt.startedAt - attempt.prepareSeconds * 1000;
  if (stopwatchMs < 0) return { running: false, seconds: Math.ceil(-stopwatchMs / 1000) };
  return { running: true, seconds: Math.floor(stopwatchMs / 1000) };
}

export interface Result {
  id: string;
  /** Clock time (ms) of the attempt. */
  at: number;
  seconds: number;
}

/** The results of every challenge, by timer id. */
export type ResultsByTimer = Record<string, Result[]>;

export function createResult(seconds: number, at: number): Result {
  return { id: crypto.randomUUID(), at, seconds };
}

export function isBetter(seconds: number, than: number, goal: ChallengeGoal): boolean {
  return goal === "shortest" ? seconds < than : seconds > than;
}

export const oldestFirst = (results: Result[]) => [...results].sort((a, b) => a.at - b.at);

/** The record: the shortest or the longest time. Of equal results, the oldest holds it. */
export function bestResult(results: Result[], goal: ChallengeGoal): Result | undefined {
  let best: Result | undefined;
  for (const result of oldestFirst(results)) {
    if (!best || isBetter(result.seconds, best.seconds, goal)) best = result;
  }
  return best;
}

export interface HistoryEntry {
  result: Result;
  /** The best time before this result, or null for the first one. */
  previousBest: number | null;
  /** This result minus `previousBest`, in seconds. */
  difference: number | null;
  /** True when this result beat the best time before it. */
  improved: boolean;
  /** True for the result that holds the record today. */
  isBest: boolean;
}

/** The results from the newest to the oldest, each compared with the best one before it. */
export function history(results: Result[], goal: ChallengeGoal): HistoryEntry[] {
  const best = bestResult(results, goal);
  let previousBest: number | null = null;

  const entries = oldestFirst(results).map((result): HistoryEntry => {
    const entry = {
      result,
      previousBest,
      difference: previousBest === null ? null : result.seconds - previousBest,
      improved: previousBest !== null && isBetter(result.seconds, previousBest, goal),
      isBest: result.id === best?.id,
    };
    if (previousBest === null || entry.improved) previousBest = result.seconds;
    return entry;
  });

  return entries.reverse();
}

/** A length of time between two results: "3 s", or "1:05" from one minute up. */
export function formatGap(seconds: number): string {
  const whole = Math.abs(Math.round(seconds));
  if (whole < 60) return `${whole} s`;
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** "+4 s", "−3 s", or "=" for the same time. */
export function formatDifference(seconds: number): string {
  if (seconds === 0) return "=";
  return `${seconds > 0 ? "+" : "−"}${formatGap(seconds)}`;
}

function isResult(value: unknown): value is Result {
  if (typeof value !== "object" || value === null) return false;
  const { id, at, seconds } = value as Record<string, unknown>;
  return (
    typeof id === "string" &&
    typeof at === "number" &&
    Number.isFinite(at) &&
    typeof seconds === "number" &&
    Number.isFinite(seconds) &&
    seconds >= 0
  );
}

/** Reads the stored results. Anything that is not a result is dropped. */
export function parseResults(stored: string | null): ResultsByTimer {
  let values: unknown = null;
  try {
    values = stored && JSON.parse(stored);
  } catch {
    // Not JSON: start empty.
  }
  if (typeof values !== "object" || values === null || Array.isArray(values)) return {};

  const results: ResultsByTimer = {};
  for (const [timerId, list] of Object.entries(values)) {
    if (Array.isArray(list)) results[timerId] = list.filter(isResult);
  }
  return results;
}

const twoDigits = (value: number) => String(value).padStart(2, "0");

/** The day of a result, in local time, as a date field wants it: "2026-11-26". */
export function dateInputValue(at: number): string {
  const date = new Date(at);
  return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
}

/** Moves `at` to the day given by a date field, keeping its time of day. An empty field changes nothing. */
export function withDate(at: number, day: string): number {
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  if (!year || !month || !dayOfMonth) return at;

  const date = new Date(at);
  date.setFullYear(year, month - 1, dayOfMonth);
  return date.getTime();
}
