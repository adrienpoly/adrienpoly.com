import { useState, type ReactNode } from "react";
import { IonReorderGroup } from "@ionic/react";
import { PlusIcon } from "../components/icons";
import { useMessages } from "../i18n/useMessages";
import { createStep, formatDuration, PHASE_COLORS, type IntervalsBlock, type Step } from "../model/timer";
import { DurationSheet, type SheetField } from "./DurationSheet";
import { EditorRow } from "./EditorRow";
import "./EditorScreen.css";

/** What a timer and an intervals block of a circuit have in common. */
export type Intervals = Pick<IntervalsBlock, "steps" | "rounds" | "cycles" | "cycleRestSeconds">;

interface Props {
  value: Intervals;
  onChange: (changes: Partial<Intervals>) => void;
  /** Rows shown in the same group, before the steps and after the rest between cycles. */
  before?: ReactNode;
  after?: ReactNode;
}

/** Which value the duration sheet is editing. */
type Target = { type: "count"; key: "rounds" | "cycles" } | { type: "cycleRest" } | { type: "step"; id: string };

/**
 * The steps of a round, the rounds and the cycles, with the sheet that sets
 * each value: the heart of the timer editor, and of an intervals block.
 */
export function IntervalsFields({ value, onChange, before, after }: Props) {
  const t = useMessages();
  // The sheet keeps its target while it animates out, so its content stays visible.
  const [target, setTarget] = useState<Target | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function edit(next: Target) {
    setTarget(next);
    setSheetOpen(true);
  }

  const patchStep = (id: string, changes: Partial<Step>) =>
    onChange({ steps: value.steps.map((step) => (step.id === id ? { ...step, ...changes } : step)) });

  function addStep() {
    const step = createStep(t.names);
    onChange({ steps: [...value.steps, step] });
    edit({ type: "step", id: step.id });
  }

  function sheetField(): SheetField | null {
    if (!target) return null;

    if (target.type === "cycleRest") {
      return {
        title: t.phases.cycleRest,
        color: PHASE_COLORS.recovery,
        unit: "seconds",
        value: value.cycleRestSeconds,
        onConfirm: (seconds) => onChange({ cycleRestSeconds: seconds }),
      };
    }

    if (target.type === "count") {
      return {
        title: target.key === "rounds" ? t.editor.rounds : t.editor.cycles,
        unit: "count",
        value: value[target.key],
        onConfirm: (count) => onChange({ [target.key]: count }),
      };
    }

    const step = value.steps.find((candidate) => candidate.id === target.id);
    if (!step) return null;
    return {
      title: step.name,
      color: PHASE_COLORS[step.kind],
      unit: "seconds",
      value: step.seconds,
      renamable: true,
      onConfirm: (seconds, name) => patchStep(step.id, { seconds, name }),
      onDelete:
        value.steps.length > 1
          ? () => onChange({ steps: value.steps.filter((candidate) => candidate.id !== step.id) })
          : undefined,
    };
  }

  const roundContents = value.steps.map((step) => step.name.toLowerCase()).join(" + ");

  return (
    <>
      <div className="editor-group">
        {before}
        <IonReorderGroup
          disabled={false}
          onIonReorderEnd={(event) => onChange({ steps: event.detail.complete(value.steps) })}
        >
          {value.steps.map((step) => (
            <EditorRow
              key={step.id}
              name={step.name}
              hint={step.kind === "work" ? t.editor.workHint : t.editor.restHint}
              value={formatDuration(step.seconds)}
              dot={PHASE_COLORS[step.kind]}
              reorderable
              onClick={() => edit({ type: "step", id: step.id })}
            />
          ))}
        </IonReorderGroup>
        <EditorRow
          name={t.editor.rounds}
          hint={t.editor.roundContents(roundContents)}
          value={`×${value.rounds}`}
          onClick={() => edit({ type: "count", key: "rounds" })}
        />
        <EditorRow
          name={t.editor.cycles}
          hint={t.editor.cycleContents(value.rounds)}
          value={`×${value.cycles}`}
          onClick={() => edit({ type: "count", key: "cycles" })}
        />
        <EditorRow
          name={t.phases.cycleRest}
          hint={t.editor.cycleRestHint}
          value={formatDuration(value.cycleRestSeconds)}
          dot={PHASE_COLORS.recovery}
          onClick={() => edit({ type: "cycleRest" })}
        />
        {after}
      </div>

      <div className="editor-add">
        <button onClick={addStep}>
          <PlusIcon size={18} weight={2.6} />
          {t.editor.addStep} <span>{t.editor.addStepExample}</span>
        </button>
      </div>

      <DurationSheet
        isOpen={sheetOpen}
        field={sheetField()}
        onClose={() => setSheetOpen(false)}
        onDismissed={() => {
          setSheetOpen(false);
          setTarget(null);
        }}
      />
    </>
  );
}
