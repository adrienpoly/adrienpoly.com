import { barSeconds, PHASE_COLORS, type Phase, type PhaseKind } from "../model/timer";
import "./SequenceBar.css";

interface Props {
  phases: Phase[];
  /**
   * With a color: work in that color, efforts in theirs, everything else in greys (lists).
   * Without: each kind of phase in its own color (editor).
   */
  color?: string;
  className?: string;
}

const GREYS: Record<Exclude<PhaseKind, "work">, string> = {
  prepare: "#4A4A57",
  rest: "#33333E",
  recovery: "#4A4A57",
  // An effort stands out in every list: the user measures it.
  effort: PHASE_COLORS.effort,
};

/** A timer at a glance: one segment per phase, as wide as the phase is long (an effort: a set width). */
export function SequenceBar({ phases, color, className = "" }: Props) {
  const background = (kind: PhaseKind) => {
    if (!color) return PHASE_COLORS[kind];
    return kind === "work" ? color : GREYS[kind];
  };

  return (
    <div className={`sequence-bar ${className}`} aria-hidden="true">
      {phases.map((phase, index) => (
        <span key={index} style={{ flexGrow: barSeconds(phase), background: background(phase.kind) }} />
      ))}
    </div>
  );
}
