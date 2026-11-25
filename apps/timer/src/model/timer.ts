// A timer is one definition: prepare, then cycles × rounds × steps, with a rest
// between cycles and a recovery at the end. Tabata, rounds and lap timers are
// just different values of the same shape.
//
// This file holds no text. Every name it needs is passed in, taken from the
// messages of the current language (src/i18n).

export type PhaseKind = "prepare" | "work" | "rest" | "recovery";

/** Background color of the session screen for each kind of phase. */
export const PHASE_COLORS: Record<PhaseKind, string> = {
  prepare: "#00E0FF",
  work: "#C6FF00",
  rest: "#FF2E88",
  recovery: "#FF8A00",
};

export const TIMER_COLORS = [
  { id: "pink", value: "#FF2E88" },
  { id: "green", value: "#C6FF00" },
  { id: "cyan", value: "#00E0FF" },
  { id: "orange", value: "#FF8A00" },
  { id: "purple", value: "#9B5CFF" },
] as const;

export type TimerColorId = (typeof TIMER_COLORS)[number]["id"];

/** Names of the phases that are not steps of a round. */
export interface PhaseNames {
  prepare: string;
  cycleRest: string;
  recovery: string;
}

/** The names the app gives by itself: to steps, to new timers and to the starter timers. */
export interface DefaultNames {
  work: string;
  rest: string;
  lap: string;
  newStep: string;
  tabata: string;
  rounds: string;
  lapTimer: string;
  newTimer: string;
  classicTabata: string;
  morningCore: string;
  boxing: string;
  trackIntervals: string;
}

/** One step of a round, for example "Work" or "Rest". */
export interface Step {
  id: string;
  name: string;
  kind: "work" | "rest";
  seconds: number;
}

export interface TimerOptions {
  /** Beeps on the last 3 seconds of each phase. */
  countdown: boolean;
  /** Speaks the name of each phase. */
  voice: boolean;
  /** Vibrates on each phase change. */
  vibration: boolean;
  /** Keeps the screen on during a session. */
  keepAwake: boolean;
}

export interface Timer {
  id: string;
  name: string;
  color: string;
  prepareSeconds: number;
  steps: Step[];
  rounds: number;
  cycles: number;
  /** Rest between two cycles. */
  cycleRestSeconds: number;
  /** Recovery after the last cycle. */
  recoverySeconds: number;
  options: TimerOptions;
}

/** One stretch of time in a session. `round` and `cycle` start at 1. */
export interface Phase {
  kind: PhaseKind;
  name: string;
  seconds: number;
  round: number;
  cycle: number;
}

/** The flat list of phases a session runs through. Zero-length phases are left out. */
export function buildPhases(timer: Timer, names: PhaseNames): Phase[] {
  const phases: Phase[] = [];
  const add = (kind: PhaseKind, name: string, seconds: number, round: number, cycle: number) => {
    if (seconds > 0) phases.push({ kind, name, seconds, round, cycle });
  };

  add("prepare", names.prepare, timer.prepareSeconds, 1, 1);
  for (let cycle = 1; cycle <= timer.cycles; cycle++) {
    for (let round = 1; round <= timer.rounds; round++) {
      for (const step of timer.steps) add(step.kind, step.name, step.seconds, round, cycle);
    }
    if (cycle < timer.cycles) {
      add("recovery", names.cycleRest, timer.cycleRestSeconds, timer.rounds, cycle);
    }
  }
  add("recovery", names.recovery, timer.recoverySeconds, timer.rounds, timer.cycles);

  return phases;
}

export function totalSeconds(phases: Phase[]): number {
  return phases.reduce((sum, phase) => sum + phase.seconds, 0);
}

/** 250 → "4:10" */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** "5 × (1:00 / 0:15) · 2 cycles". `formatCycles` gives the "2 cycles" part. */
export function summarize(timer: Timer, formatCycles: (count: number) => string): string {
  const durations = timer.steps
    .filter((step) => step.seconds > 0)
    .map((step) => formatDuration(step.seconds));
  const round = durations.length === 1 ? durations[0] : `(${durations.join(" / ")})`;
  const cycles = timer.cycles > 1 ? ` · ${formatCycles(timer.cycles)}` : "";
  return `${timer.rounds} × ${round}${cycles}`;
}

const DEFAULT_OPTIONS: TimerOptions = {
  countdown: true,
  voice: true,
  vibration: false,
  keepAwake: true,
};

interface TimerValues {
  name: string;
  color: string;
  prepare: number;
  /** Seconds of each step of a round, with the name it shows during a session. */
  steps: Array<[name: string, kind: Step["kind"], seconds: number]>;
  rounds: number;
  cycles?: number;
  cycleRest?: number;
  recovery?: number;
}

function createTimer(values: TimerValues): Timer {
  return {
    id: crypto.randomUUID(),
    name: values.name,
    color: values.color,
    prepareSeconds: values.prepare,
    steps: values.steps.map(([name, kind, seconds]) => ({
      id: crypto.randomUUID(),
      name,
      kind,
      seconds,
    })),
    rounds: values.rounds,
    cycles: values.cycles ?? 1,
    cycleRestSeconds: values.cycleRest ?? 0,
    recoverySeconds: values.recovery ?? 0,
    options: { ...DEFAULT_OPTIONS },
  };
}

export function createStep(names: DefaultNames): Step {
  return { id: crypto.randomUUID(), name: names.newStep, kind: "work", seconds: 30 };
}

export type TemplateId = "tabata" | "rounds" | "laps" | "blank";

export interface Template {
  id: TemplateId;
  badge: string;
  create: (names: DefaultNames) => Timer;
}

/** Starting points offered when creating a timer. Everything stays editable. */
export const TEMPLATES: Template[] = [
  {
    id: "tabata",
    badge: "T",
    create: (names) =>
      createTimer({
        name: names.tabata,
        color: "#C6FF00",
        prepare: 10,
        steps: [
          [names.work, "work", 20],
          [names.rest, "rest", 10],
        ],
        rounds: 8,
      }),
  },
  {
    id: "rounds",
    badge: "R",
    create: (names) =>
      createTimer({
        name: names.rounds,
        color: "#FF2E88",
        prepare: 10,
        steps: [
          [names.work, "work", 60],
          [names.rest, "rest", 15],
        ],
        rounds: 5,
        recovery: 30,
      }),
  },
  {
    id: "laps",
    badge: "C",
    create: (names) =>
      createTimer({
        name: names.lapTimer,
        color: "#00E0FF",
        prepare: 10,
        steps: [[names.lap, "work", 60]],
        rounds: 6,
      }),
  },
  {
    id: "blank",
    badge: "+",
    create: (names) =>
      createTimer({
        name: names.newTimer,
        color: "#FF8A00",
        prepare: 10,
        steps: [[names.work, "work", 30]],
        rounds: 1,
      }),
  },
];

/** The timers a new install starts with. */
export function createStarterTimers(names: DefaultNames): Timer[] {
  const workRest = (work: number, rest: number): TimerValues["steps"] => [
    [names.work, "work", work],
    [names.rest, "rest", rest],
  ];

  return [
    createTimer({
      name: names.classicTabata,
      color: "#C6FF00",
      prepare: 10,
      steps: workRest(20, 10),
      rounds: 8,
    }),
    createTimer({
      name: names.morningCore,
      color: "#FF2E88",
      prepare: 10,
      steps: workRest(60, 15),
      rounds: 5,
      cycles: 2,
      cycleRest: 30,
      recovery: 30,
    }),
    createTimer({
      name: names.boxing,
      color: "#00E0FF",
      prepare: 10,
      steps: workRest(180, 60),
      rounds: 3,
    }),
    createTimer({
      name: names.trackIntervals,
      color: "#FF8A00",
      prepare: 10,
      steps: workRest(90, 60),
      rounds: 10,
    }),
  ];
}
