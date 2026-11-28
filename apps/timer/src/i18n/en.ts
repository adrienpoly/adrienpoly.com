import type {
  ChallengeGoal,
  DefaultNames,
  PhaseNames,
  TemplateId,
  TimerColorId,
  TimerOptions,
} from "../model/timer";

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
  challenge: "Challenge",
  classicTabata: "Classic Tabata",
  morningCore: "Morning core",
  boxing: "Boxing 3 rounds",
  trackIntervals: "Track intervals",
  circuit: "Circuit",
  intervals: "Intervals",
  pushUps: "10 push-ups",
  plank: "Plank",
};

const phases: PhaseNames = {
  prepare: "Prepare",
  cycleRest: "Rest between cycles",
  recovery: "Cool down",
  transition: "Transition",
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
  challenge: { name: "Challenge", description: "A stopwatch that keeps your results" },
  circuit: { name: "Circuit", description: "Intervals and timed efforts, one after the other" },
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
    challengeName: "Challenge name",
    challengeSection: "Challenge",
    deleteChallenge: "Delete challenge",
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

  challenge: {
    goal: "Goal",
    goals: {
      shortest: {
        label: "Fastest",
        hint: "The shortest time is the best. For example: 20 push-ups.",
      },
      longest: {
        label: "Longest",
        hint: "The longest time is the best. For example: hanging from a bar.",
      },
    } satisfies Record<ChallengeGoal, { label: string; hint: string }>,
    /** Under the name, on the card of a challenge. */
    summary: (goal: ChallengeGoal, results: number) =>
      results === 0
        ? `Challenge · ${goal === "shortest" ? "fastest" : "longest"} time`
        : `Best of ${plural(results, "attempt")}`,
    confirmDelete: (name: string) => `Delete “${name}” and its results?`,

    /** The page of a challenge. */
    back: "Back to timers",
    edit: "Edit the challenge",
    best: "Best",
    last: "Last",
    attempts: "Attempts",
    progress: "Progress",
    chartLabel: (results: number) => `Progress over ${plural(results, "result")}`,
    history: "History",
    add: "Add a result",
    empty: "No result yet. Start the challenge, or add a result by hand with the + button.",
    start: "Start",

    /** An attempt. */
    go: "Go!",
    finish: "Done",
    bestSoFar: (time: string) => `best ${time}`,
    /** Spoken. */
    sayGo: "Go",
    sayRecord: "New record",
    /** Under the "Voice announcements" option, in place of the phases of a timer. */
    voiceHint: "“Prepare”, “Go”, “New record”",

    /** The end of an attempt. */
    recordTitle: ["New", "record!"],
    time: "Time",
    first: "First result saved.",
    better: (gap: string, best: string) => `${gap} better than your previous best (${best}).`,
    equal: (best: string) => `Same as your best (${best}).`,
    worse: (gap: string, best: string) => `${gap} off your best (${best}).`,
    seeHistory: "See the history",
    discard: "Don’t keep this result",

    /** The sheet that adds or corrects a result. */
    newResult: "New result",
    correctResult: "Correct the result",
    date: "Date",
    deleteResult: "Delete the result",
  },

  circuit: {
    name: "Circuit name",
    blocks: "Blocks",
    reorderHint: "Drag the handle to reorder",
    addBlock: "Add a block",
    betweenBlocks: "Between blocks",
    transitionHint: "Time to get ready for the next block",
    timedTotal: "Timed part",
    plusEfforts: (count: number) => `+ ${plural(count, "timed effort")}`,
    deleteCircuit: "Delete circuit",
    confirmDelete: (name: string) => `Delete “${name}” and its records?`,
    /** Under the name, on the card of a circuit in the list. */
    badge: "Circuit",
    efforts: (count: number) => `+ ${plural(count, "effort")}`,

    /** What each kind of block is, on its card in the editor. */
    types: {
      intervals: "Intervals",
      rest: "Rest",
    },
    noLimit: "no limit",
    limitOf: (time: string) => `limit ${time}`,
    record: "record",

    /** The sheet that adds a block. */
    add: {
      title: "Add a block",
      intervals: { label: "Intervals", hint: "Tabata, rounds, laps: a set time" },
      shortest: { label: "Fastest", hint: "The stopwatch runs until “Done”. E.g. 10 push-ups" },
      longest: { label: "Longest", hint: "The stopwatch runs until “Let go”. E.g. plank" },
      rest: { label: "Rest", hint: "A pause of a set time" },
      copy: "Copy one of my timers",
      copyNote: "The block is a copy: changing the timer it comes from does not change the circuit.",
    },

    /** The editor of one block. */
    block: {
      name: "Block name",
      limit: "Time limit",
      limitHint: "The effort stops by itself after this time. 0:00: no limit",
      duration: "Duration",
      durationHint: "A pause before the next block",
      delete: "Delete block",
      confirmDelete: (name: string) => `Delete the block “${name}” and its records?`,
    },

    /** A session: the screen of an effort. */
    session: {
      block: "Block",
      record: "Record",
      limit: "Limit",
      finish: { shortest: "Done", longest: "Let go" } satisfies Record<ChallengeGoal, string>,
      /** Spoken. */
      sayEffort: (name: string, goal: ChallengeGoal) =>
        goal === "shortest" ? `${name}. As fast as you can` : `${name}. Hold as long as you can`,
    },

    /** The end of a circuit. */
    done: {
      title: ["Circuit", "complete!"],
      records: (count: number) => (count === 1 ? "Record" : "Records"),
      byBlock: "Block by block",
      completed: "Done",
      first: "First result",
      newRecord: (difference: string) => `Record! ${difference}`,
      reachedLimit: "Limit reached",
      skipped: "Skipped",
    },
  },

  settings: {
    title: "Settings",
    language: "Language",
    languageHint: "Texts and voice announcements",
    automatic: "Automatic",
    automaticHint: "The language of this device",
  },

  sounds: {
    title: "Sounds",
    hint: "Countdown, start of a phase, end of the session",
    events: {
      countdown: "3-2-1 countdown",
      phaseStart: "Start of a phase",
      finish: "End of the session",
    },
    variants: { classic: "Classic", soft: "Soft", bell: "Bell", arcade: "Arcade" },
    silentModeHint: "No sound? Turn off Silent Mode on your iPhone.",
    silentModeNote: "On iPhone and iPad, Silent Mode mutes the beeps and the voice.",
  },

  install: {
    title: "Install the app",
    pitch: "Full screen, works offline, on your Home Screen.",
    install: "Install",
    showSteps: "Show me how",
    hide: "Hide the invitation to install",
    steps: {
      ios: [
        "Tap the Share button of the browser. In Safari on a recent iPhone, it is in the ••• menu.",
        "Scroll down and tap “Add to Home Screen”.",
        "Tap “Add”.",
      ],
      macSafari: ["In the menu bar, open “File”.", "Choose “Add to Dock”.", "Click “Add”."],
      android: [
        "Open the menu of the browser (⋮).",
        "Tap “Install app” or “Add to Home screen”.",
        "Confirm with “Install”.",
      ],
      desktop: [
        "Click the install icon at the right of the address bar, or open the menu of the browser.",
        "Choose “Install Sport Timer”.",
        "Confirm with “Install”.",
      ],
    },
    notes: {
      ios: "No Share button? Open this page in Safari.",
      macSafari: "Needs macOS Sonoma or later.",
      android: "Nothing like it in the menu? Open this page in Chrome.",
      desktop: "Chrome and Edge can install apps. Firefox cannot.",
    },
    alreadyInstalled:
      "Already installed? Open it from its icon: a browser tab cannot switch to the app by itself.",
  },

  pwa: {
    offlineReady: "Ready to work offline.",
    updateAvailable: "A new version is available.",
    later: "Later",
    reload: "Reload",
  },
};

export type Messages = typeof en;
