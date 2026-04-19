import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Star, ChevronRight, RotateCcw, Zap, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// ── Music theory ──

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_DISPLAY: Record<string, string> = {
  'C': 'Dó', 'C#': 'Dó#', 'D': 'Ré', 'D#': 'Ré#', 'E': 'Mi', 'F': 'Fá',
  'F#': 'Fá#', 'G': 'Sol', 'G#': 'Sol#', 'A': 'Lá', 'A#': 'Lá#', 'B': 'Si',
};
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const DEGREE_LABELS = ['I', 'IIm', 'IIIm', 'IV', 'V', 'VIm', 'VIIº'];

function getHarmonicField(root: string) {
  const rootIdx = NOTES.indexOf(root);
  return MAJOR_INTERVALS.map((interval, i) => {
    const note = NOTES[(rootIdx + interval) % 12];
    const q = DEGREE_LABELS[i];
    const isMinor = q.includes('m');
    const isDim = q.includes('º');
    return {
      note,
      degree: q,
      label: note + (isMinor ? 'm' : '') + (isDim ? 'dim' : ''),
    };
  });
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Famous progressions ──

const FAMOUS_PROGRESSIONS = [
  { name: 'Pop clássico', degrees: [0, 4, 5, 3] },   // I V VIm IV
  { name: 'Blues básico', degrees: [0, 3, 4, 0] },   // I IV V I
  { name: 'Balada', degrees: [5, 4, 0, 3] },         // VIm V I IV
  { name: 'Samba/Bossa', degrees: [0, 3, 4, 3] },    // I IV V IV
  { name: 'Clichê gospel', degrees: [0, 4, 3, 0] },  // I V IV I
  { name: 'Melancólica', degrees: [5, 3, 0, 4] },    // VIm IV I V
  { name: 'Rock progressivo', degrees: [0, 2, 3, 4] }, // I IIIm IV V
  { name: 'Ritmo de adoração', degrees: [0, 3, 5, 4] }, // I IV VIm V
];

// ── Audio ──

function playTone(success: boolean) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (success) {
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.frequency.value = 220;
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    }
  } catch {}
}

// ── Types ──

interface ChordQuestion {
  root: string;
  progressionName: string;
  chords: { label: string; degree: string }[];
  currentChordIdx: number;
  options: string[];
}

function generateRound(): ChordQuestion {
  const root = pickRandom(NOTES);
  const field = getHarmonicField(root);
  const prog = pickRandom(FAMOUS_PROGRESSIONS);
  const chords = prog.degrees.map(i => ({ label: field[i].label, degree: field[i].degree }));

  // Options for current chord (index 0 on first call)
  const correct = chords[0].degree;
  const wrongs = new Set<string>();
  while (wrongs.size < 3) {
    const w = pickRandom(DEGREE_LABELS);
    if (w !== correct) wrongs.add(w);
  }
  const options = shuffle([correct, ...Array.from(wrongs)]);

  return { root, progressionName: prog.name, chords, currentChordIdx: 0, options };
}

function advanceChord(q: ChordQuestion): ChordQuestion {
  const next = q.currentChordIdx + 1;
  const correct = q.chords[next].degree;
  const wrongs = new Set<string>();
  while (wrongs.size < 3) {
    const w = pickRandom(DEGREE_LABELS);
    if (w !== correct) wrongs.add(w);
  }
  return { ...q, currentChordIdx: next, options: shuffle([correct, ...Array.from(wrongs)]) };
}

const ROUNDS = 6;
const TIME_PER_CHORD = 12; // seconds

type GameState = 'intro' | 'playing' | 'result';

// ── Component ──

const CifraRapida = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('intro');
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [question, setQuestion] = useState<ChordQuestion>(() => generateRound());
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_CHORD);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // total chord steps across all rounds: 4 chords × ROUNDS
  const totalSteps = ROUNDS * 4;
  const currentStep = roundIdx * 4 + question.currentChordIdx;
  const progressPct = (currentStep / totalSteps) * 100;

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(TIME_PER_CHORD);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearTimer();
          setTimedOut(true);
          setSelected('__timeout__');
          setCombo(0);
          playTone(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setRoundIdx(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setQuestion(generateRound());
    setSelected(null);
    setTimedOut(false);
    startTimer();
  }, [startTimer]);

  // Cleanup timer on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  const isLastChordInRound = question.currentChordIdx === question.chords.length - 1;
  const isLastRound = roundIdx + 1 >= ROUNDS;

  const handleAnswer = useCallback((answer: string) => {
    if (selected) return;
    clearTimer();
    setSelected(answer);
    const correct = answer === question.chords[question.currentChordIdx].degree;
    playTone(correct);
    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      // Combo bonus: +2 on 3+, +3 on 5+
      const bonus = newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1;
      setScore(s => s + bonus);
    } else {
      setCombo(0);
    }
  }, [selected, question, combo, clearTimer]);

  const next = useCallback(() => {
    if (isLastChordInRound) {
      if (isLastRound) {
        setGameState('result');
        return;
      }
      setRoundIdx(r => r + 1);
      setQuestion(generateRound());
    } else {
      setQuestion(q => advanceChord(q));
    }
    setSelected(null);
    setTimedOut(false);
    startTimer();
  }, [isLastChordInRound, isLastRound, startTimer]);

  // ── Intro ──
  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-[0_0_40px_-8px_rgba(245,158,11,0.3)] mb-6">
            <Zap className="h-10 w-10 text-amber-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-3">Cifra Rápida</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            Vejo a progressão, você identifica os graus. Rápido, no tempo, sem enrolação.
          </p>
          <div className="mt-4 mb-8 flex flex-col gap-2 text-left bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs text-muted-foreground">⚡ <span className="text-foreground">Combo bônus:</span> acerte 3+ seguidos para multiplicar pontos</p>
            <p className="text-xs text-muted-foreground">⏱ <span className="text-foreground">Timer:</span> {TIME_PER_CHORD}s por acorde — não deixa esfriar</p>
            <p className="text-xs text-muted-foreground">🎵 <span className="text-foreground">Progressões reais:</span> pop, gospel, blues, bossa e mais</p>
          </div>
          <Button onClick={startGame} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-base">
            <Zap className="h-4 w-4 mr-2" /> Começar
          </Button>
          <button onClick={() => navigate(-1)} className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Voltar
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Result ──
  if (gameState === 'result') {
    const stars = score >= totalSteps * 2.5 ? 3 : score >= totalSteps * 1.5 ? 2 : 1;
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm w-full">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10 border-2 border-amber-500/30 shadow-[0_0_40px_-8px_rgba(245,158,11,0.4)] mb-6">
            <Trophy className="h-12 w-12 text-amber-400" />
          </div>
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3].map(s => (
              <Star key={s} className={`h-7 w-7 ${s <= stars ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`} />
            ))}
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {stars === 3 ? 'Incrível! 🔥' : stars === 2 ? 'Muito bom! 💪' : 'Continue treinando!'}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="text-2xl font-mono font-bold text-amber-400">{score}</p>
              <p className="text-xs text-muted-foreground mt-1">Pontos</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="text-2xl font-mono font-bold text-[#3B82F6]">{maxCombo}x</p>
              <p className="text-xs text-muted-foreground mt-1">Combo máximo</p>
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <Button onClick={startGame} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold">
              <RotateCcw className="h-4 w-4 mr-2" /> Jogar de novo
            </Button>
            <Button variant="outline" onClick={() => navigate('/estude')} className="flex-1 border-white/10">
              Trilha
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Playing ──
  const currentChord = question.chords[question.currentChordIdx];
  const timerPct = (timeLeft / TIME_PER_CHORD) * 100;
  const timerColor = timeLeft <= 3 ? 'text-red-400' : timeLeft <= 6 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => { clearTimer(); navigate('/estude'); }} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {combo >= 2 && (
              <motion.span
                key={combo}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-xs font-mono font-bold text-amber-400"
              >
                🔥 {combo}x
              </motion.span>
            )}
            <div className={`flex items-center gap-1 font-mono text-sm font-bold ${timerColor}`}>
              <Clock className="h-4 w-4" />
              {timeLeft}s
            </div>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-4 w-4 fill-amber-400" />
              <span className="text-sm font-mono font-bold">{score}</span>
            </div>
          </div>
        </div>
        {/* Timer bar */}
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-2">
          <motion.div
            className={`h-full rounded-full transition-colors ${timeLeft <= 3 ? 'bg-red-500' : timeLeft <= 6 ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${timerPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <Progress value={progressPct} className="h-1 bg-white/[0.04] [&>div]:bg-[#3B82F6]/40" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${roundIdx}-${question.currentChordIdx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            {/* Round info */}
            <div className="text-center mb-6">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Progressão {roundIdx + 1}/{ROUNDS} · {question.progressionName}
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5">
                <span className="text-xs font-mono font-bold text-amber-400">{question.root}</span>
                <span className="text-xs text-muted-foreground">{NOTE_DISPLAY[question.root]} Maior</span>
              </div>
            </div>

            {/* Progression display */}
            <div className="flex justify-center gap-2 mb-8">
              {question.chords.map((chord, i) => {
                const isDone = i < question.currentChordIdx;
                const isCurrent = i === question.currentChordIdx;
                return (
                  <div
                    key={i}
                    className={`flex-1 max-w-[70px] rounded-xl border p-3 text-center transition-all ${
                      isDone
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : isCurrent
                        ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]'
                        : 'border-white/[0.05] bg-white/[0.02] opacity-40'
                    }`}
                  >
                    <p className={`text-sm font-mono font-bold ${
                      isDone ? 'text-emerald-400' : isCurrent ? 'text-amber-400' : 'text-muted-foreground'
                    }`}>
                      {isDone ? chord.degree : isCurrent ? chord.label : '?'}
                    </p>
                    {isDone && (
                      <p className="text-[9px] text-emerald-400/60 mt-0.5">{chord.label}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Question */}
            <h2 className="font-display text-lg font-bold text-center text-foreground mb-6">
              Qual o grau de <span className="text-amber-400">{currentChord.label}</span>?
            </h2>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt) => {
                let style = 'border-white/10 bg-white/[0.03] text-foreground hover:border-amber-500/40 hover:bg-amber-500/[0.06]';
                if (selected) {
                  if (opt === currentChord.degree) {
                    style = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]';
                  } else if (opt === selected) {
                    style = 'border-red-500 bg-red-500/10 text-red-400';
                  } else {
                    style = 'border-white/[0.04] bg-white/[0.01] text-muted-foreground opacity-40';
                  }
                }
                return (
                  <motion.button
                    key={opt}
                    whileTap={!selected ? { scale: 0.95 } : {}}
                    onClick={() => handleAnswer(opt)}
                    disabled={!!selected}
                    className={`rounded-xl border p-4 text-center font-mono text-xl font-bold transition-all ${style}`}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {/* Timeout message */}
            {timedOut && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-center"
              >
                <p className="text-xs text-red-400">⏱ Tempo esgotado! Era <span className="font-bold">{currentChord.degree}</span> ({currentChord.label})</p>
              </motion.div>
            )}

            {/* Next */}
            {selected && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-6 text-center">
                <Button onClick={next} className="bg-amber-500 hover:bg-amber-400 text-black font-bold">
                  {isLastChordInRound && isLastRound ? 'Ver resultado' : 'Próximo'} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CifraRapida;
