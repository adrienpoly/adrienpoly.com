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
import { effortOutcomes, type EffortOutcome } from "../model/circuit";
import {
  createSession,
  finishEffort,
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
  barSeconds,
  buildPhases,
  formatDuration,
  PHASE_COLORS,
  type Block,
  type Phase,
  type PhaseKind,
  type Timer,
} from "../model/timer";
import { playSound, say, vibrate } from "../platform/cues";
import { SOUNDS, type SoundChoice } from "../platform/sounds";
import type { Messages } from "../i18n/en";
import { useMessages } from "../i18n/useMessages";
import { useWakeLock } from "../platform/useWakeLock";
import "./SessionScreen.css";
import "./ChallengeSession.css";

export interface SessionResult {
  timer: Timer;
  finishedAt: number;
  /** Time (ms) really spent in each kind of phase. */
  spentMs: Record<PhaseKind, number>;
  /** For a circuit: how each effort went. Empty for a timer. */
  efforts: EffortOutcome[];
}

interface Props {
  timer: Timer;
  /** For a circuit: the record of each effort, in seconds, by block id. */
  records?: Record<string, number>;
  /** The variant to play for each sound. */
  sounds: SoundChoice;
  onStop: () => void;
  onFinish: (result: SessionResult) => void;
}

const TICK_MS = 100;

/**
 * Screens 5 and 5b: the running session, full screen in the color of the phase.
 * In a circuit, an effort shows a stopwatch that counts up and one large
 * button that ends it, as an attempt at a challenge does.
 */
export function SessionScreen({ timer, records = {}, sounds, onStop, onFinish }: Props) {
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

  const { phase, nextPhase, phaseElapsedSeconds, phaseRemainingSeconds, totalRemainingSeconds, effortsLeft } =
    view(session, now);
  const paused = isPaused(session);
  const blockOf = (candidate: Phase): Block | undefined =>
    candidate.block === undefined ? undefined : timer.circuit?.blocks[candidate.block];

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
      onFinish({
        timer,
        finishedAt: Date.now(),
        spentMs: session.spentMs,
        efforts: effortOutcomes(timer, session.phases, session.efforts),
      });
      return;
    }

    const current = session.phases[session.index];
    playSound(SOUNDS.phaseStart[sounds.phaseStart]);
    if (options.voice) say(announcement(current), t.speechLang);
    if (options.vibration) vibrate();
  }, [session, timer, options, sounds, onFinish, t]);

  /** What the voice says when a phase starts. */
  function announcement(current: Phase): string {
    const block = blockOf(current);
    if (current.kind === "effort" && block?.type === "effort") {
      return t.circuit.session.sayEffort(current.name, block.goal);
    }
    const intervals = block?.type === "intervals" ? block : timer;
    return isLastRound(current, intervals) ? t.session.sayLastRound(current.name) : current.name;
  }

  const beepedSecond = useRef("");
  useEffect(() => {
    if (!options.countdown || paused || phaseRemainingSeconds === null) return;
    if (phaseRemainingSeconds < 1 || phaseRemainingSeconds > 3) return;
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

  const block = blockOf(phase);
  const effort = phase.kind === "effort" && block?.type === "effort" ? block : undefined;
  // An effort counts up: its length is what is measured.
  const time = formatDuration(effort ? phaseElapsedSeconds : (phaseRemainingSeconds ?? 0));
  const color = PHASE_COLORS[phase.kind];
  const remaining = t.session.remaining(formatDuration(totalRemainingSeconds));
  const counters = countersOf(timer, phase, t);

  return (
    <div className="session-viewport" style={{ "--phase": color } as CSSProperties}>
      <div className={rotated ? "session is-rotated" : "session"}>
        <div className="session-progress" aria-hidden="true">
          {phases.map((segment, index) => (
            <span
              key={index}
              className={index <= session.index ? "is-reached" : undefined}
              style={{ flexGrow: barSeconds(segment) }}
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
                {timer.name} ·{" "}
                <span>{effortsLeft > 0 ? `${remaining} ${t.circuit.efforts(effortsLeft)}` : remaining}</span>
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
              {effort && <span className="session-goal">{t.challenge.goals[effort.goal].label}</span>}
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
              {effort ? (
                <>
                  {records[effort.id] !== undefined && (
                    <Counter label={t.circuit.session.record} value={formatDuration(records[effort.id])} />
                  )}
                  {effort.limitSeconds > 0 && (
                    <Counter label={t.circuit.session.limit} value={formatDuration(effort.limitSeconds)} />
                  )}
                </>
              ) : (
                counters.map((counter) => <Counter key={counter.label} {...counter} />)
              )}
            </div>

            <div className="session-next">
              {nextPhase ? (
                <>
                  <span className="session-next-dot" style={{ background: PHASE_COLORS[nextPhase.kind] }} />
                  <span className="session-next-label">
                    {t.session.next} <strong>{nextPhase.name}</strong>
                  </span>
                  {nextPhase.kind !== "effort" && (
                    <span className="session-next-time display">{formatDuration(nextPhase.seconds)}</span>
                  )}
                </>
              ) : (
                <span className="session-next-label">
                  {t.session.next} <strong>{t.session.finished}</strong>
                </span>
              )}
            </div>

            {effort ? (
              <button
                className="challenge-finish session-finish display"
                onClick={() => setSession((current) => finishEffort(current, Date.now()))}
              >
                {t.circuit.session.finish[effort.goal]}
              </button>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CounterProps {
  label: string;
  value: number | string;
  /** The total, shown after the value: "3/5". */
  of?: number;
}

function Counter({ label, value, of }: CounterProps) {
  return (
    <div className="session-counter">
      <span className="session-counter-value display">
        {value}
        {of !== undefined && <span>/{of}</span>}
      </span>
      <span className="session-counter-label">{label}</span>
    </div>
  );
}

/** Round and cycle for a timer; in a circuit, the block, and the round inside an intervals block. */
function countersOf(timer: Timer, current: Phase, t: Messages): CounterProps[] {
  const round = (of: { rounds: number }) => ({ label: t.session.round, value: current.round, of: of.rounds });
  if (!timer.circuit) {
    return [round(timer), { label: t.session.cycle, value: current.cycle, of: timer.cycles }];
  }
  if (current.block === undefined) return [];

  const { blocks } = timer.circuit;
  const block = blocks[current.block];
  const position = { label: t.circuit.session.block, value: current.block + 1, of: blocks.length };
  // A transition belongs to the block it leads to, but it has no rounds.
  return block?.type === "intervals" && current.kind !== "prepare" ? [position, round(block)] : [position];
}

/** True for work phases of the last round of the last cycle, when there is more than one round. */
function isLastRound(phase: Phase, intervals: { rounds: number; cycles: number }): boolean {
  return (
    phase.kind === "work" &&
    intervals.rounds * intervals.cycles > 1 &&
    phase.round === intervals.rounds &&
    phase.cycle === intervals.cycles
  );
}
