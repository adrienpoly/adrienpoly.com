import { describe, expect, it } from "vitest";
import {
  bestResult,
  dateInputValue,
  formatDifference,
  formatGap,
  history,
  parseResults,
  viewAttempt,
  withDate,
  type Result,
} from "./challenge";

const result = (id: string, seconds: number, at: number): Result => ({ id, seconds, at });

describe("viewAttempt", () => {
  const attempt = { startedAt: 1_000_000, prepareSeconds: 10 };
  const at = (seconds: number) => viewAttempt(attempt, attempt.startedAt + seconds * 1000);

  it("counts the preparation down, rounded up", () => {
    expect(at(0)).toEqual({ running: false, seconds: 10 });
    expect(at(0.1)).toEqual({ running: false, seconds: 10 });
    expect(at(9.9)).toEqual({ running: false, seconds: 1 });
  });

  it("then counts up from zero, in whole seconds", () => {
    expect(at(10)).toEqual({ running: true, seconds: 0 });
    expect(at(10.9)).toEqual({ running: true, seconds: 0 });
    expect(at(52.4)).toEqual({ running: true, seconds: 42 });
  });

  it("starts at once without a preparation", () => {
    expect(viewAttempt({ startedAt: 5000, prepareSeconds: 0 }, 5000)).toEqual({
      running: true,
      seconds: 0,
    });
  });

  it("is still right after the app was suspended", () => {
    expect(at(10 + 3600)).toEqual({ running: true, seconds: 3600 });
  });
});

describe("bestResult", () => {
  const results = [result("a", 45, 1), result("b", 42, 2), result("c", 50, 3)];

  it("is the shortest or the longest time, depending on the goal", () => {
    expect(bestResult(results, "shortest")?.id).toBe("b");
    expect(bestResult(results, "longest")?.id).toBe("c");
  });

  it("is the oldest one when several results are equal", () => {
    const tied = [result("late", 42, 9), result("early", 42, 2)];

    expect(bestResult(tied, "shortest")?.id).toBe("early");
  });

  it("is undefined without results", () => {
    expect(bestResult([], "shortest")).toBeUndefined();
  });
});

describe("history", () => {
  // Stored in any order: the history sorts by date.
  const results = [result("c", 46, 30), result("a", 45, 10), result("b", 42, 20), result("d", 42, 40)];

  it("lists the results from the newest to the oldest", () => {
    expect(history(results, "shortest").map((entry) => entry.result.id)).toEqual(["d", "c", "b", "a"]);
  });

  it("compares each result with the best one before it", () => {
    const entries = history(results, "shortest");
    const entry = (id: string) => entries.find((candidate) => candidate.result.id === id)!;

    expect(entry("a")).toMatchObject({ previousBest: null, difference: null, improved: false });
    expect(entry("b")).toMatchObject({ previousBest: 45, difference: -3, improved: true });
    expect(entry("c")).toMatchObject({ previousBest: 42, difference: 4, improved: false });
    expect(entry("d")).toMatchObject({ previousBest: 42, difference: 0, improved: false });
  });

  it("reads the same times the other way round when the longest time wins", () => {
    const entries = history(results, "longest");
    const entry = (id: string) => entries.find((candidate) => candidate.result.id === id)!;

    expect(entry("b")).toMatchObject({ previousBest: 45, difference: -3, improved: false });
    expect(entry("c")).toMatchObject({ previousBest: 45, difference: 1, improved: true });
    expect(entry("d")).toMatchObject({ previousBest: 46, difference: -4, improved: false });
  });

  it("marks the best result, once", () => {
    const best = (goal: "shortest" | "longest") =>
      history(results, goal)
        .filter((entry) => entry.isBest)
        .map((entry) => entry.result.id);

    expect(best("shortest")).toEqual(["b"]);
    expect(best("longest")).toEqual(["c"]);
  });
});

describe("formatGap and formatDifference", () => {
  it("writes short gaps in seconds and long ones as m:ss", () => {
    expect(formatGap(3)).toBe("3 s");
    expect(formatGap(-3)).toBe("3 s");
    expect(formatGap(65)).toBe("1:05");
  });

  it("puts a sign in front of a difference", () => {
    expect(formatDifference(4)).toBe("+4 s");
    expect(formatDifference(-3)).toBe("−3 s");
    expect(formatDifference(-65)).toBe("−1:05");
    expect(formatDifference(0)).toBe("=");
  });
});

describe("parseResults", () => {
  it("reads what was stored", () => {
    const stored = { timer: [result("a", 45, 10)] };

    expect(parseResults(JSON.stringify(stored))).toEqual(stored);
  });

  it("starts empty when nothing was stored or the data is unreadable", () => {
    expect(parseResults(null)).toEqual({});
    expect(parseResults("not json")).toEqual({});
    expect(parseResults("[1, 2]")).toEqual({});
  });

  it("drops entries that are not results", () => {
    const stored = {
      timer: [result("a", 45, 10), { id: "b", seconds: "fast", at: 20 }, null, { id: "c", seconds: -1, at: 3 }],
      other: "nothing",
    };

    expect(parseResults(JSON.stringify(stored))).toEqual({ timer: [result("a", 45, 10)] });
  });
});

describe("dates of a result", () => {
  // Local time on both sides, so the test holds in any time zone.
  const at = new Date(2026, 10, 26, 7, 12, 30).getTime();

  it("gives the day for a date field", () => {
    expect(dateInputValue(at)).toBe("2026-11-26");
    expect(dateInputValue(new Date(2026, 0, 5, 23, 59).getTime())).toBe("2026-01-05");
  });

  it("moves a result to another day and keeps its time of day", () => {
    const moved = new Date(withDate(at, "2026-09-03"));

    expect(dateInputValue(moved.getTime())).toBe("2026-09-03");
    expect([moved.getHours(), moved.getMinutes(), moved.getSeconds()]).toEqual([7, 12, 30]);
  });

  it("leaves the date alone when the field is empty", () => {
    expect(withDate(at, "")).toBe(at);
  });
});
