import { CheckIcon, RestartIcon } from "../components/icons";
import { useMessages } from "../i18n/useMessages";
import { formatDuration, PHASE_COLORS } from "../model/timer";
import type { SessionResult } from "./SessionScreen";
import "./DoneScreen.css";

interface Props {
  result: SessionResult;
  onRestart: () => void;
  onBack: () => void;
}

/** "Tuesday, Nov 24, 07:12 AM" or "mardi 24 nov., 07:12", depending on the locale. */
function formatFinishedAt(timestamp: number, locale: string): string {
  const date = new Date(timestamp);
  const day = date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" });
  const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
}

/** Screen 6: the summary shown when a session ends. */
export function DoneScreen({ result, onRestart, onBack }: Props) {
  const t = useMessages();
  const { timer, spentMs } = result;
  const seconds = (milliseconds: number) => Math.round(milliseconds / 1000);

  const split = [
    { label: t.done.work, seconds: seconds(spentMs.work), color: PHASE_COLORS.work },
    { label: t.done.rest, seconds: seconds(spentMs.rest), color: PHASE_COLORS.rest },
    {
      label: t.done.other,
      seconds: seconds(spentMs.prepare + spentMs.recovery),
      color: PHASE_COLORS.prepare,
    },
  ];
  const total = split.reduce((sum, part) => sum + part.seconds, 0);

  const stats = [
    { label: t.done.duration, value: formatDuration(total), highlight: true },
    { label: t.done.rounds, value: String(timer.rounds * timer.cycles) },
    { label: t.done.cycles, value: String(timer.cycles) },
  ];

  return (
    <div className="done">
      <div className="done-heading">
        <div className="done-check">
          <CheckIcon />
        </div>
        <h1 className="display">
          {t.done.title[0]}
          <br />
          <span>{t.done.title[1]}</span>
        </h1>
        <p>
          {timer.name} · {formatFinishedAt(result.finishedAt, t.locale)}
        </p>
      </div>

      <div className="done-stats">
        {stats.map((stat) => (
          <div key={stat.label}>
            <span className={stat.highlight ? "display is-highlight" : "display"}>{stat.value}</span>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="done-split">
        <h2 className="display">{t.done.split}</h2>
        <div className="done-split-bar" aria-hidden="true">
          {split.map((part) => (
            <span key={part.label} style={{ flexGrow: part.seconds, background: part.color }} />
          ))}
        </div>
        {split.map((part) => (
          <div key={part.label} className="done-split-row">
            <span style={{ background: part.color }} />
            <span>{part.label}</span>
            <span className="display">{formatDuration(part.seconds)}</span>
          </div>
        ))}
      </div>

      <div className="done-actions">
        <button className="cta has-glow" onClick={onRestart}>
          <RestartIcon />
          {t.done.restart}
        </button>
        <button className="cta is-secondary" onClick={onBack}>
          {t.done.back}
        </button>
      </div>
    </div>
  );
}
