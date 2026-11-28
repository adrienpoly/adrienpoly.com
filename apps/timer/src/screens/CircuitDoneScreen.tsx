import { CheckIcon, RestartIcon } from "../components/icons";
import type { Messages } from "../i18n/en";
import { useMessages } from "../i18n/useMessages";
import { formatDifference, history, type ResultsByTimer } from "../model/challenge";
import { blockPhases, formatDuration, totalSeconds, type Block } from "../model/timer";
import { BLOCK_COLORS } from "./BlockEditor";
import { formatFinishedAt } from "./DoneScreen";
import type { SessionResult } from "./SessionScreen";
import "./DoneScreen.css";
import "./CircuitDoneScreen.css";

interface Props {
  result: SessionResult;
  /** The results, which hold the ones just saved for the efforts. */
  results: ResultsByTimer;
  /** The id of the result saved for each effort, by block id. */
  resultIds: Record<string, string>;
  onRestart: () => void;
  onBack: () => void;
}

/** How a block went, on its line of the summary. */
interface Line {
  block: Block;
  number: number;
  hint: string;
  value: string;
  status: string;
  tone: "muted" | "good" | "bad";
}

/** The end of a circuit: the time it took, and each effort compared with its record. */
export function CircuitDoneScreen({ result, results, resultIds, onRestart, onBack }: Props) {
  const t = useMessages();
  const { timer, spentMs } = result;
  const blocks = timer.circuit?.blocks ?? [];
  const seconds = Math.round(Object.values(spentMs).reduce((sum, ms) => sum + ms, 0) / 1000);

  const lines = blocks.flatMap((block, index): Line[] => {
    const number = index + 1;
    if (block.type === "rest") return [];
    if (block.type === "intervals") {
      const value = formatDuration(totalSeconds(blockPhases(block, t.phases)));
      const hint = t.circuit.types.intervals;
      return [{ block, number, hint, value, status: t.circuit.done.completed, tone: "muted" }];
    }
    const outcome = result.efforts.find((candidate) => candidate.block.id === block.id);
    return outcome ? [{ block, number, ...effortLine(outcome, results, resultIds[block.id], t) }] : [];
  });
  const records = lines.filter((line) => line.tone === "good").length;

  const stats = [
    { label: t.done.duration, value: formatDuration(seconds), className: "display is-highlight" },
    { label: t.circuit.blocks, value: String(blocks.length), className: "display" },
    { label: t.circuit.done.records(records), value: String(records), className: "display is-record" },
  ];

  return (
    <div className="done circuit-done">
      <div className="done-heading">
        <div className="done-check">
          <CheckIcon />
        </div>
        <h1 className="display">
          {t.circuit.done.title[0]}
          <br />
          <span>{t.circuit.done.title[1]}</span>
        </h1>
        <p>
          {timer.name} · {formatFinishedAt(result.finishedAt, t.locale)}
        </p>
      </div>

      <div className="stats">
        {stats.map((stat) => (
          <div key={stat.label}>
            <span className={stat.className}>{stat.value}</span>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      {lines.length > 0 && (
        <div className="done-split circuit-done-blocks">
          <h2 className="display">{t.circuit.done.byBlock}</h2>
          {lines.map((line) => (
            <div key={line.block.id} className="circuit-done-block">
              <span className="circuit-done-number display" style={{ background: BLOCK_COLORS[line.block.type] }}>
                {line.number}
              </span>
              <span className="circuit-done-text">
                <span className="circuit-done-name">{line.block.name}</span>
                <span className="circuit-done-hint">{line.hint}</span>
              </span>
              <span className="circuit-done-result">
                <span className="display">{line.value}</span>
                <span className={`circuit-done-status is-${line.tone}`}>{line.status}</span>
              </span>
            </div>
          ))}
        </div>
      )}

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

/** An effort: its time, and how it compares with the record it had before. */
function effortLine(
  outcome: SessionResult["efforts"][number],
  results: ResultsByTimer,
  resultId: string | undefined,
  t: Messages,
): Omit<Line, "block" | "number"> {
  const { block, seconds, counts } = outcome;
  const goal = t.challenge.goals[block.goal].label;
  const value = seconds === null ? "–:––" : formatDuration(seconds);

  if (seconds === null) return { hint: goal, value, status: t.circuit.done.skipped, tone: "muted" };
  // A fast effort that the limit ended was not finished: it has no result.
  if (!counts) return { hint: goal, value, status: t.circuit.done.reachedLimit, tone: "bad" };

  const entry = history(results[block.id] ?? [], block.goal).find((candidate) => candidate.result.id === resultId);
  if (!entry || entry.previousBest === null || entry.difference === null) {
    return { hint: goal, value, status: t.circuit.done.first, tone: "muted" };
  }

  const hint = `${goal} · ${t.circuit.record} ${formatDuration(entry.previousBest)}`;
  const difference = formatDifference(entry.difference);
  if (entry.improved) return { hint, value, status: t.circuit.done.newRecord(difference), tone: "good" };
  return { hint, value, status: difference, tone: entry.difference === 0 ? "muted" : "bad" };
}
