import { useState, type CSSProperties, type ReactNode } from "react";
import { IonContent, IonFooter, IonModal, IonReorderGroup, useIonAlert } from "@ionic/react";
import { PlayIcon, PlusIcon } from "../components/icons";
import { SequenceBar } from "../components/SequenceBar";
import type { Messages } from "../i18n/en";
import { useMessages } from "../i18n/useMessages";
import { bestResult, type ResultsByTimer } from "../model/challenge";
import {
  blockPhases,
  buildPhases,
  canStart,
  effortCount,
  formatDuration,
  PHASE_COLORS,
  summarizeIntervals,
  TIMER_COLORS,
  totalSeconds,
  type Block,
  type ChallengeGoal,
  type Circuit,
  type Timer,
  type TimerOptions,
} from "../model/timer";
import { isIos } from "../platform/ios";
import { AddBlockSheet } from "./AddBlockSheet";
import { BLOCK_COLORS, BlockEditor } from "./BlockEditor";
import { DurationSheet, type SheetField } from "./DurationSheet";
import { EditorRow } from "./EditorRow";
import { IntervalsFields } from "./IntervalsFields";
import "./EditorScreen.css";

interface Props {
  isOpen: boolean;
  /** The timer to edit. It stays set while the editor animates out. */
  timer: Timer | null;
  /** All the timers: a block of a circuit can copy one. */
  timers: Timer[];
  /** The results, for the records of the efforts of a circuit. */
  results: ResultsByTimer;
  onCancel: () => void;
  onSave: (timer: Timer) => void;
  onSaveAndStart: (timer: Timer) => void;
  /** Absent for a timer that has not been saved yet: there is nothing to delete. */
  onDelete?: (timer: Timer) => void;
  /** The editor has finished closing. */
  onDismissed: () => void;
}

/** Screen 3: the timer editor, presented as a full-screen modal. */
export function EditorScreen({ isOpen, timer, onDismissed, ...actions }: Props) {
  return (
    <IonModal className="editor-modal" isOpen={isOpen} onDidDismiss={onDismissed}>
      {timer && <Editor key={timer.id} initial={timer} {...actions} />}
    </IonModal>
  );
}

type EditorProps = Omit<Props, "isOpen" | "timer" | "onDismissed"> & { initial: Timer };

/** Which duration the sheet is editing. Steps, rounds and cycles have their own (IntervalsFields). */
type Target = "prepareSeconds" | "recoverySeconds" | "transitionSeconds";

const GOALS: ChallengeGoal[] = ["shortest", "longest"];

/** The switches of the "Options" section, in the order they are shown. */
const OPTIONS: Array<keyof TimerOptions> = ["countdown", "voice", "vibration", "keepAwake"];

function Editor({ initial, timers, results, onCancel, onSave, onSaveAndStart, onDelete }: EditorProps) {
  const t = useMessages();
  const [presentAlert] = useIonAlert();
  const [timer, setTimer] = useState(initial);
  // The sheet keeps its target while it animates out, so its content stays visible.
  const [target, setTarget] = useState<Target | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function edit(next: Target) {
    setTarget(next);
    setSheetOpen(true);
  }

  const patch = (changes: Partial<Timer>) => setTimer((current) => ({ ...current, ...changes }));

  const phases = buildPhases(timer, t.phases);
  // A challenge has no steps, rounds or cycles: only a goal and a preparation.
  const goal = timer.challenge?.goal;
  const circuit = timer.circuit;
  const startable = canStart(timer, phases);
  // An empty name falls back to the one the timer had when the editor opened.
  const named = (): Timer => ({ ...timer, name: timer.name.trim() || initial.name });

  function sheetField(): SheetField | null {
    if (!target) return null;
    if (target === "transitionSeconds") {
      return {
        title: t.phases.transition,
        color: PHASE_COLORS.prepare,
        unit: "seconds",
        value: circuit?.transitionSeconds ?? 0,
        onConfirm: (value) => circuit && patch({ circuit: { ...circuit, transitionSeconds: value } }),
      };
    }
    return {
      title: target === "prepareSeconds" ? t.phases.prepare : t.phases.recovery,
      color: target === "prepareSeconds" ? PHASE_COLORS.prepare : PHASE_COLORS.recovery,
      unit: "seconds",
      value: timer[target],
      onConfirm: (value) => patch({ [target]: value }),
    };
  }

  const prepareRow = (
    <EditorRow
      name={t.phases.prepare}
      hint={t.editor.prepareHint}
      value={formatDuration(timer.prepareSeconds)}
      dot={PHASE_COLORS.prepare}
      onClick={() => edit("prepareSeconds")}
    />
  );

  const recoveryRow = (
    <EditorRow
      name={t.phases.recovery}
      hint={t.editor.recoveryHint}
      value={formatDuration(timer.recoverySeconds)}
      dot={PHASE_COLORS.recovery}
      onClick={() => edit("recoverySeconds")}
    />
  );

  function confirmDelete() {
    const header = goal
      ? t.challenge.confirmDelete(initial.name)
      : circuit
        ? t.circuit.confirmDelete(initial.name)
        : t.editor.confirmDelete(initial.name);
    void presentAlert({
      header,
      buttons: [
        { text: t.common.cancel, role: "cancel" },
        { text: t.common.delete, role: "destructive", handler: () => onDelete?.(initial) },
      ],
    });
  }

  return (
    <>
      <IonContent>
        <div className="editor" style={{ "--timer-color": timer.color } as CSSProperties}>
          <header className="editor-top">
            <button className="text-button is-muted" onClick={onCancel}>
              {t.common.cancel}
            </button>
            <button className="text-button is-strong" onClick={() => onSave(named())}>
              {t.editor.save}
            </button>
          </header>

          <div className="editor-identity">
            <label className="display" htmlFor="timer-name">
              {goal ? t.editor.challengeName : circuit ? t.circuit.name : t.editor.name}
            </label>
            <input
              id="timer-name"
              value={timer.name}
              maxLength={40}
              autoComplete="off"
              enterKeyHint="done"
              onChange={(event) => patch({ name: event.target.value })}
            />
            <div className="editor-colors">
              <span>{t.editor.color}</span>
              {TIMER_COLORS.map((color) => (
                <button
                  key={color.value}
                  aria-label={t.colors[color.id]}
                  aria-pressed={color.value === timer.color}
                  style={{ "--swatch": color.value } as CSSProperties}
                  onClick={() => patch({ color: color.value })}
                />
              ))}
            </div>
          </div>

          {goal ? (
            <>
              <h2 className="editor-section display">{t.editor.challengeSection}</h2>
              <div className="editor-goal" role="radiogroup" aria-label={t.challenge.goal}>
                {GOALS.map((option) => (
                  <button
                    key={option}
                    role="radio"
                    aria-checked={option === goal}
                    onClick={() => patch({ challenge: { goal: option } })}
                  >
                    {t.challenge.goals[option].label}
                  </button>
                ))}
              </div>
              <p className="editor-note is-goal">{t.challenge.goals[goal].hint}</p>
              <div className="editor-group">{prepareRow}</div>
            </>
          ) : circuit ? (
            <CircuitFields
              circuit={circuit}
              timers={timers}
              results={results}
              before={prepareRow}
              after={recoveryRow}
              onChange={(changes) => patch({ circuit: { ...circuit, ...changes } })}
              onTransition={() => edit("transitionSeconds")}
            />
          ) : (
            <>
              <h2 className="editor-section display">{t.editor.intervals}</h2>
              <IntervalsFields value={timer} onChange={patch} before={prepareRow} after={recoveryRow} />
            </>
          )}

          <h2 className="editor-section display">{t.editor.optionsTitle}</h2>
          <div className="editor-group">
            {OPTIONS.map((option) => (
              <label key={option} className="editor-option">
                <span className="editor-row-text">
                  <span className="editor-row-name">{t.editor.options[option].label}</span>
                  <span className="editor-row-hint">
                    {goal && option === "voice" ? t.challenge.voiceHint : t.editor.options[option].hint}
                  </span>
                </span>
                <input
                  className="switch"
                  type="checkbox"
                  checked={timer.options[option]}
                  onChange={(event) =>
                    patch({ options: { ...timer.options, [option]: event.target.checked } })
                  }
                />
              </label>
            ))}
          </div>
          {isIos(navigator) && <p className="editor-note">{t.sounds.silentModeNote}</p>}

          {onDelete && (
            <button className="text-button editor-delete" onClick={confirmDelete}>
              {goal ? t.editor.deleteChallenge : circuit ? t.circuit.deleteCircuit : t.editor.deleteTimer}
            </button>
          )}
        </div>
      </IonContent>

      <IonFooter className="editor-footer ion-no-border">
        {/* A challenge has no total: it lasts as long as the effort does. */}
        {!goal && (
          <>
            <div className="editor-total">
              <span>
                <span className="editor-total-label">{circuit ? t.circuit.timedTotal : t.editor.total}</span>
                <span className={circuit ? "editor-total-detail is-efforts" : "editor-total-detail"}>
                  {circuit
                    ? effortCount(phases) > 0 && t.circuit.plusEfforts(effortCount(phases))
                    : `${t.counts.rounds(timer.rounds * timer.cycles)} · ${t.counts.cycles(timer.cycles)}`}
                </span>
              </span>
              <span className="editor-total-value display">{formatDuration(totalSeconds(phases))}</span>
            </div>
            <SequenceBar className="editor-total-bar" phases={phases} />
          </>
        )}
        <button className="cta has-glow" disabled={!startable} onClick={() => onSaveAndStart(named())}>
          <PlayIcon size={18} />
          {t.editor.saveAndStart}
        </button>
      </IonFooter>

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

interface CircuitFieldsProps {
  circuit: Circuit;
  timers: Timer[];
  results: ResultsByTimer;
  /** The preparation and the recovery, around the blocks. */
  before: ReactNode;
  after: ReactNode;
  onChange: (changes: Partial<Circuit>) => void;
  onTransition: () => void;
}

/** The blocks of a circuit, the sheet that adds one, the editor of one, and the transition. */
function CircuitFields({ circuit, timers, results, before, after, onChange, onTransition }: CircuitFieldsProps) {
  const t = useMessages();
  const { blocks } = circuit;
  const [addOpen, setAddOpen] = useState(false);
  // The block editor keeps its block while it animates out, so its content stays visible.
  const [editing, setEditing] = useState<Block | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);

  function open(block: Block) {
    setEditing(block);
    setBlockOpen(true);
  }

  function replace(block: Block) {
    onChange({ blocks: blocks.map((candidate) => (candidate.id === block.id ? block : candidate)) });
    setBlockOpen(false);
  }

  function remove(block: Block) {
    onChange({ blocks: blocks.filter((candidate) => candidate.id !== block.id) });
    setBlockOpen(false);
  }

  return (
    <>
      <h2 className="editor-section display">{t.circuit.blocks}</h2>
      <div className="editor-group">
        {before}
        <IonReorderGroup
          disabled={false}
          onIonReorderEnd={(event) => onChange({ blocks: event.detail.complete(blocks) })}
        >
          {blocks.map((block, index) => (
            <EditorRow
              key={block.id}
              name={block.name}
              {...blockLine(block, t, results)}
              dot={BLOCK_COLORS[block.type]}
              badge={String(index + 1)}
              reorderable
              onClick={() => open(block)}
            />
          ))}
        </IonReorderGroup>
        {after}
      </div>
      {blocks.length > 1 && <p className="editor-note">{t.circuit.reorderHint}</p>}

      <div className="editor-add">
        <button onClick={() => setAddOpen(true)}>
          <PlusIcon size={18} weight={2.6} />
          {t.circuit.addBlock}
        </button>
      </div>

      <h2 className="editor-section display">{t.circuit.betweenBlocks}</h2>
      <div className="editor-group">
        <EditorRow
          name={t.phases.transition}
          hint={t.circuit.transitionHint}
          value={formatDuration(circuit.transitionSeconds)}
          dot={PHASE_COLORS.prepare}
          onClick={onTransition}
        />
      </div>

      <AddBlockSheet
        isOpen={addOpen}
        timers={timers}
        onClose={() => setAddOpen(false)}
        onPick={(block, isNew) => {
          setAddOpen(false);
          onChange({ blocks: [...blocks, block] });
          // A new block is set up right away; a copy already is.
          if (isNew) open(block);
        }}
      />

      <BlockEditor
        isOpen={blockOpen}
        block={editing}
        onCancel={() => setBlockOpen(false)}
        onDone={replace}
        onDelete={remove}
        onDismissed={() => {
          setBlockOpen(false);
          setEditing(null);
        }}
      />
    </>
  );
}

/** What a block's row says: its kind and its shape, and its length (an effort: its record). */
function blockLine(block: Block, t: Messages, results: ResultsByTimer): { hint: string; value: string } {
  if (block.type === "effort") {
    const limit =
      block.limitSeconds > 0 ? t.circuit.limitOf(formatDuration(block.limitSeconds)) : t.circuit.noLimit;
    const best = bestResult(results[block.id] ?? [], block.goal);
    return {
      hint: `${t.challenge.goals[block.goal].label} · ${limit}${best ? ` · ${t.circuit.record}` : ""}`,
      value: best ? formatDuration(best.seconds) : "–:––",
    };
  }
  const value = formatDuration(totalSeconds(blockPhases(block, t.phases)));
  if (block.type === "rest") return { hint: t.circuit.types.rest, value };
  return { hint: `${t.circuit.types.intervals} · ${summarizeIntervals(block, t.counts.cycles)}`, value };
}
