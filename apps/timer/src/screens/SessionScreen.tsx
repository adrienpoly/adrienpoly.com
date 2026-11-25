import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useIonAlert } from "@ionic/react";
import {
  CloseIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RotateIcon,
} from "../components/icons";
import {
  createSession,
  isFinished,
  isPaused,
  pause,
  resume,
  skipBack,
  skipForward,
  sync,
  view,
} from "../model/session";
import {
  buildPhases,
  formatDuration,
  PHASE_COLORS,
  type Phase,
  type PhaseKind,
  type Timer,
} from "../model/timer";
import { playSound, say, vibrate } from "../platform/cues";
import { SOUNDS, type SoundChoice } from "../platform/sounds";
import { useMessages } from "../i18n/useMessages";
import { useWakeLock } from "../platform/useWakeLock";
import "./SessionScreen.css";

export interface SessionResult {
  timer: Timer;
  finishedAt: number;
  /** Time (ms) really spent in each kind of phase. */
  spentMs: Record<PhaseKind, number>;
}

interface Props {
  timer: Timer;
  /** The variant to play for each sound. */
  sounds: SoundChoice;
  onStop: () => void;
  onFinish: (result: SessionResult) => void;
}

const TICK_MS = 100;

/** Screens 5 and 5b: the running session, full screen in the color of the phase. */
export function SessionScreen({ timer, sounds, onStop, onFinish }: Props) {
  const t = useMessages();
  const phases = useMemo(() => buildPhases(timer, t.phases), [timer, t]);
  const [session, setSession] = useState(() => createSession(phases, Date.now()));
  const [now, setNow] = useState(() => Date.now());
  const [rotated, setRotated] = useState(false);
  const [presentAlert] = useIonAlert();
  const { options } = timer;

  useWakeLock(options.keepAwake);

  // The interval only asks for a fresh look at the clock; all timing comes from `sync`.
  useEffect(() => {
    const interval = setInterval(() => {
      const time = Date.now();
      setNow(time);
      setSession((current) => sync(current, time));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const { phase, nextPhase, phaseRemainingSeconds, totalRemainingSeconds } = view(session, now);
  const paused = isPaused(session);

  // Cues at the start of each phase and at the end of the session. The refs
  // make sure each one plays once, whatever caused the render.
  const announcedIndex = useRef(-1);
  useEffect(() => {
    if (announcedIndex.current === session.index) return;
    announcedIndex.current = session.index;

    if (isFinished(session)) {
      playSound(SOUNDS.finish[sounds.finish]);
      if (options.voice) say(t.session.sayFinished, t.speechLang);
      if (options.vibration) vibrate();
      onFinish({ timer, finishedAt: Date.now(), spentMs: session.spentMs });
      return;
    }

    const current = session.phases[session.index];
    playSound(SOUNDS.phaseStart[sounds.phaseStart]);
    if (options.voice) {
      say(isLastRound(current, timer) ? t.session.sayLastRound(current.name) : current.name, t.speechLang);
    }
    if (options.vibration) vibrate();
  }, [session, timer, options, sounds, onFinish, t]);

  const beepedSecond = useRef("");
  useEffect(() => {
    if (!options.countdown || paused || phaseRemainingSeconds < 1 || phaseRemainingSeconds > 3) return;
    const second = `${session.index}:${phaseRemainingSeconds}`;
    if (beepedSecond.current === second) return;
    beepedSecond.current = second;
    playSound(SOUNDS.countdown[sounds.countdown]);
  }, [options.countdown, sounds, paused, session.index, phaseRemainingSeconds]);

  function confirmStop() {
    void presentAlert({
      header: t.session.confirmStop,
      buttons: [
        { text: t.session.keepGoing, role: "cancel" },
        { text: t.session.stopAction, role: "destructive", handler: onStop },
      ],
    });
  }

  if (!phase) return null;

  const time = formatDuration(phaseRemainingSeconds);
  const color = PHASE_COLORS[phase.kind];

  return (
    <div className="session-viewport" style={{ "--phase": color } as CSSProperties}>
      <div className={rotated ? "session is-rotated" : "session"}>
        <div className="session-progress" aria-hidden="true">
          {phases.map((segment, index) => (
            <span
              key={index}
              className={index <= session.index ? "is-reached" : undefined}
              style={{ flexGrow: segment.seconds }}
            />
          ))}
        </div>

        <div className="session-layout">
          <div className="session-primary">
            <div className="session-top">
              <button className="session-round-button" aria-label={t.session.stop} onClick={confirmStop}>
                <CloseIcon />
              </button>
              <span className="session-title">
                {timer.name} · <span>{t.session.remaining(formatDuration(totalRemainingSeconds))}</span>
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
                style={{ "--characters": phase.name.length } as CSSProperties}
              >
                {phase.name}
              </span>
              <span
                className={time.length > 4 ? "session-time display is-long" : "session-time display"}
                role="timer"
                aria-label={`${phase.name}, ${time}`}
              >
                {time}
              </span>
            </div>
          </div>

          <div className="session-secondary">
            <div className="session-counters">
              <Counter label={t.session.round} value={phase.round} of={timer.rounds} />
              <Counter label={t.session.cycle} value={phase.cycle} of={timer.cycles} />
            </div>

            <div className="session-next">
              {nextPhase ? (
                <>
                  <span className="session-next-dot" style={{ background: PHASE_COLORS[nextPhase.kind] }} />
                  <span className="session-next-label">
                    {t.session.next} <strong>{nextPhase.name}</strong>
                  </span>
                  <span className="session-next-time display">{formatDuration(nextPhase.seconds)}</span>
                </>
              ) : (
                <span className="session-next-label">
                  {t.session.next} <strong>{t.session.finished}</strong>
                </span>
              )}
            </div>

            <div className="session-controls">
              <button
                className="session-skip"
                aria-label={t.session.previousPhase}
                onClick={() => setSession((current) => skipBack(current, Date.now()))}
              >
                <PreviousIcon />
              </button>
              <button
                className="session-pause"
                aria-label={paused ? t.session.resume : t.session.pause}
                onClick={() =>
                  setSession((current) => (paused ? resume(current, Date.now()) : pause(current, Date.now())))
                }
              >
                {paused ? <PlayIcon size={34} /> : <PauseIcon />}
              </button>
              <button
                className="session-skip"
                aria-label={t.session.nextPhase}
                onClick={() => setSession((current) => skipForward(current, Date.now()))}
              >
                <NextIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Counter({ label, value, of }: { label: string; value: number; of: number }) {
  return (
    <div className="session-counter">
      <span className="session-counter-value display">
        {value}
        <span>/{of}</span>
      </span>
      <span className="session-counter-label">{label}</span>
    </div>
  );
}

/** True for effort phases of the last round of the last cycle, when there is more than one round. */
function isLastRound(phase: Phase, timer: Timer): boolean {
  return (
    phase.kind === "work" &&
    timer.rounds * timer.cycles > 1 &&
    phase.round === timer.rounds &&
    phase.cycle === timer.cycles
  );
}
