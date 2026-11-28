import { IonReorder } from "@ionic/react";
import { ChevronIcon, HandleIcon } from "../components/icons";
import "./EditorScreen.css";

interface Props {
  name: string;
  hint: string;
  value: string;
  /** Color of the dot. Without it the row shows an empty ring (a count, not a phase). */
  dot?: string;
  /** Text in the dot, which then grows into a badge: the number of a block. */
  badge?: string;
  reorderable?: boolean;
  onClick: () => void;
}

/** One line of a group in an editor: a value to set, with its name and a hint. */
export function EditorRow({ name, hint, value, dot, badge, reorderable = false, onClick }: Props) {
  const dotClass = !dot ? "editor-row-dot is-ring" : badge ? "editor-row-dot is-badge display" : "editor-row-dot";
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
        <span className={dotClass} style={{ background: dot }}>
          {badge}
        </span>
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
