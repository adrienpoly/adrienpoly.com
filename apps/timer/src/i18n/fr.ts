import type { Messages } from "./en";

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

export const fr: Messages = {
  locale: "fr",
  speechLang: "fr-FR",
  appName: "Chrono sportif",

  names: {
    work: "Exercice",
    rest: "Repos",
    lap: "Tour",
    newStep: "Nouvelle étape",
    tabata: "Tabata",
    rounds: "Rounds",
    lapTimer: "Chronomètre à tours",
    newTimer: "Nouveau minuteur",
    challenge: "Défi",
    classicTabata: "Tabata classique",
    morningCore: "Gainage matin",
    boxing: "Boxe 3 rounds",
    trackIntervals: "Fractionné piste",
    circuit: "Circuit",
    intervals: "Intervalles",
    pushUps: "10 pompes",
    plank: "Planche",
  },

  phases: {
    prepare: "Préparer",
    cycleRest: "Repos entre cycles",
    recovery: "Récupération",
    transition: "Transition",
  },

  colors: {
    pink: "Rose",
    green: "Vert",
    cyan: "Cyan",
    orange: "Orange",
    purple: "Violet",
  },

  common: {
    cancel: "Annuler",
    done: "OK",
    delete: "Supprimer",
  },

  counts: {
    rounds: (count) => plural(count, "round"),
    cycles: (count) => plural(count, "cycle"),
  },

  timers: {
    title: ["Mes", "minuteurs"],
    add: "Nouveau minuteur",
    settings: "Réglages",
    empty: "Aucun minuteur. Crée le premier avec le bouton +.",
    start: (name) => `Lancer ${name}`,
    delete: (name) => `Supprimer ${name}`,
    confirmDelete: (name) => `Supprimer « ${name} » ?`,
  },

  templates: {
    title: ["Nouveau", "minuteur"],
    intro: "Pars d’un modèle, tout reste modifiable.",
    list: {
      tabata: { name: "Tabata", description: "Effort / repos × rounds × cycles" },
      rounds: { name: "Rounds", description: "Exercice + repos, répété N fois" },
      laps: { name: "Chronomètre à tours", description: "Un bip à chaque tour de temps" },
      challenge: { name: "Défi", description: "Un chronomètre qui garde tes résultats" },
      circuit: { name: "Circuit", description: "Des intervalles et des efforts chronométrés, à la suite" },
      blank: { name: "Vierge", description: "Compose tes propres étapes" },
    },
  },

  editor: {
    save: "Enregistrer",
    name: "Nom du minuteur",
    color: "Couleur",
    intervals: "Intervalles",
    prepareHint: "Compte à rebours avant de commencer",
    workHint: "Effort",
    restHint: "Entre deux exercices",
    rounds: "Rounds",
    roundContents: (steps) => `1 round = ${steps}`,
    cycles: "Cycles",
    cycleContents: (rounds) => `1 cycle = ${plural(rounds, "round")}`,
    cycleRestHint: "Récupération intermédiaire",
    recoveryHint: "Après l’entraînement",
    addStep: "Ajouter une étape",
    addStepExample: "(ex. « Pompes »)",
    optionsTitle: "Options",
    options: {
      countdown: { label: "Décompte 3-2-1", hint: "Bips sur les 3 dernières secondes" },
      voice: { label: "Annonce vocale", hint: "« Exercice », « Repos », « Dernier round »" },
      vibration: { label: "Vibrations", hint: "À chaque changement de phase" },
      keepAwake: { label: "Garder l’écran allumé", hint: "Pendant la séance" },
    },
    total: "Durée totale",
    saveAndStart: "Enregistrer et lancer",
    deleteTimer: "Supprimer le minuteur",
    confirmDelete: (name) => `Supprimer « ${name} » ?`,
    challengeName: "Nom du défi",
    challengeSection: "Défi",
    deleteChallenge: "Supprimer le défi",
  },

  duration: {
    stepName: "Nom de l’étape",
    minutes: "Minutes",
    seconds: "Secondes",
    shortcuts: "Raccourcis",
    confirm: "Valider",
    deleteStep: "Supprimer l’étape",
  },

  session: {
    stop: "Arrêter la séance",
    confirmStop: "Arrêter la séance ?",
    keepGoing: "Continuer",
    stopAction: "Arrêter",
    remaining: (time) => `reste ${time}`,
    landscape: "Vue paysage",
    portrait: "Vue portrait",
    round: "Round",
    cycle: "Cycle",
    next: "Ensuite :",
    finished: "terminé",
    previousPhase: "Phase précédente",
    nextPhase: "Phase suivante",
    pause: "Pause",
    resume: "Reprendre",
    sayLastRound: (phase) => `Dernier round. ${phase}`,
    sayFinished: "Terminé",
  },

  done: {
    title: ["Bien", "joué !"],
    duration: "Durée",
    rounds: "Rounds",
    cycles: "Cycles",
    split: "Répartition",
    work: "Exercice",
    rest: "Repos",
    other: "Préparation / récupération",
    restart: "Recommencer",
    back: "Retour aux minuteurs",
  },

  challenge: {
    goal: "Objectif",
    goals: {
      shortest: {
        label: "Le plus vite",
        hint: "Le temps le plus court est le meilleur. Par exemple : 20 pompes.",
      },
      longest: {
        label: "Le plus longtemps",
        hint: "Le temps le plus long est le meilleur. Par exemple : rester suspendu à une barre.",
      },
    },
    summary: (goal, results) =>
      results === 0
        ? `Défi · ${goal === "shortest" ? "le plus vite" : "le plus longtemps"}`
        : `Record sur ${plural(results, "essai")}`,
    confirmDelete: (name) => `Supprimer « ${name} » et ses résultats ?`,

    back: "Retour aux minuteurs",
    edit: "Modifier le défi",
    best: "Record",
    last: "Dernier",
    attempts: "Essais",
    progress: "Progression",
    chartLabel: (results) => `Progression sur ${plural(results, "résultat")}`,
    history: "Historique",
    add: "Ajouter un résultat",
    empty: "Aucun résultat. Lance le défi, ou ajoute un résultat à la main avec le bouton +.",
    start: "Démarrer",

    go: "Go !",
    finish: "Terminé",
    bestSoFar: (time) => `record ${time}`,
    sayGo: "C’est parti",
    sayRecord: "Nouveau record",
    voiceHint: "« Préparer », « C’est parti », « Nouveau record »",

    recordTitle: ["Nouveau", "record !"],
    time: "Temps",
    first: "Premier résultat enregistré.",
    better: (gap, best) => `${gap} de mieux que ton ancien record (${best}).`,
    equal: (best) => `Record égalé (${best}).`,
    worse: (gap, best) => `À ${gap} de ton record (${best}).`,
    seeHistory: "Voir l’historique",
    discard: "Ne pas garder ce résultat",

    newResult: "Nouveau résultat",
    correctResult: "Corriger le résultat",
    date: "Date",
    deleteResult: "Supprimer le résultat",
  },

  circuit: {
    name: "Nom du circuit",
    blocks: "Blocs",
    reorderHint: "Glisse la poignée pour réordonner",
    addBlock: "Ajouter un bloc",
    betweenBlocks: "Entre les blocs",
    transitionHint: "Le temps de se mettre en place pour le bloc suivant",
    timedTotal: "Durée minutée",
    plusEfforts: (count) => `+ ${plural(count, "effort")} chronométré${count > 1 ? "s" : ""}`,
    deleteCircuit: "Supprimer le circuit",
    confirmDelete: (name) => `Supprimer « ${name} » et ses records ?`,
    badge: "Circuit",
    efforts: (count) => `+ ${plural(count, "effort")}`,

    types: {
      intervals: "Intervalles",
      rest: "Repos",
    },
    noLimit: "sans limite",
    limitOf: (time) => `limite ${time}`,
    record: "record",

    add: {
      title: "Ajouter un bloc",
      intervals: { label: "Intervalles", hint: "Tabata, rounds, tours : un temps fixe" },
      shortest: { label: "Le plus vite", hint: "Le chrono monte jusqu’à « Fini ». Ex. 10 pompes" },
      longest: { label: "Le plus longtemps", hint: "Le chrono monte jusqu’à « Lâché ». Ex. planche" },
      rest: { label: "Repos", hint: "Une pause d’une durée fixe" },
      copy: "Copier un de mes minuteurs",
      copyNote: "Le bloc est une copie : modifier le minuteur d’origine ne change pas le circuit.",
    },

    block: {
      name: "Nom du bloc",
      limit: "Temps limite",
      limitHint: "L’effort s’arrête tout seul après ce temps. 0:00 : sans limite",
      duration: "Durée",
      durationHint: "Une pause avant le bloc suivant",
      delete: "Supprimer le bloc",
      confirmDelete: (name) => `Supprimer le bloc « ${name} » et ses records ?`,
    },

    session: {
      block: "Bloc",
      record: "Record",
      limit: "Limite",
      finish: { shortest: "Fini", longest: "Lâché" },
      sayEffort: (name, goal) =>
        goal === "shortest" ? `${name}. Le plus vite possible` : `${name}. Tiens le plus longtemps possible`,
    },

    done: {
      title: ["Circuit", "bouclé !"],
      records: (count) => (count > 1 ? "Records" : "Record"),
      byBlock: "Bloc par bloc",
      completed: "Terminé",
      first: "Premier résultat",
      newRecord: (difference) => `Record ! ${difference}`,
      reachedLimit: "Limite atteinte",
      skipped: "Passé",
    },
  },

  settings: {
    title: "Réglages",
    language: "Langue",
    languageHint: "Textes et annonces vocales",
    automatic: "Automatique",
    automaticHint: "La langue de cet appareil",
  },

  sounds: {
    title: "Sons",
    hint: "Décompte, début de phase, fin de séance",
    events: {
      countdown: "Décompte 3-2-1",
      phaseStart: "Début de phase",
      finish: "Fin de séance",
    },
    variants: { classic: "Classique", soft: "Doux", bell: "Cloche", arcade: "Arcade" },
    silentModeHint: "Pas de son ? Désactive le mode silencieux de l’iPhone.",
    silentModeNote: "Sur iPhone et iPad, le mode silencieux coupe les bips et la voix.",
  },

  install: {
    title: "Installer l’app",
    pitch: "Plein écran, utilisable hors ligne, sur ton écran d’accueil.",
    install: "Installer",
    showSteps: "Voir comment faire",
    hide: "Masquer l’invitation à installer",
    steps: {
      ios: [
        "Touche le bouton Partager du navigateur. Dans Safari sur un iPhone récent, il est dans le menu •••.",
        "Fais défiler et touche « Sur l’écran d’accueil ».",
        "Touche « Ajouter ».",
      ],
      macSafari: [
        "Dans la barre des menus, ouvre « Fichier ».",
        "Choisis « Ajouter au Dock ».",
        "Clique sur « Ajouter ».",
      ],
      android: [
        "Ouvre le menu du navigateur (⋮).",
        "Touche « Installer l’application » ou « Ajouter à l’écran d’accueil ».",
        "Confirme avec « Installer ».",
      ],
      desktop: [
        "Clique sur l’icône d’installation à droite de la barre d’adresse, ou ouvre le menu du navigateur.",
        "Choisis « Installer Sport Timer ».",
        "Confirme avec « Installer ».",
      ],
    },
    notes: {
      ios: "Pas de bouton Partager ? Ouvre cette page dans Safari.",
      macSafari: "Demande macOS Sonoma ou plus récent.",
      android: "Rien de tel dans le menu ? Ouvre cette page dans Chrome.",
      desktop: "Chrome et Edge peuvent installer des apps. Firefox ne le peut pas.",
    },
    alreadyInstalled:
      "Déjà installée ? Ouvre-la depuis son icône : un onglet du navigateur ne peut pas basculer tout seul vers l’app.",
  },

  pwa: {
    offlineReady: "Prêt à fonctionner hors ligne.",
    updateAvailable: "Une nouvelle version est disponible.",
    later: "Plus tard",
    reload: "Recharger",
  },
};
