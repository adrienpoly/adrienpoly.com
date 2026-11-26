import { useState } from "react";
import { IonModal } from "@ionic/react";
import { Wheel } from "../components/Wheel";
import { useMessages } from "../i18n/useMessages";
import { dateInputValue, withDate, type Result } from "../model/challenge";
import "./DurationSheet.css";
import "./ResultSheet.css";

interface Props {
  isOpen: boolean;
  /** The result to correct, or the one being added. It stays set while the sheet animates out. */
  result: Result | null;
  /** True when `result` has not been saved yet: there is nothing to delete. */
  isNew: boolean;
  onSave: (result: Result) => void;
  onDelete: (result: Result) => void;
  /** Asks the owner to close the sheet. */
  onClose: () => void;
  /** The sheet has finished closing. */
  onDismissed: () => void;
}

/** Adds a result by hand, or corrects one: its time, with wheels, and its date. */
export function ResultSheet({ isOpen, result, onDismissed, ...rest }: Props) {
  return (
    <IonModal className="sheet is-anchored" isOpen={isOpen} onDidDismiss={onDismissed}>
      {result && <Sheet key={result.id} result={result} {...rest} />}
    </IonModal>
  );
}

const range = (length: number) => Array.from({ length }, (_, index) => index);
const MINUTES = range(100);
const SECONDS = range(60);
const twoDigits = (value: number) => String(value).padStart(2, "0");

type SheetProps = Pick<Props, "isNew" | "onSave" | "onDelete" | "onClose"> & { result: Result };

function Sheet({ result, isNew, onSave, onDelete, onClose }: SheetProps) {
  const t = useMessages();
  const [seconds, setSeconds] = useState(Math.min(Math.round(result.seconds), 99 * 60 + 59));
  const [day, setDay] = useState(dateInputValue(result.at));

  function confirm() {
    onSave({ ...result, seconds, at: withDate(result.at, day) });
    onClose();
  }

  function remove() {
    onDelete(result);
    onClose();
  }

  return (
    <div className="sheet-body duration">
      <div className="duration-heading">
        <h2 className="display">{isNew ? t.challenge.newResult : t.challenge.correctResult}</h2>
      </div>

      <label className="result-date">
        <span>{t.challenge.date}</span>
        <input
          type="date"
          value={day}
          max={dateInputValue(Date.now())}
          onChange={(event) => setDay(event.target.value)}
        />
      </label>

      <div className="duration-wheels">
        <div className="duration-highlight" aria-hidden="true" />
        <Wheel
          label={t.duration.minutes}
          values={MINUTES}
          value={Math.floor(seconds / 60)}
          onChange={(minutes) => setSeconds(minutes * 60 + (seconds % 60))}
          format={twoDigits}
          unit="min"
        />
        <Wheel
          label={t.duration.seconds}
          values={SECONDS}
          value={seconds % 60}
          onChange={(value) => setSeconds(Math.floor(seconds / 60) * 60 + value)}
          format={twoDigits}
          unit="s"
        />
      </div>

      <button className="cta" disabled={seconds === 0 || day === ""} onClick={confirm}>
        {t.duration.confirm}
      </button>
      {!isNew && (
        <button className="text-button duration-delete" onClick={remove}>
          {t.challenge.deleteResult}
        </button>
      )}
    </div>
  );
}
