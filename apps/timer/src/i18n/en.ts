import type { DefaultNames, PhaseNames, TemplateId, TimerColorId, TimerOptions } from "../model/timer";

// English is the reference: its shape is the `Messages` type that every other
// language must match (see fr.ts). Texts with a variable part are functions.

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const names: DefaultNames = {
  work: "Work",
  rest: "Rest",
  lap: "Lap",
  newStep: "New step",
  tabata: "Tabata",
  rounds: "Rounds",
  lapTimer: "Lap timer",
  newTimer: "New timer",
  classicTabata: "Classic Tabata",
  morningCore: "Morning core",
  boxing: "Boxing 3 rounds",
  trackIntervals: "Track intervals",
};

const phases: PhaseNames = {
  prepare: "Prepare",
  cycleRest: "Rest between cycles",
  recovery: "Cool down",
};

const colors: Record<TimerColorId, string> = {
  pink: "Pink",
  green: "Green",
  cyan: "Cyan",
  orange: "Orange",
  purple: "Purple",
};

const templates: Record<TemplateId, { name: string; description: string }> = {
  tabata: { name: "Tabata", description: "Work / rest × rounds × cycles" },
  rounds: { name: "Rounds", description: "Work + rest, repeated N times" },
  laps: { name: "Lap timer", description: "A beep on every lap" },
  blank: { name: "Blank", description: "Build your own steps" },
};

const options: Record<keyof TimerOptions, { label: string; hint: string }> = {
  countdown: { label: "3-2-1 countdown", hint: "Beeps on the last 3 seconds" },
  voice: { label: "Voice announcements", hint: "“Work”, “Rest”, “Last round”" },
  vibration: { label: "Vibration", hint: "On every phase change" },
  keepAwake: { label: "Keep the screen on", hint: "During the session" },
};

export const en = {
  /** Language of the page, and locale for dates. */
  locale: "en",
  /** Voice used for the announcements. */
  speechLang: "en-US",
  appName: "Sport Timer",

  /** Names stored in timers. See names.ts for how they follow the language. */
  names,
  phases,
  colors,

  common: {
    cancel: "Cancel",
    done: "Done",
    delete: "Delete",
  },

  counts: {
    rounds: (count: number) => plural(count, "round"),
    cycles: (count: number) => plural(count, "cycle"),
  },

  timers: {
    /** The big title: the second word is in the accent color. */
    title: ["My", "timers"],
    add: "New timer",
    settings: "Settings",
    empty: "No timers yet. Create the first one with the + button.",
    start: (name: string) => `Start ${name}`,
    delete: (name: string) => `Delete ${name}`,
    confirmDelete: (name: string) => `Delete “${name}”?`,
  },

  templates: {
    title: ["New", "timer"],
    intro: "Start from a template. Everything stays editable.",
    list: templates,
  },

  editor: {
    save: "Save",
    name: "Timer name",
    color: "Color",
    intervals: "Intervals",
    prepareHint: "Countdown before you start",
    workHint: "Effort",
    restHint: "Between two exercises",
    rounds: "Rounds",
    roundContents: (steps: string) => `1 round = ${steps}`,
    cycles: "Cycles",
    cycleContents: (rounds: number) => `1 cycle = ${plural(rounds, "round")}`,
    cycleRestHint: "Recovery between two cycles",
    recoveryHint: "After the workout",
    addStep: "Add a step",
    addStepExample: "(e.g. “Push-ups”)",
    optionsTitle: "Options",
    options,
    total: "Total time",
    saveAndStart: "Save and start",
    deleteTimer: "Delete timer",
    confirmDelete: (name: string) => `Delete “${name}”?`,
  },

  duration: {
    stepName: "Step name",
    minutes: "Minutes",
    seconds: "Seconds",
    shortcuts: "Shortcuts",
    confirm: "Confirm",
    deleteStep: "Delete step",
  },

  session: {
    stop: "Stop the session",
    confirmStop: "Stop the session?",
    keepGoing: "Keep going",
    stopAction: "Stop",
    remaining: (time: string) => `${time} left`,
    landscape: "Landscape view",
    portrait: "Portrait view",
    round: "Round",
    cycle: "Cycle",
    next: "Next:",
    finished: "finished",
    previousPhase: "Previous phase",
    nextPhase: "Next phase",
    pause: "Pause",
    resume: "Resume",
    /** Spoken. */
    sayLastRound: (phase: string) => `Last round. ${phase}`,
    sayFinished: "Finished",
  },

  done: {
    title: ["Well", "done!"],
    duration: "Time",
    rounds: "Rounds",
    cycles: "Cycles",
    split: "Breakdown",
    work: "Work",
    rest: "Rest",
    other: "Prepare / cool down",
    restart: "Go again",
    back: "Back to timers",
  },

  settings: {
    title: "Settings",
    language: "Language",
    languageHint: "Texts and voice announcements",
    automatic: "Automatic",
    automaticHint: "The language of this device",
  },

  pwa: {
    installHint: "To install the app: tap Share, then “Add to Home Screen”.",
    offlineReady: "Ready to work offline.",
    updateAvailable: "A new version is available.",
    later: "Later",
    reload: "Reload",
  },
};

export type Messages = typeof en;
