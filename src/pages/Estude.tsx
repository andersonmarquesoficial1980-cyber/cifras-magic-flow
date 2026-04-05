import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, BookOpen, Lock, Star, ChevronRight, RotateCcw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// ── Music theory data ──

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
    const quality = DEGREE_LABELS[i];
    const isMinor = quality.includes('m');
    const isDim = quality.includes('º');
    return {
      note,
      degree: quality,
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

// ── Audio feedback ──

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
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.frequency.value = 220;
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {}
}

// ── Quiz question generator ──

function generateQuestion() {
  const root = pickRandom(NOTES);
  const field = getHarmonicField(root);
  const degreeIdx = Math.floor(Math.random() * 7);
  const correct = field[degreeIdx];

  // Generate 3 wrong answers from other keys or other degrees
  const wrongs = new Set<string>();
  while (wrongs.size < 3) {
    const randomRoot = pickRandom(NOTES);
    const randomField = getHarmonicField(randomRoot);
    const randomDeg = pickRandom(randomField);
    if (randomDeg.label !== correct.label) {
      wrongs.add(randomDeg.label);
    }
  }

  const options = shuffle([correct.label, ...Array.from(wrongs)]);

  return {
    root,
    rootDisplay: NOTE_DISPLAY[root] + ' Maior',
    degree: correct.degree,
    correctAnswer: correct.label,
    options,
    explanation: `No tom de ${NOTE_DISPLAY[root]} Maior, o campo harmônico é: ${field.map(f => f.label).join(' – ')}. O ${correct.degree} é ${correct.label}.`,
  };
}

const TOTAL_QUESTIONS = 10;

// ── Trail cards ──

const TRAIL = [
  { id: 'harmonic-field', title: 'Mestre do Campo Harmônico', desc: 'Identifique os graus de qualquer tom', icon: Star, unlocked: true, route: null },
  { id: 'rhythm-master', title: 'Mestre do Ritmo', desc: 'Treine batidas e levadas no tempo', icon: BookOpen, unlocked: true, route: '/estude/ritmo' },
  { id: 'inversions', title: 'Inversões & Baixos', desc: 'Domine acordes invertidos', icon: BookOpen, unlocked: false, route: null },
  { id: 'progressions', title: 'Progressões Famosas', desc: 'Reconheça I-V-VIm-IV e mais', icon: Trophy, unlocked: false, route: null },
];

type GameState = 'trail' | 'playing' | 'result';

const Estude = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState>('trail');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState(() => generateQuestion());
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [medals, setMedals] = useState(0);

  const isCorrect = selected === question.correctAnswer;
  const progress = ((questionIdx) / TOTAL_QUESTIONS) * 100;

  const startGame = useCallback(() => {
    setGameState('playing');
    setQuestionIdx(0);
    setScore(0);
    setQuestion(generateQuestion());
    setSelected(null);
    setShowExplanation(false);
  }, []);

  const handleAnswer = useCallback((answer: string) => {
    if (selected) return;
    setSelected(answer);
    const correct = answer === question.correctAnswer;
    playTone(correct);
    if (correct) {
      setScore(s => s + 1);
    } else {
      setShowExplanation(true);
    }
  }, [selected, question]);

  const nextQuestion = useCallback(() => {
    if (questionIdx + 1 >= TOTAL_QUESTIONS) {
      setMedals(m => m + 1);
      setGameState('result');
      return;
    }
    setQuestionIdx(i => i + 1);
    setQuestion(generateQuestion());
    setSelected(null);
    setShowExplanation(false);
  }, [questionIdx]);

  // ── Trail View ──
  if (gameState === 'trail') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <Link to="/"><Button variant="ghost" size="icon" className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="font-display text-xl font-bold text-foreground">Estude</h1>
          {medals > 0 && (
            <div className="ml-auto flex items-center gap-1.5 text-[#3B82F6]">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-mono font-bold">{medals}</span>
            </div>
          )}
        </div>

        <div className="px-6 pt-4 pb-8 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground mb-2">Trilha de Aprendizado</p>
          {TRAIL.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <button
                onClick={() => card.unlocked && startGame()}
                disabled={!card.unlocked}
                className={`w-full flex items-center gap-4 rounded-2xl border p-5 text-left transition-all ${
                  card.unlocked
                    ? 'border-[#3B82F6]/30 bg-[#3B82F6]/[0.06] hover:bg-[#3B82F6]/[0.12] hover:border-[#3B82F6]/50 active:scale-[0.98] shadow-[0_0_30px_-8px_rgba(59,130,246,0.2)]'
                    : 'border-white/[0.04] bg-white/[0.02] opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  card.unlocked ? 'bg-[#3B82F6]/20' : 'bg-white/[0.05]'
                }`}>
                  {card.unlocked ? (
                    <card.icon className="h-6 w-6 text-[#3B82F6]" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-display font-bold ${card.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{card.desc}</p>
                </div>
                {card.unlocked && <ChevronRight className="h-5 w-5 text-[#3B82F6]/60 shrink-0" />}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ── Result View ──
  if (gameState === 'result') {
    const percent = Math.round((score / TOTAL_QUESTIONS) * 100);
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#3B82F6]/10 border-2 border-[#3B82F6]/30 shadow-[0_0_40px_-8px_rgba(59,130,246,0.4)] mb-6">
            <Trophy className="h-12 w-12 text-[#3B82F6]" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {percent >= 70 ? 'Medalha Conquistada! 🏅' : 'Continue Treinando!'}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Você acertou <span className="text-[#3B82F6] font-bold">{score}</span> de {TOTAL_QUESTIONS} perguntas ({percent}%)
          </p>

          <div className="flex gap-3 mt-8">
            <Button onClick={startGame} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
              <RotateCcw className="h-4 w-4 mr-2" /> Jogar novamente
            </Button>
            <Button variant="outline" onClick={() => setGameState('trail')} className="border-white/10">
              Voltar à trilha
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Quiz View ──
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setGameState('trail')} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-mono text-muted-foreground">
            {questionIdx + 1}/{TOTAL_QUESTIONS}
          </span>
          <div className="flex items-center gap-1 text-[#3B82F6]">
            <Star className="h-4 w-4" />
            <span className="text-sm font-mono font-bold">{score}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2 bg-white/[0.06] [&>div]:bg-[#3B82F6]" />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={questionIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center w-full max-w-md"
          >
            {/* Key badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-4 py-1.5 mb-6">
              <span className="text-xs text-[#3B82F6] font-mono font-bold">{question.root}</span>
              <span className="text-xs text-muted-foreground">{question.rootDisplay}</span>
            </div>

            <h2 className="font-display text-xl font-bold text-foreground leading-relaxed">
              Quem é o <span className="text-[#3B82F6]">{question.degree}</span> desse tom?
            </h2>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              {question.options.map((opt) => {
                let style = 'border-white/10 bg-white/[0.03] text-foreground hover:border-[#3B82F6]/40 hover:bg-[#3B82F6]/[0.06]';
                if (selected) {
                  if (opt === question.correctAnswer) {
                    style = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]';
                  } else if (opt === selected) {
                    style = 'border-red-500 bg-red-500/10 text-red-400';
                  } else {
                    style = 'border-white/[0.04] bg-white/[0.01] text-muted-foreground opacity-50';
                  }
                }
                return (
                  <motion.button
                    key={opt}
                    whileTap={!selected ? { scale: 0.95 } : {}}
                    onClick={() => handleAnswer(opt)}
                    disabled={!!selected}
                    className={`rounded-xl border p-4 text-center font-mono text-lg font-bold transition-all ${style}`}
                  >
                    {opt}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation on wrong answer */}
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {question.explanation}
                </p>
              </motion.div>
            )}

            {/* Next button */}
            {selected && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <Button
                  onClick={nextQuestion}
                  className="mt-6 bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                >
                  {questionIdx + 1 >= TOTAL_QUESTIONS ? 'Ver resultado' : 'Próxima'} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Estude;
