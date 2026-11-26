import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useIonAlert } from "@ionic/react";
import { CloseIcon, RotateIcon } from "../components/icons";
import { useMessages } from "../i18n/useMessages";
import { isBetter, viewAttempt } from "../model/challenge";
import { formatDuration, PHASE_COLORS, type ChallengeGoal, type Timer } from "../model/timer";
import { playSound, say, vibrate } from "../platform/cues";
import { SOUNDS, type SoundChoice } from "../platform/sounds";
import { useWakeLock } from "../platform/useWakeLock";
import "./SessionScreen.css";
import "./ChallengeSession.css";

interface Props {
  timer: Timer;
  goal: ChallengeGoal;
  /** The time to beat, in seconds, when the challenge already has results. */
  best?: number;
  /** The variant to play for each sound. */
  sounds: SoundChoice;
  onStop: () => void;
  /** The user stopped the stopwatch on this many seconds. */
  onFinish: (seconds: number) => void;
}

const TICK_MS = 100;

/**
 * An attempt at a challenge, on the session screen: the preparation counts
 * down, then a stopwatch counts up until the user taps the one large button.
 */
export function ChallengeSession({ timer, goal, best, sounds, onStop, onFinish }: Props) {
  const t = useMessages();
  const [attempt] = useState(() => ({
    startedAt: Date.now(),
    prepareSeconds: timer.prepareSeconds,
  }));
  const [now, setNow] = useState(attempt.startedAt);
  const [rotated, setRotated] = useState(false);
  const [presentAlert] = useIonAlert();
  const { options } = timer;

  useWakeLock(options.keepAwake);

  // The interval only asks for a fresh look at the clock; the time comes from `viewAttempt`.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const { running, seconds } = viewAttempt(attempt, now);

  // Cues at the start of the preparation, then at the start of the stopwatch.
  // The ref makes sure each one plays once, whatever caused the render.
  const announced = useRef<boolean | null>(null);
  useEffect(() => {
    if (announced.current === running) return;
    announced.current = running;

    playSound(SOUNDS.phaseStart[sounds.phaseStart]);
    if (options.voice) say(running ? t.challenge.sayGo : t.phases.prepare, t.speechLang);
    if (options.vibration) vibrate();
  }, [running, options, sounds, t]);

  const beepedSecond = useRef(0);
  useEffect(() => {
    if (!options.countdown || running || seconds < 1 || seconds > 3) return;
    if (beepedSecond.current === seconds) return;
    beepedSecond.current = seconds;
    playSound(SOUNDS.countdown[sounds.countdown]);
  }, [options.countdown, sounds, running, seconds]);

  function finish() {
    // The clock, not the last render: the tap is the measure.
    const result = viewAttempt(attempt, Date.now()).seconds;
    const isRecord = best !== undefined && isBetter(result, best, goal);

    playSound(SOUNDS.finish[sounds.finish]);
    if (options.voice) say(isRecord ? t.challenge.sayRecord : t.session.sayFinished, t.speechLang);
    if (options.vibration) vibrate();
    onFinish(result);
  }

  function confirmStop() {
    void presentAlert({
      header: t.session.confirmStop,
      buttons: [
        { text: t.session.keepGoing, role: "cancel" },
        { text: t.session.stopAction, role: "destructive", handler: onStop },
      ],
    });
  }

  const phaseName = running ? t.challenge.go : t.phases.prepare;
  const time = formatDuration(seconds);
  const color = running ? PHASE_COLORS.work : PHASE_COLORS.prepare;

  return (
    <div className="session-viewport" style={{ "--phase": color } as CSSProperties}>
      <div className={rotated ? "session is-rotated" : "session"}>
        <div className="session-layout">
          <div className="session-primary">
            <div className="session-top">
              <button className="session-round-button" aria-label={t.session.stop} onClick={confirmStop}>
                <CloseIcon />
              </button>
              <span className="session-title challenge-title">
                <span className="challenge-title-name">{timer.name}</span>
                {best !== undefined && <span> · {t.challenge.bestSoFar(formatDuration(best))}</span>}
              </span>
              <button
                className="session-round-button session-rotate"
                aria-label={rotated ? t.session.portrait : t.session.landscape}
                onClick={() => setRotated(!rotated)}
              >
                <RotateIcon />
              </button>
            </div>

            <div className="session-clock">
              <span
                className="session-phase display"
                style={{ "--characters": phaseName.length } as CSSProperties}
              >
                {phaseName}
              </span>
              <span
                className={time.length > 4 ? "session-time display is-long" : "session-time display"}
                role="timer"
                aria-label={`${phaseName}, ${time}`}
              >
                {time}
              </span>
            </div>
          </div>

          <div className="session-secondary">
            <button className="challenge-finish display" disabled={!running} onClick={finish}>
              {t.challenge.finish}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
