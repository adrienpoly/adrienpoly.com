import { CloseIcon, InstallIcon } from "../components/icons";
import { useMessages } from "../i18n/useMessages";
import "./Install.css";

interface Props {
  /** True when the button opens the browser's install dialog; otherwise it shows the steps. */
  canPrompt: boolean;
  onInstall: () => void;
  onHide: () => void;
}

/** The invitation to install the app, shown on the home screen in a browser tab. */
export function InstallCard({ canPrompt, onInstall, onHide }: Props) {
  const t = useMessages();

  return (
    <section className="install-card" aria-labelledby="install-card-title">
      <div className="install-card-row">
        <span className="install-card-icon">
          <InstallIcon />
        </span>
        <div className="install-card-text">
          <h2 id="install-card-title">{t.install.title}</h2>
          <p>{t.install.pitch}</p>
        </div>
        <button className="install-card-hide" aria-label={t.install.hide} onClick={onHide}>
          <CloseIcon size={16} />
        </button>
      </div>
      <button className="install-card-action" onClick={onInstall}>
        {canPrompt ? t.install.install : t.install.showSteps}
      </button>
    </section>
  );
}
