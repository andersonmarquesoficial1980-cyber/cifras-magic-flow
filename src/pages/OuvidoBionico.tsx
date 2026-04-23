import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Music4, Play, RotateCcw, Volume2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type GamePhase = 'idle' | 'listening' | 'answering' | 'feedback';

type ChordQuality = 'maj' | 'min' | 'dim';

interface DegreeDef {
  roman: string;
  quality: ChordQuality;
}

interface RoundQuestion {
  key: string;
  progression: number[];
}

const TOTAL_ROUNDS = 5;

const KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const NOTE_TO_SEMITONE: Record<(typeof KEYS)[number], number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11] as const;

const DEGREES: DegreeDef[] = [
  { roman: 'I', quality: 'maj' },
  { roman: 'ii', quality: 'min' },
  { roman: 'iii', quality: 'min' },
  { roman: 'IV', quality: 'maj' },
  { roman: 'V', quality: 'maj' },
  { roman: 'vi', quality: 'min' },
  { roman: 'vii°', quality: 'dim' },
];

const PROGRESSION_LIBRARY: number[][] = [
  [0, 5, 3, 4], // I vi IV V
  [0, 4, 5, 3], // I V vi IV
  [0, 3, 4, 0], // I IV V I
  [5, 3, 0, 4], // vi IV I V
  [1, 4, 0, 5], // ii V I vi
  [0, 2, 5, 4], // I iii vi V
  [0, 3, 5, 4], // I IV vi V
  [0, 4, 3, 4], // I V IV V
];

const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
};

const CHORD_STEP_SECONDS = 1.05;
const CHORD_HOLD_SECONDS = 0.82;

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function midiToFrequency(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function scheduleChord(
  ctx: AudioContext,
  chordMidiNotes: number[],
  startTime: number,
  holdSeconds: number,
  velocity = 0.2,
) {
  chordMidiNotes.forEach((midi, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = index === 0 ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(midiToFrequency(midi), startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, startTime);
    filter.Q.setValueAtTime(0.8, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(velocity, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + holdSeconds);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + holdSeconds + 0.05);
  });
}

function scheduleFeedback(ctx: AudioContext, isCorrect: boolean) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  if (isCorrect) {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(990, now + 0.18);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.21);
    return;
  }

  osc.type = 'square';
  osc.frequency.setValueAtTime(220, now);
  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
  osc.start(now);
  osc.stop(now + 0.27);
}

function buildRoundQuestion(): RoundQuestion {
  return {
    key: randomItem([...KEYS]),
    progression: randomItem(PROGRESSION_LIBRARY),
  };
}

export default function OuvidoBionico() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<GamePhase>('idle');
  const [roundIndex, setRoundIndex] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [question, setQuestion] = useState<RoundQuestion>(() => buildRoundQuestion());
  const [userAnswer, setUserAnswer] = useState<number[]>([]);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [activeChordIndex, setActiveChordIndex] = useState<number | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackTimerIdsRef = useRef<number[]>([]);

  const clearPlaybackTimers = useCallback(() => {
    playbackTimerIdsRef.current.forEach((id) => window.clearTimeout(id));
    playbackTimerIdsRef.current = [];
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  const playProgression = useCallback(() => {
    clearPlaybackTimers();
    setActiveChordIndex(null);

    try {
      const ctx = getAudioContext();
      const startAt = ctx.currentTime + 0.08;
      const baseMidi = 48 + NOTE_TO_SEMITONE[question.key as (typeof KEYS)[number]];

      question.progression.forEach((degreeIndex, idx) => {
        const degree = DEGREES[degreeIndex];
        const degreeRoot = baseMidi + MAJOR_SCALE_INTERVALS[degreeIndex];
        const chordMidiNotes = CHORD_INTERVALS[degree.quality].map((interval) => degreeRoot + interval);
        const chordStart = startAt + idx * CHORD_STEP_SECONDS;

        scheduleChord(ctx, chordMidiNotes, chordStart, CHORD_HOLD_SECONDS);

        const activateId = window.setTimeout(() => {
          setActiveChordIndex(idx);
        }, (chordStart - ctx.currentTime) * 1000);

        const deactivateId = window.setTimeout(() => {
          setActiveChordIndex((prev) => (prev === idx ? null : prev));
        }, (chordStart - ctx.currentTime + CHORD_HOLD_SECONDS) * 1000);

        playbackTimerIdsRef.current.push(activateId, deactivateId);
      });

      const endId = window.setTimeout(() => {
        setActiveChordIndex(null);
        setPhase('answering');
      }, question.progression.length * CHORD_STEP_SECONDS * 1000 + 180);

      playbackTimerIdsRef.current.push(endId);
      setAudioEnabled(true);
      setPhase('listening');
    } catch {
      // Fallback visual mode if Web Audio is blocked/unavailable
      setAudioEnabled(false);
      setPhase('answering');
    }
  }, [clearPlaybackTimers, getAudioContext, question]);

  const startRound = useCallback((customRoundIndex?: number) => {
    setQuestion(buildRoundQuestion());
    setUserAnswer([]);
    setLastAnswerCorrect(null);
    setActiveChordIndex(null);
    setPhase('listening');

    if (typeof customRoundIndex === 'number') {
      setRoundIndex(customRoundIndex);
    }
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    startRound(1);
  }, [startRound]);

  useEffect(() => {
    if (phase !== 'listening') {
      return;
    }

    playProgression();
  }, [phase, playProgression]);

  useEffect(() => {
    return () => {
      clearPlaybackTimers();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.close();
      }
    };
  }, [clearPlaybackTimers]);

  const isRoundComplete = userAnswer.length === question.progression.length;

  const roundedProgress = useMemo(() => {
    return Math.round((roundIndex / TOTAL_ROUNDS) * 100);
  }, [roundIndex]);

  const validateCurrentAnswer = useCallback(
    (candidate: number[]) => {
      if (candidate.length !== question.progression.length) {
        return;
      }

      const correct = candidate.every((degree, index) => degree === question.progression[index]);
      setLastAnswerCorrect(correct);

      try {
        const ctx = getAudioContext();
        scheduleFeedback(ctx, correct);
      } catch {
        // no-op
      }

      if (correct) {
        setScore((prev) => prev + 100);
        setStreak((prev) => {
          const next = prev + 1;
          setBestStreak((best) => Math.max(best, next));
          return next;
        });
      } else {
        setStreak(0);
      }

      setPhase('feedback');
    },
    [getAudioContext, question.progression],
  );

  const handleDegreeClick = useCallback(
    (degreeIndex: number) => {
      if (phase !== 'answering') {
        return;
      }

      const nextAnswer = [...userAnswer, degreeIndex];
      setUserAnswer(nextAnswer);

      if (nextAnswer.length === question.progression.length) {
        validateCurrentAnswer(nextAnswer);
      }
    },
    [phase, question.progression.length, userAnswer, validateCurrentAnswer],
  );

  const handleBackspace = useCallback(() => {
    if (phase !== 'answering' || userAnswer.length === 0) {
      return;
    }

    setUserAnswer((prev) => prev.slice(0, -1));
  }, [phase, userAnswer.length]);

  const handleNext = useCallback(() => {
    if (phase !== 'feedback') {
      return;
    }

    if (roundIndex >= TOTAL_ROUNDS) {
      setPhase('idle');
      return;
    }

    startRound(roundIndex + 1);
  }, [phase, roundIndex, startRound]);

  const answerSlots = useMemo(() => {
    return Array.from({ length: 4 }, (_, index) => userAnswer[index] ?? null);
  }, [userAnswer]);

  const currentSequenceLabel = useMemo(() => {
    return question.progression.map((index) => DEGREES[index].roman).join(' - ');
  }, [question.progression]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#0f172a_0%,#020617_55%,#000000_100%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-10 pt-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate(-1)}>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </button>

          <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            Plano Maestro
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-800/90 bg-slate-900/55 p-5 shadow-[0_24px_60px_-30px_rgba(6,182,212,0.55)]">
          <div className="mb-3 flex items-center gap-2 text-cyan-200">
            <Music4 className="h-5 w-5" />
            <h1 className="font-display text-xl font-bold">Ouvido Biônico</h1>
          </div>
          <p className="text-sm text-slate-300">
            Ditado musical: ouça uma progressão de 4 acordes e selecione os graus na ordem correta.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1">Tom: {question.key} maior</span>
            <span className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1">Rodada {roundIndex}/{TOTAL_ROUNDS}</span>
            <span className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1">Pontos: {score}</span>
            <span className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1">Streak: {streak}</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all" style={{ width: `${roundedProgress}%` }} />
          </div>
        </div>

        {phase === 'idle' ? (
          <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-6 shadow-[0_16px_40px_-25px_rgba(16,185,129,0.6)]">
              <p className="text-sm text-emerald-100">Pronto para treinar reconhecimento de progressões?</p>
              <p className="mt-2 text-xs text-slate-300">Melhor streak atual: {bestStreak}</p>
            </div>
            <Button onClick={startGame} className="h-12 rounded-xl bg-cyan-500 px-8 text-base font-semibold text-slate-950 hover:bg-cyan-400">
              <Play className="mr-2 h-4 w-4" />
              Começar treino
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-4 gap-3">
              {answerSlots.map((value, idx) => {
                const isActive = activeChordIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-4 text-center transition-all ${
                      isActive
                        ? 'border-cyan-300 bg-cyan-400/20 shadow-[0_0_30px_-10px_rgba(34,211,238,0.8)]'
                        : 'border-slate-700 bg-slate-900/70'
                    }`}
                  >
                    <p className="mb-1 text-[10px] uppercase tracking-widest text-slate-400">Acorde {idx + 1}</p>
                    <p className="font-mono text-lg font-bold text-white">{value === null ? '•' : DEGREES[value].roman}</p>
                  </div>
                );
              })}
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={playProgression}
                variant="outline"
                className="border-cyan-400/35 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
              >
                <Volume2 className="mr-2 h-4 w-4" />
                Ouvir progressão
              </Button>

              <Button
                type="button"
                onClick={handleBackspace}
                variant="outline"
                disabled={phase !== 'answering' || userAnswer.length === 0 || isRoundComplete}
                className="border-slate-600 bg-slate-800/70 text-slate-200 hover:bg-slate-700"
              >
                Corrigir último
              </Button>

              {!audioEnabled && (
                <span className="text-xs text-amber-300">
                  Audio indisponível no navegador. Continue usando apenas o modo visual.
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
              {DEGREES.map((degree, idx) => {
                const disabled = phase !== 'answering' || isRoundComplete;
                return (
                  <button
                    key={degree.roman}
                    type="button"
                    onClick={() => handleDegreeClick(idx)}
                    disabled={disabled}
                    className={`rounded-xl border px-2 py-4 text-center font-mono text-lg font-bold transition ${
                      disabled
                        ? 'cursor-not-allowed border-slate-800 bg-slate-900/45 text-slate-500'
                        : 'border-slate-700 bg-slate-900/80 text-slate-100 hover:border-emerald-300 hover:bg-emerald-500/15 hover:text-emerald-100 active:scale-[0.98]'
                    }`}
                  >
                    {degree.roman}
                  </button>
                );
              })}
            </div>

            {phase === 'feedback' && (
              <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                {lastAnswerCorrect ? (
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-semibold">Correto! +100 pontos</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-300">
                    <XCircle className="h-5 w-5" />
                    <p className="font-semibold">Não foi dessa vez.</p>
                  </div>
                )}

                <p className="mt-3 text-sm text-slate-300">Sequência correta: <span className="font-mono text-cyan-200">{currentSequenceLabel}</span></p>

                <div className="mt-4 flex gap-3">
                  <Button onClick={handleNext} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                    {roundIndex >= TOTAL_ROUNDS ? 'Ver resultado' : 'Próxima rodada'}
                  </Button>
                  <Button
                    onClick={startGame}
                    variant="outline"
                    className="border-slate-600 bg-slate-800/70 text-slate-200 hover:bg-slate-700"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reiniciar
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
