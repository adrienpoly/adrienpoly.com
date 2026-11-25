import { IonModal } from "@ionic/react";
import { CheckIcon } from "../components/icons";
import { LANGUAGE_NAMES, LANGUAGES, type LanguageSetting } from "../i18n/language";
import { useMessages } from "../i18n/useMessages";
import "./SettingsSheet.css";

interface Props {
  isOpen: boolean;
  language: LanguageSetting;
  onChange: (language: LanguageSetting) => void;
  onClose: () => void;
}

/** The app's settings. For now: the language of the texts and of the voice. */
export function SettingsSheet({ isOpen, language, onChange, onClose }: Props) {
  const t = useMessages();

  const choices: Array<{ value: LanguageSetting; label: string; hint?: string }> = [
    { value: "auto", label: t.settings.automatic, hint: t.settings.automaticHint },
    ...LANGUAGES.map((value) => ({ value, label: LANGUAGE_NAMES[value] })),
  ];

  return (
    <IonModal
      className="sheet"
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={1}
      breakpoints={[0, 1]}
    >
      <div className="sheet-body settings">
        <div className="settings-top">
          <h2 className="display">{t.settings.title}</h2>
          <button className="text-button is-strong" onClick={onClose}>
            {t.common.done}
          </button>
        </div>

        <div className="settings-label">
          <span id="settings-language">{t.settings.language}</span>
          <span>{t.settings.languageHint}</span>
        </div>
        <div className="settings-choices" role="radiogroup" aria-labelledby="settings-language">
          {choices.map((choice) => (
            <button
              key={choice.value}
              role="radio"
              aria-checked={choice.value === language}
              onClick={() => onChange(choice.value)}
            >
              <span className="settings-choice-text">
                <span>{choice.label}</span>
                {choice.hint && <span>{choice.hint}</span>}
              </span>
              {choice.value === language && <CheckIcon size={20} weight={2.8} />}
            </button>
          ))}
        </div>
      </div>
    </IonModal>
  );
}
