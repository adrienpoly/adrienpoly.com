import { CheckIcon, RestartIcon } from "../components/icons";
import { useMessages } from "../i18n/useMessages";
import { formatGap, type HistoryEntry } from "../model/challenge";
import { formatDuration, type Timer } from "../model/timer";
import { formatFinishedAt } from "./DoneScreen";
import "./DoneScreen.css";

interface Props {
  timer: Timer;
  /** The result just saved, compared with the ones before it. */
  entry: HistoryEntry;
  /** The record after this result, in seconds. */
  best: number;
  attempts: number;
  onRestart: () => void;
  onHistory: () => void;
  /** Deletes the result: the attempt did not count. */
  onDiscard: () => void;
}

/** The end of an attempt: the time, and how it compares with the best one so far. */
export function ChallengeDoneScreen({
  timer,
  entry,
  best,
  attempts,
  onRestart,
  onHistory,
  onDiscard,
}: Props) {
  const t = useMessages();
  const { result, previousBest, difference, improved } = entry;
  const title = improved ? t.challenge.recordTitle : t.done.title;

  function comparison(): string {
    if (previousBest === null || difference === null) return t.challenge.first;
    const record = formatDuration(previousBest);
    if (difference === 0) return t.challenge.equal(record);
    return improved
      ? t.challenge.better(formatGap(difference), record)
      : t.challenge.worse(formatGap(difference), record);
  }

  return (
    <div className="done">
      <div className="done-heading">
        <div className="done-check">
          <CheckIcon />
        </div>
        <h1 className="display">
          {title[0]}
          <br />
          <span>{title[1]}</span>
        </h1>
        <p>
          {timer.name} · {formatFinishedAt(result.at, t.locale)}
        </p>
      </div>

      <div className="stats">
        <div>
          <span className="display is-highlight">{formatDuration(result.seconds)}</span>
          <span>{t.challenge.time}</span>
        </div>
        <div>
          <span className="display">{formatDuration(best)}</span>
          <span>{t.challenge.best}</span>
        </div>
        <div>
          <span className="display">{attempts}</span>
          <span>{t.challenge.attempts}</span>
        </div>
      </div>

      <p className="done-comparison">{comparison()}</p>

      <div className="done-actions">
        <button className="cta has-glow" onClick={onRestart}>
          <RestartIcon />
          {t.done.restart}
        </button>
        <button className="cta is-secondary" onClick={onHistory}>
          {t.challenge.seeHistory}
        </button>
        <button className="text-button done-discard" onClick={onDiscard}>
          {t.challenge.discard}
        </button>
      </div>
    </div>
  );
}
