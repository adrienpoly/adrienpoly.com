import { useCallback, useEffect, useState } from "react";
import { IonApp } from "@ionic/react";
import { MESSAGES, resolveLanguage } from "./i18n/language";
import { MessagesContext } from "./i18n/useMessages";
import type { Timer } from "./model/timer";
import { unlockCues } from "./platform/cues";
import { InstallCard } from "./pwa/InstallCard";
import { InstallSheet } from "./pwa/InstallSheet";
import { UpdatePrompt } from "./pwa/UpdatePrompt";
import { useInstall } from "./pwa/useInstall";
import { DoneScreen } from "./screens/DoneScreen";
import { EditorScreen } from "./screens/EditorScreen";
import { SessionScreen, type SessionResult } from "./screens/SessionScreen";
import { SettingsSheet } from "./screens/SettingsSheet";
import { TemplatesSheet } from "./screens/TemplatesSheet";
import { TimersScreen } from "./screens/TimersScreen";
import { useLanguageSetting } from "./storage/useLanguageSetting";
import { useTimers } from "./storage/useTimers";

/** What fills the screen. The template sheet and the editor open on top of the list. */
type Screen =
  | { name: "timers" }
  // `run` changes on every start, so restarting the same timer gives a fresh session.
  | { name: "session"; timer: Timer; run: number }
  | { name: "done"; result: SessionResult };

export function App() {
  const { setting, choose } = useLanguageSetting();
  // Until the setting has been read (a few milliseconds), nothing is drawn.
  const language = resolveLanguage(setting ?? "auto", navigator.languages);
  const messages = MESSAGES[language];
  const { timers, save, remove } = useTimers(language);
  const [screen, setScreen] = useState<Screen>({ name: "timers" });
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const install = useInstall();
  const [installOpen, setInstallOpen] = useState(false);
  // The draft stays set while the editor animates out, so its content stays visible.
  const [draft, setDraft] = useState<Timer | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  function edit(timer: Timer) {
    setDraft(timer);
    setEditorOpen(true);
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
  }

  const showResult = useCallback((result: SessionResult) => setScreen({ name: "done", result }), []);

  useEffect(() => {
    document.documentElement.lang = messages.locale;
    document.title = messages.appName;
  }, [messages]);

  // Nothing to draw until the timers and the language have been read from storage.
  // <IonApp> must be the root here and below, so that React keeps the same
  // <ion-app> element: Ionic's modals look it up once, when they are created.
  if (timers === null || setting === null) return <IonApp />;

  const draftIsSaved = draft !== null && timers.some((timer) => timer.id === draft.id);

  return (
    <IonApp>
      <MessagesContext.Provider value={messages}>
        <TimersScreen
          timers={timers}
          onNew={() => setTemplatesOpen(true)}
          onEdit={edit}
          onStart={start}
          onDelete={(timer) => remove(timer.id)}
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

        <SettingsSheet
          isOpen={settingsOpen}
          language={setting}
          onChange={choose}
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
          onCancel={() => setEditorOpen(false)}
          onSave={(timer) => {
            save(timer);
            setEditorOpen(false);
          }}
          onSaveAndStart={(timer) => {
            save(timer);
            setEditorOpen(false);
            start(timer);
          }}
          onDelete={
            draftIsSaved
              ? (timer) => {
                  remove(timer.id);
                  setEditorOpen(false);
                }
              : undefined
          }
          onDismissed={() => {
            setEditorOpen(false);
            setDraft(null);
          }}
        />

        {screen.name === "session" && (
          <SessionScreen
            key={screen.run}
            timer={screen.timer}
            onStop={() => setScreen({ name: "timers" })}
            onFinish={showResult}
          />
        )}

        {screen.name === "done" && (
          <DoneScreen
            result={screen.result}
            onRestart={() => start(screen.result.timer)}
            onBack={() => setScreen({ name: "timers" })}
          />
        )}

        <UpdatePrompt />
      </MessagesContext.Provider>
    </IonApp>
  );
}
