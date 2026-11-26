import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { Result } from "../model/challenge";
import { formatDuration } from "../model/timer";
import "./ResultsChart.css";

/** Above this many results, only the selected one gets a dot: more would merge into a band. */
const MAX_DOTS = 30;
/** The curve on a card shows the latest results only. */
const SPARKLINE_RESULTS = 12;

interface Point {
  x: number;
  y: number;
}

/**
 * Where each value goes in a 100 × 100 box: evenly spaced from left to right,
 * the largest at the top. The curve is stretched to its box by the SVG and the
 * dots are placed in percent, so nothing has to measure the screen.
 */
function plot(values: number[]): Point[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values.map((value, index) => ({
    x: values.length === 1 ? 50 : (index / (values.length - 1)) * 100,
    y: max === min ? 50 : ((max - value) / (max - min)) * 100,
  }));
}

function Curve({ points }: { points: Point[] }) {
  return (
    <svg className="curve" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={points.map((point) => `${point.x},${point.y}`).join(" ")}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const at = (point: Point) => ({ left: `${point.x}%`, top: `${point.y}%` });

/** The latest results of a challenge at a glance, for its card. `results` are oldest first. */
export function Sparkline({ results }: { results: Result[] }) {
  const points = plot(results.slice(-SPARKLINE_RESULTS).map((result) => result.seconds));
  return (
    <div className="sparkline" aria-hidden="true">
      <Curve points={points} />
      <span className="chart-dot" style={at(points[points.length - 1])} />
    </div>
  );
}

interface Props {
  /** Oldest first. At least one. */
  results: Result[];
  /** What the chart is, for screen readers. The list of results under it holds the values. */
  label: string;
  formatDate: (timestamp: number) => string;
}

/**
 * The results of a challenge over time: one point per result, in the order of
 * the attempts. Touching the chart, or the arrow keys, selects a result and
 * shows its time and date above.
 */
export function ResultsChart({ results, label, formatDate }: Props) {
  const plotArea = useRef<HTMLDivElement>(null);
  // Null follows the latest result, also after one was added or removed.
  const [chosen, setChosen] = useState<number | null>(null);

  const last = results.length - 1;
  const selected = Math.min(chosen ?? last, last);
  const values = results.map((result) => result.seconds);
  const points = plot(values);
  const min = Math.min(...values);
  const max = Math.max(...values);

  function selectAt(event: PointerEvent) {
    const box = plotArea.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const fraction = (event.clientX - box.left) / box.width;
    setChosen(Math.min(last, Math.max(0, Math.round(fraction * last))));
  }

  function selectWithKeys(event: KeyboardEvent) {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!step) return;
    event.preventDefault();
    setChosen(Math.min(last, Math.max(0, selected + step)));
  }

  return (
    <div className="chart">
      <p className="chart-readout" aria-live="polite">
        <strong className="display">{formatDuration(results[selected].seconds)}</strong>
        <span>{formatDate(results[selected].at)}</span>
      </p>

      <div className="chart-body">
        <div className={max === min ? "chart-axis is-flat" : "chart-axis"} aria-hidden="true">
          <span>{formatDuration(max)}</span>
          {max !== min && <span>{formatDuration(min)}</span>}
        </div>

        <div
          ref={plotArea}
          className="chart-plot"
          role="img"
          aria-label={label}
          tabIndex={0}
          onPointerDown={selectAt}
          onPointerMove={(event) => {
            // A mouse selects while its button is down; a finger always has it "down".
            if (event.buttons > 0) selectAt(event);
          }}
          onKeyDown={selectWithKeys}
        >
          <span className="chart-cursor" style={{ left: `${points[selected].x}%` }} />
          <Curve points={points} />
          {points.map((point, index) => {
            if (index !== selected && results.length > MAX_DOTS) return null;
            return (
              <span
                key={results[index].id}
                className={index === selected ? "chart-dot is-selected" : "chart-dot"}
                style={at(point)}
              />
            );
          })}
        </div>

        <div className="chart-dates" aria-hidden="true">
          <span>{formatDate(results[0].at)}</span>
          {last > 0 && <span>{formatDate(results[last].at)}</span>}
        </div>
      </div>
    </div>
  );
}
