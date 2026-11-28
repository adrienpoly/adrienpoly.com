import type { CSSProperties, ReactNode } from "react";
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
import { Sparkline } from "../components/ResultsChart";
import { SequenceBar } from "../components/SequenceBar";
import { useMessages } from "../i18n/useMessages";
import { bestResult, oldestFirst, type ResultsByTimer } from "../model/challenge";
import {
  buildPhases,
  canStart,
  effortCount,
  formatDuration,
  summarize,
  totalSeconds,
  type Timer,
} from "../model/timer";
import "./TimersScreen.css";

interface Props {
  timers: Timer[];
  /** The results of the challenges, by timer id. */
  results: ResultsByTimer;
  onNew: () => void;
  /** A tap on the name: the editor for a timer, its page for a challenge. */
  onOpen: (timer: Timer) => void;
  onStart: (timer: Timer) => void;
  onDelete: (timer: Timer) => void;
  onSettings: () => void;
  /** Shown between the title and the list: the invitation to install the app. */
  notice?: ReactNode;
}

/** Shown in place of the best time of a challenge that has no result yet. */
const NO_RESULT = "–:––";

/**
 * Screen 1: the saved timers. Tap a name to edit, the round button to start,
 * slide a card to the left to delete it. A challenge shows its best result
 * where a timer shows its length, and its latest results as a curve. A
 * circuit shows the length of its timed part and the number of its efforts.
 */
export function TimersScreen({
  timers,
  results,
  onNew,
  onOpen,
  onStart,
  onDelete,
  onSettings,
  notice,
}: Props) {
  const [presentAlert] = useIonAlert();
  const t = useMessages();

  /** `sliding` is the card that was slid open, to close it again if the user cancels. */
  function confirmDelete(timer: Timer, sliding: HTMLIonItemSlidingElement | null) {
    void presentAlert({
      header: timer.challenge
        ? t.challenge.confirmDelete(timer.name)
        : timer.circuit
          ? t.circuit.confirmDelete(timer.name)
          : t.timers.confirmDelete(timer.name),
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

          {notice}

          <ul className="timers-list">
            {timers.map((timer) => {
              const phases = buildPhases(timer, t.phases);
              const goal = timer.challenge?.goal;
              const attempts = oldestFirst(results[timer.id] ?? []);
              const best = goal && bestResult(attempts, goal);
              const efforts = effortCount(phases);
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
                          <button className="timer-card-main" onClick={() => onOpen(timer)}>
                            <span className="timer-card-name">
                              {timer.name}
                              {timer.circuit && <span className="timer-card-badge">{t.circuit.badge}</span>}
                            </span>
                            <span className="timer-card-summary">
                              {goal
                                ? t.challenge.summary(goal, attempts.length)
                                : summarize(timer, t.counts.cycles)}
                            </span>
                          </button>
                          <span className="timer-card-total display">
                            {goal
                              ? best
                                ? formatDuration(best.seconds)
                                : NO_RESULT
                              : formatDuration(totalSeconds(phases))}
                            {efforts > 0 && <span className="timer-card-efforts">{t.circuit.efforts(efforts)}</span>}
                          </span>
                          <button
                            className="timer-card-action"
                            aria-label={t.timers.start(timer.name)}
                            disabled={!canStart(timer, phases)}
                            onClick={() => onStart(timer)}
                          >
                            <PlayIcon />
                          </button>
                        </div>
                        {goal ? (
                          attempts.length > 1 && <Sparkline results={attempts} />
                        ) : (
                          <SequenceBar phases={phases} color={timer.color} />
                        )}
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
        </div>

        {/* slot="fixed": stays in the corner of the screen while the list scrolls under it. */}
        <button slot="fixed" className="timers-add" aria-label={t.timers.add} onClick={onNew}>
          <PlusIcon size={26} />
        </button>
      </IonContent>
    </IonPage>
  );
}
