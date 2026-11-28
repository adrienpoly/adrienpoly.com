// A timer is one definition: prepare, then cycles × rounds × steps, with a rest
// between cycles and a recovery at the end. Tabata, rounds and lap timers are
// just different values of the same shape. Two kinds of timers build on it:
// - a challenge, a timer without steps whose effort is measured (see challenge.ts);
// - a circuit, a timer without steps whose `circuit` lists blocks of different
//   kinds: intervals, efforts measured like a challenge, and rests.
//
// This file holds no text. Every name it needs is passed in, taken from the
// messages of the current language (src/i18n).

/** "effort" is a measured effort of a circuit: it lasts until the user says it is over. */
export type PhaseKind = "prepare" | "work" | "rest" | "recovery" | "effort";

/** Background color of the session screen for each kind of phase. */
export const PHASE_COLORS: Record<PhaseKind, string> = {
  prepare: "#00E0FF",
  work: "#C6FF00",
  rest: "#FF2E88",
  recovery: "#FF8A00",
  effort: "#9B5CFF",
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
  /** Between two blocks of a circuit. */
  transition: string;
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
  challenge: string;
  classicTabata: string;
  morningCore: string;
  boxing: string;
  trackIntervals: string;
  circuit: string;
  /** A new intervals block of a circuit. */
  intervals: string;
  /** The effort blocks of the circuit template, and of a new effort block. */
  pushUps: string;
  plank: string;
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

/** Which result of a challenge is the best: the shortest time or the longest. */
export type ChallengeGoal = "shortest" | "longest";

/** A block of a circuit that runs like a timer: cycles × rounds × steps. */
export interface IntervalsBlock {
  id: string;
  type: "intervals";
  name: string;
  steps: Step[];
  rounds: number;
  cycles: number;
  cycleRestSeconds: number;
}

/** A block of a circuit measured like a challenge: a stopwatch runs until the user stops it. */
export interface EffortBlock {
  id: string;
  type: "effort";
  name: string;
  goal: ChallengeGoal;
  /** The effort ends by itself after this time. 0: no limit. */
  limitSeconds: number;
}

/** A block of a circuit that is only a pause. */
export interface RestBlock {
  id: string;
  type: "rest";
  name: string;
  seconds: number;
}

export type Block = IntervalsBlock | EffortBlock | RestBlock;
export type BlockType = Block["type"];

export interface Circuit {
  blocks: Block[];
  /** Pause between two blocks, to get ready for the next one. Not next to a rest block. */
  transitionSeconds: number;
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
  /**
   * Set for a challenge: after the preparation, a stopwatch runs until the user
   * stops it, and the time is kept as a result. A challenge has no steps.
   */
  challenge?: { goal: ChallengeGoal };
  /**
   * Set for a circuit: the blocks run one after the other, between the
   * preparation and the recovery. A circuit has no steps of its own.
   */
  circuit?: Circuit;
  /**
   * When the timer was last created, changed or completed, in milliseconds
   * since the epoch. The list shows the most recent first. Timers saved before
   * this existed have none: they come last, in their saved order.
   */
  usedAt?: number;
}

/** The timers, the most recently created, changed or completed first. */
export function sortByRecent<T extends Pick<Timer, "usedAt">>(timers: T[]): T[] {
  // Array.prototype.sort is stable: timers without a date keep their order.
  return [...timers].sort((a, b) => (b.usedAt ?? 0) - (a.usedAt ?? 0));
}

interface PhaseBase {
  name: string;
  /** `round` and `cycle` start at 1. */
  round: number;
  cycle: number;
  /** In a circuit: the index of the block the phase belongs to (a transition: the block it leads to). */
  block?: number;
}

/**
 * One stretch of time in a session. An effort has no length of its own: it
 * lasts until the user stops it, or until its limit (`seconds`) if it has one.
 */
export type Phase =
  | (PhaseBase & { kind: Exclude<PhaseKind, "effort">; seconds: number })
  | (PhaseBase & { kind: "effort"; seconds: number | null });

/** How long an effort looks in a sequence bar, whatever its limit: its real length is not known. */
export const EFFORT_BAR_SECONDS = 30;

/** The length of a phase in a sequence bar. */
export function barSeconds(phase: Phase): number {
  return phase.kind === "effort" ? EFFORT_BAR_SECONDS : phase.seconds;
}

type Intervals = Pick<IntervalsBlock, "steps" | "rounds" | "cycles" | "cycleRestSeconds">;

/** What `buildPhases` reads of a timer. */
type Sequence = Intervals & Pick<Timer, "prepareSeconds" | "recoverySeconds" | "circuit">;

/** The flat list of phases a session runs through. Zero-length phases are left out. */
export function buildPhases(timer: Sequence, names: PhaseNames): Phase[] {
  const phases: Phase[] = [];
  const add = (
    kind: Exclude<PhaseKind, "effort">,
    name: string,
    seconds: number,
    round: number,
    cycle: number,
    block?: number,
  ) => {
    if (seconds > 0) phases.push({ kind, name, seconds, round, cycle, ...(block !== undefined && { block }) });
  };

  const addIntervals = (intervals: Intervals, block?: number) => {
    for (let cycle = 1; cycle <= intervals.cycles; cycle++) {
      for (let round = 1; round <= intervals.rounds; round++) {
        for (const step of intervals.steps) add(step.kind, step.name, step.seconds, round, cycle, block);
      }
      if (cycle < intervals.cycles) {
        add("recovery", names.cycleRest, intervals.cycleRestSeconds, intervals.rounds, cycle, block);
      }
    }
  };

  add("prepare", names.prepare, timer.prepareSeconds, 1, 1);

  if (timer.circuit) {
    const { blocks, transitionSeconds } = timer.circuit;
    blocks.forEach((block, index) => {
      const previous = blocks[index - 1];
      // A rest block is already a pause: no transition next to it.
      if (previous && previous.type !== "rest" && block.type !== "rest") {
        add("prepare", names.transition, transitionSeconds, 1, 1, index);
      }
      if (block.type === "intervals") addIntervals(block, index);
      else if (block.type === "rest") add("rest", block.name, block.seconds, 1, 1, index);
      else {
        const seconds = block.limitSeconds > 0 ? block.limitSeconds : null;
        phases.push({ kind: "effort", name: block.name, seconds, round: 1, cycle: 1, block: index });
      }
    });
    add("recovery", names.recovery, timer.recoverySeconds, 1, 1);
  } else {
    addIntervals(timer);
    add("recovery", names.recovery, timer.recoverySeconds, timer.rounds, timer.cycles);
  }

  return phases;
}

/** The phases of one block of a circuit, on its own: its length, its sequence bar. */
export function blockPhases(block: Block, names: PhaseNames): Phase[] {
  const sequence = { prepareSeconds: 0, recoverySeconds: 0, steps: [], rounds: 1, cycles: 1, cycleRestSeconds: 0 };
  return buildPhases({ ...sequence, circuit: { blocks: [block], transitionSeconds: 0 } }, names);
}

/** A challenge can always start; a circuit needs a block; a timer needs at least one phase. */
export function canStart(timer: Timer, phases: Phase[]): boolean {
  if (timer.challenge) return true;
  if (timer.circuit) return timer.circuit.blocks.length > 0;
  return phases.length > 0;
}

/** The time the phases take. Efforts are left out: they last as long as they take (see `effortCount`). */
export function totalSeconds(phases: Phase[]): number {
  return phases.reduce((sum, phase) => sum + (phase.kind === "effort" ? 0 : phase.seconds), 0);
}

export function effortCount(phases: Phase[]): number {
  return phases.filter((phase) => phase.kind === "effort").length;
}

/** 250 → "4:10" */
export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * "5 × (1:00 / 0:15) · 2 cycles". `formatCycles` gives the "2 cycles" part.
 * A circuit lists its blocks: "Tabata · 10 push-ups · Plank".
 */
export function summarize(timer: Timer, formatCycles: (count: number) => string): string {
  if (timer.circuit) return timer.circuit.blocks.map((block) => block.name).join(" · ");
  return summarizeIntervals(timer, formatCycles);
}

/** "8 × (0:20 / 0:10)", for a timer or an intervals block. */
export function summarizeIntervals(
  intervals: Intervals,
  formatCycles: (count: number) => string,
): string {
  const durations = intervals.steps
    .filter((step) => step.seconds > 0)
    .map((step) => formatDuration(step.seconds));
  const round = durations.length === 1 ? durations[0] : `(${durations.join(" / ")})`;
  const cycles = intervals.cycles > 1 ? ` · ${formatCycles(intervals.cycles)}` : "";
  return `${intervals.rounds} × ${round}${cycles}`;
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
  challenge?: ChallengeGoal;
}

const createSteps = (steps: TimerValues["steps"]): Step[] =>
  steps.map(([name, kind, seconds]) => ({ id: crypto.randomUUID(), name, kind, seconds }));

function createTimer(values: TimerValues): Timer {
  return {
    id: crypto.randomUUID(),
    name: values.name,
    color: values.color,
    prepareSeconds: values.prepare,
    steps: createSteps(values.steps),
    rounds: values.rounds,
    cycles: values.cycles ?? 1,
    cycleRestSeconds: values.cycleRest ?? 0,
    recoverySeconds: values.recovery ?? 0,
    options: { ...DEFAULT_OPTIONS },
    ...(values.challenge && { challenge: { goal: values.challenge } }),
  };
}

export function createStep(names: DefaultNames): Step {
  return { id: crypto.randomUUID(), name: names.newStep, kind: "work", seconds: 30 };
}

/** A new effort, named after an example of its goal: push-ups to do fast, a plank to hold. */
export function createEffort(goal: ChallengeGoal, names: DefaultNames, limitSeconds = 0): EffortBlock {
  const name = goal === "shortest" ? names.pushUps : names.plank;
  return { id: crypto.randomUUID(), type: "effort", name, goal, limitSeconds };
}

/** A new block of a circuit, with values to start from. */
export function createBlock(type: BlockType, names: DefaultNames): Block {
  const id = crypto.randomUUID();
  if (type === "rest") return { id, type, name: names.rest, seconds: 60 };
  if (type === "effort") return createEffort("shortest", names);
  return {
    id,
    type,
    name: names.intervals,
    steps: createSteps([
      [names.work, "work", 20],
      [names.rest, "rest", 10],
    ]),
    rounds: 8,
    cycles: 1,
    cycleRestSeconds: 0,
  };
}

/**
 * A block that copies one of the user's timers: the intervals of a timer, the
 * effort of a challenge. The copy is independent of the timer it comes from.
 * A circuit cannot be copied into another one: null.
 */
export function blockFromTimer(timer: Timer): Block | null {
  const id = crypto.randomUUID();
  if (timer.circuit) return null;
  if (timer.challenge) {
    return { id, type: "effort", name: timer.name, goal: timer.challenge.goal, limitSeconds: 0 };
  }
  return {
    id,
    type: "intervals",
    name: timer.name,
    steps: timer.steps.map((step) => ({ ...step, id: crypto.randomUUID() })),
    rounds: timer.rounds,
    cycles: timer.cycles,
    cycleRestSeconds: timer.cycleRestSeconds,
  };
}

/** A copy of a block, with new ids: a block of a circuit must not share them with another one. */
export function duplicateBlock(block: Block): Block {
  const copy = { ...block, id: crypto.randomUUID() };
  if (copy.type === "intervals") copy.steps = copy.steps.map((step) => ({ ...step, id: crypto.randomUUID() }));
  return copy;
}

function createCircuit(names: DefaultNames): Timer {
  return {
    ...createTimer({ name: names.circuit, color: "#FF8A00", prepare: 10, steps: [], rounds: 1, recovery: 60 }),
    circuit: {
      transitionSeconds: 30,
      blocks: [
        { ...createBlock("intervals", names), name: names.tabata },
        createEffort("shortest", names, 120),
        createEffort("longest", names),
      ],
    },
  };
}

export type TemplateId = "tabata" | "rounds" | "laps" | "challenge" | "circuit" | "blank";

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
    id: "challenge",
    badge: "★",
    create: (names) =>
      createTimer({
        name: names.challenge,
        color: "#9B5CFF",
        prepare: 10,
        steps: [],
        rounds: 1,
        challenge: "shortest",
      }),
  },
  {
    id: "circuit",
    badge: "◆",
    create: createCircuit,
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
