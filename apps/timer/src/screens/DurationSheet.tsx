import { useState, type CSSProperties } from "react";
import { IonModal } from "@ionic/react";
import { Wheel } from "../components/Wheel";
import { useMessages } from "../i18n/useMessages";
import { formatDuration } from "../model/timer";
import "./DurationSheet.css";

/** What the sheet edits, and what to do with the result. */
export interface SheetField {
  title: string;
  /** Color of the dot next to the title. */
  color?: string;
  /** A duration (minutes and seconds wheels) or a number of repetitions (one wheel). */
  unit: "seconds" | "count";
  value: number;
  /** True for steps: the title is then a text field, and `onConfirm` receives the name typed in it. */
  renamable?: boolean;
  onConfirm: (value: number, title: string) => void;
  /** Present for steps that can be removed. */
  onDelete?: () => void;
}

interface Props {
  isOpen: boolean;
  /** The value being edited. It stays set while the sheet animates out. */
  field: SheetField | null;
  /** Asks the owner to close the sheet. */
  onClose: () => void;
  /** The sheet has finished closing. */
  onDismissed: () => void;
}

/** Screen 4: set one duration (or one count) with wheels and shortcuts. */
export function DurationSheet({ isOpen, field, onClose, onDismissed }: Props) {
  return (
    <IonModal className="sheet is-anchored" isOpen={isOpen} onDidDismiss={onDismissed}>
      {field && <Sheet field={field} onClose={onClose} />}
    </IonModal>
  );
}

const range = (length: number, step = 1, from = 0) =>
  Array.from({ length }, (_, index) => from + index * step);

const MINUTES = range(60);
const SECONDS = range(12, 5);
const COUNTS = range(50, 1, 1);
const SECONDS_SHORTCUTS = [20, 30, 45, 60, 90, 120, 180];
const COUNT_SHORTCUTS = [1, 2, 3, 4, 5, 8, 10, 12];

const twoDigits = (value: number) => String(value).padStart(2, "0");
/** The wheels move in steps of 5 seconds. */
const toStep = (seconds: number) => Math.min(59 * 60 + 55, Math.round(seconds / 5) * 5);

function Sheet({ field, onClose }: { field: SheetField; onClose: () => void }) {
  const isCount = field.unit === "count";
  const [value, setValue] = useState(isCount ? field.value : toStep(field.value));
  const [title, setTitle] = useState(field.title);
  const t = useMessages();

  function confirm() {
    // An empty name falls back to the one the step had when the sheet opened.
    field.onConfirm(value, title.trim() || field.title);
    onClose();
  }

  function remove() {
    field.onDelete?.();
    onClose();
  }

  const shortcuts = isCount ? COUNT_SHORTCUTS : SECONDS_SHORTCUTS;

  return (
    <div className="sheet-body duration">
      <div className="duration-heading">
        {field.color && (
          <span className="duration-dot" style={{ background: field.color, color: field.color }} />
        )}
        {field.renamable ? (
          <input
            className="display"
            style={{ "--field-color": field.color } as CSSProperties}
            aria-label={t.duration.stepName}
            value={title}
            maxLength={24}
            autoComplete="off"
            enterKeyHint="done"
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
        ) : (
          <h2 className="display">{title}</h2>
        )}
      </div>

      <div className={isCount ? "duration-wheels is-single" : "duration-wheels"}>
        <div className="duration-highlight" aria-hidden="true" />
        {isCount ? (
          <Wheel
            label={field.title}
            values={COUNTS}
            value={value}
            onChange={setValue}
            format={(count) => `×${count}`}
          />
        ) : (
          <>
            <Wheel
              label={t.duration.minutes}
              values={MINUTES}
              value={Math.floor(value / 60)}
              onChange={(minutes) => setValue(minutes * 60 + (value % 60))}
              format={twoDigits}
              unit="min"
            />
            <Wheel
              label={t.duration.seconds}
              values={SECONDS}
              value={value % 60}
              onChange={(seconds) => setValue(Math.floor(value / 60) * 60 + seconds)}
              format={twoDigits}
              unit="s"
            />
          </>
        )}
      </div>

      <div className="duration-shortcuts">
        <span>{t.duration.shortcuts}</span>
        <div>
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut}
              className="display"
              aria-pressed={shortcut === value}
              onClick={() => setValue(shortcut)}
            >
              {isCount ? `×${shortcut}` : formatDuration(shortcut)}
            </button>
          ))}
        </div>
      </div>

      <button className="cta" onClick={confirm}>
        {t.duration.confirm}
      </button>
      {field.onDelete && (
        <button className="text-button duration-delete" onClick={remove}>
          {t.duration.deleteStep}
        </button>
      )}
    </div>
  );
}
