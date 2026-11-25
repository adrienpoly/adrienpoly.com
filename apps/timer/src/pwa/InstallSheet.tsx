import { IonModal } from "@ionic/react";
import { ShareIcon } from "../components/icons";
import { useMessages } from "../i18n/useMessages";
import type { InstallGuide } from "./installGuide";
import "./Install.css";

interface Props {
  isOpen: boolean;
  guide: InstallGuide;
  onClose: () => void;
}

/** The steps to install the app by hand, for browsers that have no install dialog. */
export function InstallSheet({ isOpen, guide, onClose }: Props) {
  const t = useMessages();

  return (
    <IonModal
      className="sheet"
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={1}
      breakpoints={[0, 1]}
    >
      <div className="sheet-body install-sheet">
        <div className="install-sheet-top">
          <h2 className="display">{t.install.title}</h2>
          <button className="text-button is-strong" onClick={onClose}>
            {t.common.done}
          </button>
        </div>

        <ol className="install-steps">
          {t.install.steps[guide].map((step, index) => (
            <li key={step}>
              <span className="install-step-number display" aria-hidden="true">
                {index + 1}
              </span>
              <span className="install-step-text">{step}</span>
              {/* On iOS the first step is the Share button: show what it looks like. */}
              {guide === "ios" && index === 0 && (
                <span className="install-step-icon">
                  <ShareIcon />
                </span>
              )}
            </li>
          ))}
        </ol>

        <p className="install-note">{t.install.notes[guide]}</p>
        <p className="install-note">{t.install.alreadyInstalled}</p>
      </div>
    </IonModal>
  );
}
