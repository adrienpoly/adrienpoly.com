import { useState, type CSSProperties } from "react";
import { IonContent, IonFooter, IonModal, useIonAlert } from "@ionic/react";
import { SequenceBar } from "../components/SequenceBar";
import { useMessages } from "../i18n/useMessages";
import {
  blockPhases,
  formatDuration,
  PHASE_COLORS,
  totalSeconds,
  type Block,
  type ChallengeGoal,
} from "../model/timer";
import { DurationSheet, type SheetField } from "./DurationSheet";
import { EditorRow } from "./EditorRow";
import { IntervalsFields } from "./IntervalsFields";
import "./EditorScreen.css";

interface Props {
  isOpen: boolean;
  /** The block to edit. It stays set while the editor animates out. */
  block: Block | null;
  onCancel: () => void;
  onDone: (block: Block) => void;
  onDelete: (block: Block) => void;
  /** The editor has finished closing. */
  onDismissed: () => void;
}

/** The color of each kind of block: its badge in the circuit editor, the border of its name. */
export const BLOCK_COLORS: Record<Block["type"], string> = {
  intervals: PHASE_COLORS.work,
  effort: PHASE_COLORS.effort,
  rest: PHASE_COLORS.rest,
};

/** One block of a circuit, in a full-screen modal over the circuit editor. */
export function BlockEditor({ isOpen, block, onDismissed, ...actions }: Props) {
  return (
    <IonModal className="editor-modal" isOpen={isOpen} onDidDismiss={onDismissed}>
      {block && <Editor key={block.id} initial={block} {...actions} />}
    </IonModal>
  );
}

type EditorProps = Pick<Props, "onCancel" | "onDone" | "onDelete"> & { initial: Block };

const GOALS: ChallengeGoal[] = ["shortest", "longest"];

function Editor({ initial, onCancel, onDone, onDelete }: EditorProps) {
  const t = useMessages();
  const [presentAlert] = useIonAlert();
  const [block, setBlock] = useState(initial);
  const [sheetOpen, setSheetOpen] = useState(false);

  // The fields of the block's own kind: TypeScript cannot follow a spread over a union.
  const patch = (changes: Partial<Block>) => setBlock((current) => ({ ...current, ...changes }) as Block);
  // An empty name falls back to the one the block had when the editor opened.
  const named = (): Block => ({ ...block, name: block.name.trim() || initial.name });

  /** The one value the sheet sets: the limit of an effort, the length of a rest. */
  function sheetField(): SheetField | null {
    if (block.type === "effort") {
      return {
        title: t.circuit.block.limit,
        color: PHASE_COLORS.effort,
        unit: "seconds",
        value: block.limitSeconds,
        onConfirm: (seconds) => patch({ limitSeconds: seconds }),
      };
    }
    if (block.type === "rest") {
      return {
        title: t.circuit.block.duration,
        color: PHASE_COLORS.rest,
        unit: "seconds",
        value: block.seconds,
        onConfirm: (seconds) => patch({ seconds }),
      };
    }
    return null;
  }

  function confirmDelete() {
    void presentAlert({
      header: t.circuit.block.confirmDelete(initial.name),
      buttons: [
        { text: t.common.cancel, role: "cancel" },
        { text: t.common.delete, role: "destructive", handler: () => onDelete(initial) },
      ],
    });
  }

  const phases = blockPhases(block, t.phases);

  return (
    <>
      <IonContent>
        <div className="editor" style={{ "--timer-color": BLOCK_COLORS[block.type] } as CSSProperties}>
          <header className="editor-top">
            <button className="text-button is-muted" onClick={onCancel}>
              {t.common.cancel}
            </button>
            <button className="text-button is-strong" onClick={() => onDone(named())}>
              {t.common.done}
            </button>
          </header>

          <div className="editor-identity">
            <label className="display" htmlFor="block-name">
              {t.circuit.block.name}
            </label>
            <input
              id="block-name"
              value={block.name}
              maxLength={40}
              autoComplete="off"
              enterKeyHint="done"
              onChange={(event) => patch({ name: event.target.value })}
            />
          </div>

          {block.type === "intervals" && (
            <>
              <h2 className="editor-section display">{t.editor.intervals}</h2>
              <IntervalsFields value={block} onChange={patch} />
            </>
          )}

          {block.type === "effort" && (
            <>
              <h2 className="editor-section display">{t.challenge.goal}</h2>
              <div className="editor-goal" role="radiogroup" aria-label={t.challenge.goal}>
                {GOALS.map((option) => (
                  <button
                    key={option}
                    role="radio"
                    aria-checked={option === block.goal}
                    onClick={() => patch({ goal: option })}
                  >
                    {t.challenge.goals[option].label}
                  </button>
                ))}
              </div>
              <p className="editor-note is-goal">{t.challenge.goals[block.goal].hint}</p>
              <div className="editor-group">
                <EditorRow
                  name={t.circuit.block.limit}
                  hint={t.circuit.block.limitHint}
                  value={block.limitSeconds > 0 ? formatDuration(block.limitSeconds) : "∞"}
                  dot={PHASE_COLORS.effort}
                  onClick={() => setSheetOpen(true)}
                />
              </div>
            </>
          )}

          {block.type === "rest" && (
            <div className="editor-group">
              <EditorRow
                name={t.circuit.block.duration}
                hint={t.circuit.block.durationHint}
                value={formatDuration(block.seconds)}
                dot={PHASE_COLORS.rest}
                onClick={() => setSheetOpen(true)}
              />
            </div>
          )}

          <button className="text-button editor-delete" onClick={confirmDelete}>
            {t.circuit.block.delete}
          </button>
        </div>
      </IonContent>

      {block.type === "intervals" && (
        <IonFooter className="editor-footer ion-no-border">
          <div className="editor-total">
            <span>
              <span className="editor-total-label">{t.editor.total}</span>
              <span className="editor-total-detail">
                {t.counts.rounds(block.rounds * block.cycles)} · {t.counts.cycles(block.cycles)}
              </span>
            </span>
            <span className="editor-total-value display">{formatDuration(totalSeconds(phases))}</span>
          </div>
          <SequenceBar className="editor-total-bar" phases={phases} />
        </IonFooter>
      )}

      <DurationSheet
        isOpen={sheetOpen}
        field={sheetField()}
        onClose={() => setSheetOpen(false)}
        onDismissed={() => setSheetOpen(false)}
      />
    </>
  );
}
