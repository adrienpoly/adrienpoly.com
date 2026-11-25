import type { CSSProperties } from "react";
import {
  IonContent,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonPage,
  useIonAlert,
} from "@ionic/react";
import { PlayIcon, PlusIcon, SettingsIcon, TrashIcon } from "../components/icons";
import { SequenceBar } from "../components/SequenceBar";
import { useMessages } from "../i18n/useMessages";
import { buildPhases, formatDuration, summarize, totalSeconds, type Timer } from "../model/timer";
import { InstallHint } from "../pwa/InstallHint";
import "./TimersScreen.css";

interface Props {
  timers: Timer[];
  onNew: () => void;
  onEdit: (timer: Timer) => void;
  onStart: (timer: Timer) => void;
  onDelete: (timer: Timer) => void;
  onSettings: () => void;
}

/**
 * Screen 1: the saved timers. Tap a name to edit, the round button to start,
 * slide a card to the left to delete it.
 */
export function TimersScreen({ timers, onNew, onEdit, onStart, onDelete, onSettings }: Props) {
  const [presentAlert] = useIonAlert();
  const t = useMessages();

  /** `sliding` is the card that was slid open, to close it again if the user cancels. */
  function confirmDelete(timer: Timer, sliding: HTMLIonItemSlidingElement | null) {
    void presentAlert({
      header: t.timers.confirmDelete(timer.name),
      buttons: [
        { text: t.common.cancel, role: "cancel" },
        { text: t.common.delete, role: "destructive", handler: () => onDelete(timer) },
      ],
      onDidDismiss: () => void sliding?.close(),
    });
  }

  return (
    <IonPage>
      <IonContent>
        <div className="timers">
          <header className="timers-top">
            <button className="timers-settings" aria-label={t.timers.settings} onClick={onSettings}>
              <SettingsIcon />
            </button>
          </header>

          <div className="timers-heading">
            <h1 className="display">
              {t.timers.title[0]} <span>{t.timers.title[1]}</span>
            </h1>
            {timers.length === 0 && <p>{t.timers.empty}</p>}
          </div>

          <ul className="timers-list">
            {timers.map((timer) => {
              const phases = buildPhases(timer, t.phases);
              return (
                <li
                  key={timer.id}
                  className="timer-card"
                  style={{ "--timer-color": timer.color } as CSSProperties}
                >
                  <IonItemSliding>
                    <IonItem lines="none">
                      <div className="timer-card-body">
                        <div className="timer-card-row">
                          <button className="timer-card-main" onClick={() => onEdit(timer)}>
                            <span className="timer-card-name">{timer.name}</span>
                            <span className="timer-card-summary">
                              {summarize(timer, t.counts.cycles)}
                            </span>
                          </button>
                          <span className="timer-card-total display">
                            {formatDuration(totalSeconds(phases))}
                          </span>
                          <button
                            className="timer-card-action"
                            aria-label={t.timers.start(timer.name)}
                            disabled={phases.length === 0}
                            onClick={() => onStart(timer)}
                          >
                            <PlayIcon />
                          </button>
                        </div>
                        <SequenceBar phases={phases} color={timer.color} />
                      </div>
                    </IonItem>
                    <IonItemOptions side="end">
                      <IonItemOption
                        className="timer-card-slide-delete"
                        aria-label={t.timers.delete(timer.name)}
                        onClick={(event) =>
                          confirmDelete(timer, event.currentTarget.closest("ion-item-sliding"))
                        }
                      >
                        <TrashIcon size={22} />
                        {t.common.delete}
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                </li>
              );
            })}
          </ul>

          <InstallHint />
        </div>

        {/* slot="fixed": stays in the corner of the screen while the list scrolls under it. */}
        <button slot="fixed" className="timers-add" aria-label={t.timers.add} onClick={onNew}>
          <PlusIcon size={26} />
        </button>
      </IonContent>
    </IonPage>
  );
}
