import { PHASE_COLORS, type Phase, type PhaseKind } from "../model/timer";
import "./SequenceBar.css";

interface Props {
  phases: Phase[];
  /**
   * With a color: work in that color, everything else in greys (lists).
   * Without: each kind of phase in its own color (editor).
   */
  color?: string;
  className?: string;
}

const GREYS: Record<Exclude<PhaseKind, "work">, string> = {
  prepare: "#4A4A57",
  rest: "#33333E",
  recovery: "#4A4A57",
};

/** A timer at a glance: one segment per phase, as wide as the phase is long. */
export function SequenceBar({ phases, color, className = "" }: Props) {
  const background = (kind: PhaseKind) => {
    if (!color) return PHASE_COLORS[kind];
    return kind === "work" ? color : GREYS[kind];
  };

  return (
    <div className={`sequence-bar ${className}`} aria-hidden="true">
      {phases.map((phase, index) => (
        <span key={index} style={{ flexGrow: phase.seconds, background: background(phase.kind) }} />
      ))}
    </div>
  );
}
