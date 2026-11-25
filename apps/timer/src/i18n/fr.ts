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
    classicTabata: "Tabata classique",
    morningCore: "Gainage matin",
    boxing: "Boxe 3 rounds",
    trackIntervals: "Fractionné piste",
  },

  phases: {
    prepare: "Préparer",
    cycleRest: "Repos entre cycles",
    recovery: "Récupération",
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
