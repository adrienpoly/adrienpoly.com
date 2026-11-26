import { useMemo } from "react";
import { IonModal } from "@ionic/react";
import { ChevronIcon } from "../components/icons";
import { SequenceBar } from "../components/SequenceBar";
import { useMessages } from "../i18n/useMessages";
import { buildPhases, TEMPLATES, type Timer } from "../model/timer";
import "./TemplatesSheet.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPick: (timer: Timer) => void;
}

/** Screen 2: choose the template a new timer starts from. */
export function TemplatesSheet({ isOpen, onClose, onPick }: Props) {
  const t = useMessages();
  // One sample timer per template, to draw its sequence bar.
  const samples = useMemo(() => TEMPLATES.map((template) => template.create(t.names)), [t]);

  return (
    <IonModal
      className="sheet"
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={1}
      breakpoints={[0, 1]}
    >
      {/* The second class tells Ionic that this element scrolls: the sheet's drag
          gesture then only starts when the list is at its top. */}
      <div className="sheet-body templates ion-content-scroll-host">
        <div>
          <button className="text-button" onClick={onClose}>
            {t.common.cancel}
          </button>
        </div>
        <h2 className="display">
          {t.templates.title[0]}
          <br />
          <span>{t.templates.title[1]}</span>
        </h2>
        <p>{t.templates.intro}</p>

        {TEMPLATES.map((template, index) => (
          <button
            key={template.id}
            className="template"
            onClick={() => onPick(template.create(t.names))}
          >
            <span className="template-badge display" style={{ background: samples[index].color }}>
              {template.badge}
            </span>
            <span className="template-text">
              <span className="template-name">{t.templates.list[template.id].name}</span>
              <span className="template-description">{t.templates.list[template.id].description}</span>
              {/* A challenge has no sequence to draw: its effort is as long as it takes. */}
              {!samples[index].challenge && (
                <SequenceBar
                  className="template-bar"
                  phases={buildPhases(samples[index], t.phases)}
                  color={samples[index].color}
                />
              )}
            </span>
            <ChevronIcon />
          </button>
        ))}
      </div>
    </IonModal>
  );
}
