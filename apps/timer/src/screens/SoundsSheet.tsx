import { IonModal } from "@ionic/react";
import { useMessages } from "../i18n/useMessages";
import { playSound, unlockAudio } from "../platform/cues";
import { isIos } from "../platform/ios";
import {
  SOUND_EVENTS,
  SOUND_VARIANTS,
  SOUNDS,
  type SoundChoice,
  type SoundEvent,
  type SoundVariant,
} from "../platform/sounds";
import "./SoundsSheet.css";

interface Props {
  isOpen: boolean;
  sounds: SoundChoice;
  onChange: (event: SoundEvent, variant: SoundVariant) => void;
  onClose: () => void;
}

/** The choice of a variant for each sound of a session. Tapping a variant plays it. */
export function SoundsSheet({ isOpen, sounds, onChange, onClose }: Props) {
  const t = useMessages();

  function pick(event: SoundEvent, variant: SoundVariant) {
    // The tap is what allows the sound to play.
    unlockAudio();
    playSound(SOUNDS[event][variant]);
    onChange(event, variant);
  }

  return (
    <IonModal
      className="sheet"
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={1}
      breakpoints={[0, 1]}
    >
      <div className="sheet-body sounds">
        <div className="sounds-top">
          <h2 className="display">{t.sounds.title}</h2>
          <button className="text-button is-strong" onClick={onClose}>
            {t.common.done}
          </button>
        </div>

        {SOUND_EVENTS.map((event) => (
          <div key={event} className="sounds-group">
            <span id={`sounds-${event}`}>{t.sounds.events[event]}</span>
            <div className="sounds-variants" role="radiogroup" aria-labelledby={`sounds-${event}`}>
              {SOUND_VARIANTS.map((variant) => (
                <button
                  key={variant}
                  role="radio"
                  aria-checked={sounds[event] === variant}
                  onClick={() => pick(event, variant)}
                >
                  {t.sounds.variants[variant]}
                </button>
              ))}
            </div>
          </div>
        ))}

        {isIos(navigator) && <p className="sounds-note">{t.sounds.silentModeNote}</p>}
      </div>
    </IonModal>
  );
}
