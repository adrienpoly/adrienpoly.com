import { useCallback, useEffect, useState } from "react";
import { IonApp, IonToast } from "@ionic/react";
import { MESSAGES, resolveLanguage } from "./i18n/language";
import { MessagesContext } from "./i18n/useMessages";
import { bestResult, createResult, history, type HistoryEntry } from "./model/challenge";
import { effortBlocks, removedEfforts } from "./model/circuit";
import type { Timer } from "./model/timer";
import { unlockCues } from "./platform/cues";
import { useSilentModeHint } from "./platform/useSilentModeHint";
import { InstallCard } from "./pwa/InstallCard";
import { InstallSheet } from "./pwa/InstallSheet";
import { UpdatePrompt } from "./pwa/UpdatePrompt";
import { useInstall } from "./pwa/useInstall";
import { ChallengeDoneScreen } from "./screens/ChallengeDoneScreen";
import { ChallengeScreen } from "./screens/ChallengeScreen";
import { ChallengeSession } from "./screens/ChallengeSession";
import { CircuitDoneScreen } from "./screens/CircuitDoneScreen";
import { DoneScreen } from "./screens/DoneScreen";
import { EditorScreen } from "./screens/EditorScreen";
import { SessionScreen, type SessionResult } from "./screens/SessionScreen";
import { SettingsSheet } from "./screens/SettingsSheet";
import { SoundsSheet } from "./screens/SoundsSheet";
import { TemplatesSheet } from "./screens/TemplatesSheet";
import { TimersScreen } from "./screens/TimersScreen";
import { useLanguageSetting } from "./storage/useLanguageSetting";
import { useResults } from "./storage/useResults";
import { useSoundChoice } from "./storage/useSoundChoice";
import { useTimers } from "./storage/useTimers";

/** What fills the screen. The template sheet and the editor open on top of the list. */
type Screen =
  | { name: "timers" }
  // `run` changes on every start, so restarting the same timer gives a fresh session.
  | { name: "session"; timer: Timer; run: number }
  | { name: "done"; result: SessionResult }
  // The end of a circuit: the results of its efforts are already saved, by block id.
  | { name: "circuitDone"; result: SessionResult; resultIds: Record<string, string> }
  // The end of an attempt at a challenge: the result is already saved.
  | { name: "attemptDone"; timerId: string; resultId: string };

export function App() {
  const { setting, choose } = useLanguageSetting();
  // Until the setting has been read (a few milliseconds), nothing is drawn.
  const language = resolveLanguage(setting ?? "auto", navigator.languages);
  const messages = MESSAGES[language];
  const { timers, save, remove } = useTimers(language);
  const {
    results,
    save: saveResult,
    saveAll: saveResults,
    remove: removeResult,
    removeAll: removeResults,
  } = useResults();
  const [screen, setScreen] = useState<Screen>({ name: "timers" });
  // The challenge whose page is open, between the list and a session: an
  // attempt started from the page comes back to it.
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const install = useInstall();
  const [installOpen, setInstallOpen] = useState(false);
  const silentModeHint = useSilentModeHint();
  const { sounds, choose: chooseSound } = useSoundChoice();
  const [soundsOpen, setSoundsOpen] = useState(false);
  // The draft stays set while the editor animates out, so its content stays visible.
  const [draft, setDraft] = useState<Timer | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  function edit(timer: Timer) {
    setDraft(timer);
    setEditorOpen(true);
  }

  /** A challenge goes with its results, a circuit with the results of its efforts. */
  function removeTimer(timer: Timer) {
    remove(timer.id);
    if (timer.challenge) removeResults(timer.id);
    removeResults(...effortBlocks(timer).map((block) => block.id));
    if (timer.id === challengeId) setChallengeId(null);
  }

  /** The results of the efforts that a circuit no longer has go too. */
  function saveTimer(timer: Timer) {
    removeResults(...removedEfforts(timers?.find((candidate) => candidate.id === timer.id), timer));
    save(timer);
  }

  function showChallenge(timerId: string) {
    setChallengeId(timerId);
    setScreen({ name: "timers" });
  }

  /** The browser's own install dialog where there is one (it needs a tap), the steps otherwise. */
  function startInstall() {
    const showSteps = () => setInstallOpen(true);
    if (install.canPrompt) install.prompt(showSteps);
    else showSteps();
  }

  /** Must be called from a tap: that is what allows sound and speech to play. */
  function start(timer: Timer) {
    unlockCues();
    setScreen({ name: "session", timer, run: Date.now() });
    silentModeHint.showOnce();
  }

  /** The end of a session. The efforts of a circuit that count are kept as results. */
  const showResult = useCallback(
    (result: SessionResult) => {
      if (!result.timer.circuit) {
        setScreen({ name: "done", result });
        return;
      }
      const saved = result.efforts.flatMap(({ block, seconds, counts }) =>
        counts && seconds !== null ? [{ timerId: block.id, result: createResult(seconds, result.finishedAt) }] : [],
      );
      saveResults(saved);
      const resultIds = Object.fromEntries(saved.map((entry) => [entry.timerId, entry.result.id]));
      setScreen({ name: "circuitDone", result, resultIds });
    },
    [saveResults],
  );

  useEffect(() => {
    document.documentElement.lang = messages.locale;
    document.title = messages.appName;
  }, [messages]);

  // Nothing to draw until the timers, the results and the language have been read from storage.
  // <IonApp> must be the root here and below, so that React keeps the same
  // <ion-app> element: Ionic's modals look it up once, when they are created.
  if (timers === null || results === null || setting === null) return <IonApp />;

  const draftIsSaved = draft !== null && timers.some((timer) => timer.id === draft.id);
  const resultsOf = (timer: Timer) => results[timer.id] ?? [];
  /** The record of each effort of a circuit, in seconds, by block id. */
  const recordsOf = (timer: Timer) =>
    Object.fromEntries(
      effortBlocks(timer).flatMap((block) => {
        const best = bestResult(results[block.id] ?? [], block.goal);
        return best ? [[block.id, best.seconds]] : [];
      }),
    );
  const challenge = timers.find((timer) => timer.id === challengeId);
  const attempted =
    screen.name === "attemptDone" ? timers.find((timer) => timer.id === screen.timerId) : undefined;

  return (
    <IonApp>
      <MessagesContext.Provider value={messages}>
        <TimersScreen
          timers={timers}
          results={results}
          onNew={() => setTemplatesOpen(true)}
          onOpen={(timer) => (timer.challenge ? showChallenge(timer.id) : edit(timer))}
          onStart={start}
          onDelete={removeTimer}
          onSettings={() => setSettingsOpen(true)}
          notice={
            install.showCard && (
              <InstallCard
                canPrompt={install.canPrompt}
                onInstall={startInstall}
                onHide={install.hideCard}
              />
            )
          }
        />

        {screen.name === "timers" && challenge?.challenge && (
          <ChallengeScreen
            timer={challenge}
            goal={challenge.challenge.goal}
            results={resultsOf(challenge)}
            onBack={() => setChallengeId(null)}
            onEdit={() => edit(challenge)}
            onStart={() => start(challenge)}
            onSaveResult={(result) => saveResult(challenge.id, result)}
            onDeleteResult={(result) => removeResult(challenge.id, result.id)}
          />
        )}

        <SettingsSheet
          isOpen={settingsOpen}
          language={setting}
          onChange={choose}
          onSounds={() => {
            setSettingsOpen(false);
            setSoundsOpen(true);
          }}
          onInstall={
            install.available
              ? () => {
                  setSettingsOpen(false);
                  startInstall();
                }
              : undefined
          }
          onClose={() => setSettingsOpen(false)}
        />

        <SoundsSheet
          isOpen={soundsOpen}
          sounds={sounds}
          onChange={chooseSound}
          onClose={() => setSoundsOpen(false)}
        />

        <InstallSheet
          isOpen={installOpen}
          guide={install.guide}
          onClose={() => setInstallOpen(false)}
        />

        <TemplatesSheet
          isOpen={templatesOpen}
          onClose={() => setTemplatesOpen(false)}
          onPick={(timer) => {
            setTemplatesOpen(false);
            edit(timer);
          }}
        />

        <EditorScreen
          isOpen={editorOpen}
          timer={draft}
          timers={timers}
          results={results}
          onCancel={() => setEditorOpen(false)}
          onSave={(timer) => {
            saveTimer(timer);
            setEditorOpen(false);
          }}
          onSaveAndStart={(timer) => {
            saveTimer(timer);
            setEditorOpen(false);
            start(timer);
          }}
          onDelete={
            draftIsSaved
              ? (timer) => {
                  removeTimer(timer);
                  setEditorOpen(false);
                }
              : undefined
          }
          onDismissed={() => {
            setEditorOpen(false);
            setDraft(null);
          }}
        />

        {screen.name === "session" && !screen.timer.challenge && (
          <SessionScreen
            key={screen.run}
            timer={screen.timer}
            records={recordsOf(screen.timer)}
            sounds={sounds}
            onStop={() => setScreen({ name: "timers" })}
            onFinish={showResult}
          />
        )}

        {screen.name === "session" && screen.timer.challenge && (
          <ChallengeSession
            key={screen.run}
            timer={screen.timer}
            goal={screen.timer.challenge.goal}
            best={bestResult(resultsOf(screen.timer), screen.timer.challenge.goal)?.seconds}
            sounds={sounds}
            onStop={() => setScreen({ name: "timers" })}
            onFinish={(seconds) => {
              const result = createResult(seconds, Date.now());
              saveResult(screen.timer.id, result);
              setScreen({ name: "attemptDone", timerId: screen.timer.id, resultId: result.id });
            }}
          />
        )}

        {screen.name === "attemptDone" && attempted?.challenge && (
          <AttemptDone
            timer={attempted}
            entries={history(resultsOf(attempted), attempted.challenge.goal)}
            resultId={screen.resultId}
            onRestart={() => start(attempted)}
            onHistory={() => showChallenge(attempted.id)}
            onDiscard={() => {
              removeResult(attempted.id, screen.resultId);
              showChallenge(attempted.id);
            }}
          />
        )}

        {screen.name === "circuitDone" && (
          <CircuitDoneScreen
            result={screen.result}
            results={results}
            resultIds={screen.resultIds}
            onRestart={() => start(screen.result.timer)}
            onBack={() => setScreen({ name: "timers" })}
          />
        )}

        {screen.name === "done" && (
          <DoneScreen
            result={screen.result}
            onRestart={() => start(screen.result.timer)}
            onBack={() => setScreen({ name: "timers" })}
          />
        )}

        <IonToast
          isOpen={silentModeHint.isOpen}
          position="top"
          message={messages.sounds.silentModeHint}
          duration={8000}
          buttons={[{ text: messages.common.done, role: "cancel" }]}
          onDidDismiss={silentModeHint.close}
        />

        <UpdatePrompt />
      </MessagesContext.Provider>
    </IonApp>
  );
}

interface AttemptDoneProps {
  timer: Timer;
  /** The history of the challenge, which holds the result just saved. */
  entries: HistoryEntry[];
  resultId: string;
  onRestart: () => void;
  onHistory: () => void;
  onDiscard: () => void;
}

/** Finds the result of the attempt in the history and shows how it compares. */
function AttemptDone({ timer, entries, resultId, ...actions }: AttemptDoneProps) {
  const entry = entries.find((candidate) => candidate.result.id === resultId);
  const best = entries.find((candidate) => candidate.isBest);
  if (!entry || !best) return null;

  return (
    <ChallengeDoneScreen
      timer={timer}
      entry={entry}
      best={best.result.seconds}
      attempts={entries.length}
      {...actions}
    />
  );
}
