import { useState, type CSSProperties } from "react";
import { IonContent, IonFooter, IonModal, IonReorder, IonReorderGroup, useIonAlert } from "@ionic/react";
import { ChevronIcon, HandleIcon, PlayIcon, PlusIcon } from "../components/icons";
import { SequenceBar } from "../components/SequenceBar";
import { useMessages } from "../i18n/useMessages";
import {
  buildPhases,
  createStep,
  formatDuration,
  PHASE_COLORS,
  TIMER_COLORS,
  totalSeconds,
  type Step,
  type Timer,
  type TimerOptions,
} from "../model/timer";
import { isIos } from "../platform/ios";
import { DurationSheet, type SheetField } from "./DurationSheet";
import "./EditorScreen.css";

interface Props {
  isOpen: boolean;
  /** The timer to edit. It stays set while the editor animates out. */
  timer: Timer | null;
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

type EditorProps = Pick<Props, "onCancel" | "onSave" | "onSaveAndStart" | "onDelete"> & {
  initial: Timer;
};

/** Which value the duration sheet is editing. */
type Target =
  | { type: "seconds"; key: "prepareSeconds" | "cycleRestSeconds" | "recoverySeconds" }
  | { type: "count"; key: "rounds" | "cycles" }
  | { type: "step"; id: string };

/** The switches of the "Options" section, in the order they are shown. */
const OPTIONS: Array<keyof TimerOptions> = ["countdown", "voice", "vibration", "keepAwake"];

function Editor({ initial, onCancel, onSave, onSaveAndStart, onDelete }: EditorProps) {
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
  const patchStep = (id: string, changes: Partial<Step>) =>
    patch({ steps: timer.steps.map((step) => (step.id === id ? { ...step, ...changes } : step)) });

  const phases = buildPhases(timer, t.phases);
  const canStart = phases.length > 0;
  // An empty name falls back to the one the timer had when the editor opened.
  const named = (): Timer => ({ ...timer, name: timer.name.trim() || initial.name });

  function addStep() {
    const step = createStep(t.names);
    patch({ steps: [...timer.steps, step] });
    edit({ type: "step", id: step.id });
  }

  function sheetField(): SheetField | null {
    if (!target) return null;

    if (target.type === "seconds") {
      const titles = {
        prepareSeconds: t.phases.prepare,
        cycleRestSeconds: t.phases.cycleRest,
        recoverySeconds: t.phases.recovery,
      };
      return {
        title: titles[target.key],
        color: target.key === "prepareSeconds" ? PHASE_COLORS.prepare : PHASE_COLORS.recovery,
        unit: "seconds",
        value: timer[target.key],
        onConfirm: (value) => patch({ [target.key]: value }),
      };
    }

    if (target.type === "count") {
      return {
        title: target.key === "rounds" ? t.editor.rounds : t.editor.cycles,
        unit: "count",
        value: timer[target.key],
        onConfirm: (value) => patch({ [target.key]: value }),
      };
    }

    const step = timer.steps.find((candidate) => candidate.id === target.id);
    if (!step) return null;
    return {
      title: step.name,
      color: PHASE_COLORS[step.kind],
      unit: "seconds",
      value: step.seconds,
      renamable: true,
      onConfirm: (seconds, name) => patchStep(step.id, { seconds, name }),
      onDelete:
        timer.steps.length > 1
          ? () => patch({ steps: timer.steps.filter((candidate) => candidate.id !== step.id) })
          : undefined,
    };
  }

  const roundContents = timer.steps.map((step) => step.name.toLowerCase()).join(" + ");

  function confirmDelete() {
    void presentAlert({
      header: t.editor.confirmDelete(initial.name),
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
              {t.editor.name}
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

          <h2 className="editor-section display">{t.editor.intervals}</h2>
          <div className="editor-group">
            <Row
              name={t.phases.prepare}
              hint={t.editor.prepareHint}
              value={formatDuration(timer.prepareSeconds)}
              dot={PHASE_COLORS.prepare}
              onClick={() => edit({ type: "seconds", key: "prepareSeconds" })}
            />
            <IonReorderGroup
              disabled={false}
              onIonReorderEnd={(event) => patch({ steps: event.detail.complete(timer.steps) })}
            >
              {timer.steps.map((step) => (
                <Row
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
            <Row
              name={t.editor.rounds}
              hint={t.editor.roundContents(roundContents)}
              value={`×${timer.rounds}`}
              onClick={() => edit({ type: "count", key: "rounds" })}
            />
            <Row
              name={t.editor.cycles}
              hint={t.editor.cycleContents(timer.rounds)}
              value={`×${timer.cycles}`}
              onClick={() => edit({ type: "count", key: "cycles" })}
            />
            <Row
              name={t.phases.cycleRest}
              hint={t.editor.cycleRestHint}
              value={formatDuration(timer.cycleRestSeconds)}
              dot={PHASE_COLORS.recovery}
              onClick={() => edit({ type: "seconds", key: "cycleRestSeconds" })}
            />
            <Row
              name={t.phases.recovery}
              hint={t.editor.recoveryHint}
              value={formatDuration(timer.recoverySeconds)}
              dot={PHASE_COLORS.recovery}
              onClick={() => edit({ type: "seconds", key: "recoverySeconds" })}
            />
          </div>

          <div className="editor-add">
            <button onClick={addStep}>
              <PlusIcon size={18} weight={2.6} />
              {t.editor.addStep} <span>{t.editor.addStepExample}</span>
            </button>
          </div>

          <h2 className="editor-section display">{t.editor.optionsTitle}</h2>
          <div className="editor-group">
            {OPTIONS.map((option) => (
              <label key={option} className="editor-option">
                <span className="editor-row-text">
                  <span className="editor-row-name">{t.editor.options[option].label}</span>
                  <span className="editor-row-hint">{t.editor.options[option].hint}</span>
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
              {t.editor.deleteTimer}
            </button>
          )}
        </div>
      </IonContent>

      <IonFooter className="editor-footer ion-no-border">
        <div className="editor-total">
          <span>
            <span className="editor-total-label">{t.editor.total}</span>
            <span className="editor-total-detail">
              {t.counts.rounds(timer.rounds * timer.cycles)} · {t.counts.cycles(timer.cycles)}
            </span>
          </span>
          <span className="editor-total-value display">{formatDuration(totalSeconds(phases))}</span>
        </div>
        <SequenceBar className="editor-total-bar" phases={phases} />
        <button className="cta has-glow" disabled={!canStart} onClick={() => onSaveAndStart(named())}>
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

interface RowProps {
  name: string;
  hint: string;
  value: string;
  /** Color of the dot. Without it the row shows an empty ring (a count, not a phase). */
  dot?: string;
  reorderable?: boolean;
  onClick: () => void;
}

function Row({ name, hint, value, dot, reorderable = false, onClick }: RowProps) {
  return (
    <div className="editor-row">
      {reorderable ? (
        <IonReorder className="editor-row-handle">
          <HandleIcon />
        </IonReorder>
      ) : (
        <span className="editor-row-handle" />
      )}
      <button className="editor-row-main" onClick={onClick}>
        <span className={dot ? "editor-row-dot" : "editor-row-dot is-ring"} style={{ background: dot }} />
        <span className="editor-row-text">
          <span className="editor-row-name">{name}</span>
          <span className="editor-row-hint">{hint}</span>
        </span>
        <span className="editor-row-value display">{value}</span>
        <ChevronIcon size={14} weight={2.4} />
      </button>
    </div>
  );
}
