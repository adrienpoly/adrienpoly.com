import { useState, type CSSProperties } from "react";
import { IonItem, IonItemOption, IonItemOptions, IonItemSliding } from "@ionic/react";
import { BackIcon, EditIcon, PlayIcon, PlusIcon, TrashIcon } from "../components/icons";
import { ResultsChart } from "../components/ResultsChart";
import { formatDay } from "../i18n/dates";
import { useMessages } from "../i18n/useMessages";
import {
  createResult,
  formatDifference,
  history,
  type HistoryEntry,
  type Result,
} from "../model/challenge";
import { formatDuration, type ChallengeGoal, type Timer } from "../model/timer";
import { ResultSheet } from "./ResultSheet";
import "./ChallengeScreen.css";

interface Props {
  timer: Timer;
  goal: ChallengeGoal;
  results: Result[];
  onBack: () => void;
  onEdit: () => void;
  onStart: () => void;
  /** Adds the result, or replaces the one with the same id. */
  onSaveResult: (result: Result) => void;
  onDeleteResult: (result: Result) => void;
}

/**
 * The page of a challenge: the record, the progress over time and every
 * result. Tap a result to correct it, slide it to the left to delete it, add
 * one by hand with the + button.
 */
export function ChallengeScreen({
  timer,
  goal,
  results,
  onBack,
  onEdit,
  onStart,
  onSaveResult,
  onDeleteResult,
}: Props) {
  const t = useMessages();
  // The sheet keeps its result while it animates out, so its content stays visible.
  const [draft, setDraft] = useState<Result | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const entries = history(results, goal);
  const best = entries.find((entry) => entry.isBest);
  const isSaved = draft !== null && results.some((result) => result.id === draft.id);
  const day = (timestamp: number) => formatDay(timestamp, t.locale);

  function open(result: Result) {
    setDraft(result);
    setSheetOpen(true);
  }

  /** A new result starts from the latest time: the next one is rarely far from it. */
  const add = () => open(createResult(entries[0]?.result.seconds ?? 60, Date.now()));

  return (
    <div className="challenge" style={{ "--timer-color": timer.color } as CSSProperties}>
      <div className="challenge-scroll">
        <header className="challenge-top">
          <button className="challenge-round" aria-label={t.challenge.back} onClick={onBack}>
            <BackIcon />
          </button>
          <button className="challenge-round" aria-label={t.challenge.edit} onClick={onEdit}>
            <EditIcon />
          </button>
        </header>

        <div className="challenge-heading">
          <h1 className="display">{timer.name}</h1>
          <p>{t.challenge.goals[goal].label}</p>
        </div>

        {best && (
          <div className="stats">
            <div>
              <span className="display is-highlight">{formatDuration(best.result.seconds)}</span>
              <span>{t.challenge.best}</span>
            </div>
            <div>
              <span className="display">{formatDuration(entries[0].result.seconds)}</span>
              <span>{t.challenge.last}</span>
            </div>
            <div>
              <span className="display">{entries.length}</span>
              <span>{t.challenge.attempts}</span>
            </div>
          </div>
        )}

        {entries.length > 1 && (
          <section className="challenge-panel">
            <h2 className="display">{t.challenge.progress}</h2>
            <ResultsChart
              results={entries.map((entry) => entry.result).reverse()}
              label={t.challenge.chartLabel(entries.length)}
              formatDate={day}
            />
          </section>
        )}

        <section className="challenge-history">
          <div className="challenge-history-top">
            <h2 className="display">{t.challenge.history}</h2>
            <button aria-label={t.challenge.add} onClick={add}>
              <PlusIcon size={20} />
            </button>
          </div>

          {entries.length === 0 ? (
            <p className="challenge-empty">{t.challenge.empty}</p>
          ) : (
            <ul className="challenge-results">
              {entries.map((entry) => (
                <ResultRow
                  key={entry.result.id}
                  entry={entry}
                  date={day(entry.result.at)}
                  onOpen={() => open(entry.result)}
                  onDelete={() => onDeleteResult(entry.result)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="challenge-footer">
        <button className="cta has-glow" onClick={onStart}>
          <PlayIcon size={18} />
          {t.challenge.start}
        </button>
      </div>

      <ResultSheet
        isOpen={sheetOpen}
        result={draft}
        isNew={!isSaved}
        onSave={onSaveResult}
        onDelete={onDeleteResult}
        onClose={() => setSheetOpen(false)}
        onDismissed={() => {
          setSheetOpen(false);
          setDraft(null);
        }}
      />
    </div>
  );
}

interface RowProps {
  entry: HistoryEntry;
  date: string;
  onOpen: () => void;
  onDelete: () => void;
}

function ResultRow({ entry, date, onOpen, onDelete }: RowProps) {
  const t = useMessages();
  return (
    <li>
      <IonItemSliding>
        <IonItem lines="none">
          <button className="challenge-result" onClick={onOpen}>
            <span className="challenge-result-date">{date}</span>
            {entry.isBest && <span className="challenge-result-best">{t.challenge.best}</span>}
            {entry.difference !== null && (
              <span
                className={
                  entry.improved ? "challenge-result-difference is-better" : "challenge-result-difference"
                }
              >
                {formatDifference(entry.difference)}
              </span>
            )}
            <span className="challenge-result-time display">{formatDuration(entry.result.seconds)}</span>
          </button>
        </IonItem>
        <IonItemOptions side="end">
          <IonItemOption className="timer-card-slide-delete" onClick={onDelete}>
            <TrashIcon size={22} />
            {t.common.delete}
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>
    </li>
  );
}
