import type { CSSProperties } from "react";
import { IonModal } from "@ionic/react";
import { ChevronIcon } from "../components/icons";
import { useMessages } from "../i18n/useMessages";
import {
  blockFromTimer,
  createBlock,
  createEffort,
  type Block,
  type ChallengeGoal,
  type Timer,
} from "../model/timer";
import { BLOCK_COLORS } from "./BlockEditor";
import "./TemplatesSheet.css";
import "./AddBlockSheet.css";

interface Props {
  isOpen: boolean;
  /** The user's timers, which a block can copy. */
  timers: Timer[];
  onClose: () => void;
  onPick: (block: Block, isNew: boolean) => void;
}

/** The four kinds of blocks, efforts counted twice: one per goal. */
type Choice = "intervals" | ChallengeGoal | "rest";
const CHOICES: Choice[] = ["intervals", "shortest", "longest", "rest"];
const BADGES: Record<Choice, string> = { intervals: "T", shortest: "»", longest: "∞", rest: "II" };

/** Adds a block to a circuit: a new one of each kind, or a copy of one of the user's timers. */
export function AddBlockSheet({ isOpen, timers, onClose, onPick }: Props) {
  const t = useMessages();
  // A circuit cannot go into another one.
  const copyable = timers.filter((timer) => !timer.circuit);

  function create(choice: Choice): Block {
    if (choice === "intervals" || choice === "rest") return createBlock(choice, t.names);
    return createEffort(choice, t.names);
  }

  function copy(timer: Timer) {
    const block = blockFromTimer(timer);
    if (block) onPick(block, false);
  }

  return (
    <IonModal className="sheet" isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={1} breakpoints={[0, 1]}>
      {/* The second class tells Ionic that this element scrolls (see TemplatesSheet). */}
      <div className="sheet-body templates add-block ion-content-scroll-host">
        <div>
          <button className="text-button" onClick={onClose}>
            {t.common.cancel}
          </button>
        </div>
        <h2 className="display">{t.circuit.add.title}</h2>

        {CHOICES.map((choice) => {
          const type = choice === "shortest" || choice === "longest" ? "effort" : choice;
          return (
            <button key={choice} className="template" onClick={() => onPick(create(choice), true)}>
              <span className="template-badge display" style={{ background: BLOCK_COLORS[type] }}>
                {BADGES[choice]}
              </span>
              <span className="template-text">
                <span className="template-name">{t.circuit.add[choice].label}</span>
                <span className="template-description">{t.circuit.add[choice].hint}</span>
              </span>
              <ChevronIcon />
            </button>
          );
        })}

        {copyable.length > 0 && (
          <>
            <h3 className="add-block-copy">{t.circuit.add.copy}</h3>
            <div className="add-block-timers">
              {copyable.map((timer) => (
                <button
                  key={timer.id}
                  style={{ "--timer-color": timer.color } as CSSProperties}
                  onClick={() => copy(timer)}
                >
                  {timer.name}
                </button>
              ))}
            </div>
            <p>{t.circuit.add.copyNote}</p>
          </>
        )}
      </div>
    </IonModal>
  );
}
