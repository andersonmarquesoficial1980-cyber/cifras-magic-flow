import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Trophy, Zap, BarChart3, RotateCcw, Volume2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// ── Interval definitions ──

interface IntervalDef {
  id: string;
  name: string;
  semitones: number;
  hint: string;
  hintSong: string;
}

const INTERVALS: IntervalDef[] = [
  { id: '2m', name: '2ª Menor', semitones: 1, hint: '🦈 Tema do Tubarão', hintSong: 'Tubarão (Jaws)' },
  { id: '2M', name: '2ª Maior', semitones: 2, hint: '🎂 Parabéns pra Você', hintSong: 'Parabéns pra Você' },
  { id: '3m', name: '3ª Menor', semitones: 3, hint: '💔 Greensleeves', hintSong: 'Greensleeves' },
  { id: '3M', name: '3ª Maior', semitones: 4, hint: '🌅 Oh When The Saints', hintSong: 'When The Saints Go Marching In' },
  { id: '4J', name: '4ª Justa', semitones: 5, hint: '🇧🇷 Hino Nacional Brasileiro', hintSong: 'Hino Nacional' },
  { id: '5J', name: '5ª Justa', semitones: 7, hint: '⭐ Tema de Star Wars', hintSong: 'Star Wars' },
];

const BASE_FREQ = 261.63; // C4

function freqFromSemitones(semitones: number) {
  return BASE_FREQ * Math.pow(2, semitones / 12);
}

// ── Audio ──

function playNote(ctx: AudioContext, freq: number, startTime: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.3, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playInterval(ctx: AudioContext, semitones: number) {
  const now = ctx.currentTime;
  playNote(ctx, BASE_FREQ, now, 0.6);
  playNote(ctx, freqFromSemitones(semitones), now + 0.7, 0.8);
}

function playFeedback(ctx: AudioContext, success: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  if (success) {
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } else {
    osc.type = 'sawtooth';
    osc.frequency.value = 180;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  }
}

// ── Component ──

type GamePhase = 'menu' | 'playing' | 'feedback' | 'stats';

interface Stats {
  [intervalId: string]: { correct: number; wrong: number };
}

const OuvidoBionico = () => {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [currentInterval, setCurrentInterval] = useState<IntervalDef>(INTERVALS[0]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [questionStart, setQuestionStart] = useState(0);
  const [round, setRound] = useState(0);
  const [stats, setStats] = useState<Stats>(() => {
    const s: Stats = {};
    INTERVALS.forEach(i => { s[i.id] = { correct: 0, wrong: 0 }; });
    return s;
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const pickRandom = useCallback(() => {
    return INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setStreak(0);
    setRound(0);
    setStats(prev => {
      const s: Stats = {};
      INTERVALS.forEach(i => { s[i.id] = { correct: 0, wrong: 0 }; });
      return s;
    });
    nextQuestion();
  }, []);

  const nextQuestion = useCallback(() => {
    const interval = pickRandom();
    setCurrentInterval(interval);
    setSelected(null);
    setPhase('playing');
    setRound(r => r + 1);
    setQuestionStart(Date.now());

    // Auto-play the interval
    setTimeout(() => {
      const ctx = getCtx();
      playInterval(ctx, interval.semitones);
    }, 300);
  }, [pickRandom, getCtx]);

  const replayInterval = useCallback(() => {
    const ctx = getCtx();
    playInterval(ctx, currentInterval.semitones);
  }, [currentInterval, getCtx]);

  const handleAnswer = useCallback((intervalId: string) => {
    if (selected) return;
    setSelected(intervalId);

    const correct = intervalId === currentInterval.id;
    setIsCorrect(correct);

    const ctx = getCtx();
    playFeedback(ctx, correct);

    // Time bonus: faster = more points (max 100, min 10)
    const elapsed = (Date.now() - questionStart) / 1000;
    const timeBonus = Math.max(10, Math.round(100 - elapsed * 10));

    if (correct) {
      setScore(s => s + timeBonus);
      setStreak(s => {
        const next = s + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }

    setStats(prev => ({
      ...prev,
      [currentInterval.id]: {
        correct: prev[currentInterval.id].correct + (correct ? 1 : 0),
        wrong: prev[currentInterval.id].wrong + (correct ? 0 : 1),
      },
    }));

    setPhase('feedback');
  }, [selected, currentInterval, questionStart, getCtx]);

  const totalQuestions = Object.values(stats).reduce((a, s) => a + s.correct + s.wrong, 0);
  const worstIntervals = [...INTERVALS]
    .map(i => ({ ...i, errorRate: stats[i.id].wrong / Math.max(1, stats[i.id].correct + stats[i.id].wrong) }))
    .filter(i => stats[i.id].correct + stats[i.id].wrong > 0)
    .sort((a, b) => b.errorRate - a.errorRate);

  // ── Menu ──
  if (phase === 'menu') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <Link to="/estude"><Button variant="ghost" size="icon" className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Ouvido Biônico</h1>
            <p className="text-[11px] text-muted-foreground">Treine sua percepção de intervalos</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="rounded-full h-28 w-28 bg-[#A855F7]/10 border-2 border-[#A855F7]/30 flex items-center justify-center shadow-[0_0_40px_-8px_rgba(168,85,247,0.4)]">
            <Zap className="h-14 w-14 text-[#A855F7]" />
          </div>

          <div className="text-center">
            <h2 className="font-display text-lg font-bold text-foreground">Identifique Intervalos</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              Ouça duas notas e identifique a distância entre elas. Quanto mais rápido, mais pontos!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
            {INTERVALS.map(i => (
              <div key={i.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                <span className="text-xs font-mono font-bold text-[#A855F7]">{i.name}</span>
              </div>
            ))}
          </div>

          <Button onClick={startGame} className="bg-[#A855F7] hover:bg-[#9333EA] text-white mt-4 px-8">
            <Play className="h-4 w-4 mr-2" /> Começar
          </Button>

          {bestStreak > 0 && (
            <p className="text-xs text-muted-foreground">Melhor sequência: <span className="text-[#A855F7] font-bold">{bestStreak}</span></p>
          )}
        </div>
      </div>
    );
  }

  // ── Stats ──
  if (phase === 'stats') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col">
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <button onClick={() => setPhase('menu')} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-display text-lg font-bold text-foreground">Evolução</h1>
        </div>

        <div className="px-4 pb-8 flex flex-col gap-4">
          {/* Summary */}
          <div className="rounded-2xl border border-[#A855F7]/20 bg-[#A855F7]/[0.04] p-5 text-center">
            <div className="flex justify-center gap-8">
              <div>
                <span className="text-2xl font-mono font-bold text-[#A855F7]">{score}</span>
                <p className="text-[10px] text-muted-foreground">Pontos</p>
              </div>
              <div>
                <span className="text-2xl font-mono font-bold text-[#10B981]">{bestStreak}</span>
                <p className="text-[10px] text-muted-foreground">Melhor Sequência</p>
              </div>
              <div>
                <span className="text-2xl font-mono font-bold text-foreground">{totalQuestions}</span>
                <p className="text-[10px] text-muted-foreground">Rodadas</p>
              </div>
            </div>
          </div>

          {/* Per-interval breakdown */}
          <p className="text-xs text-muted-foreground mt-2">Desempenho por Intervalo</p>
          {INTERVALS.map(interval => {
            const s = stats[interval.id];
            const total = s.correct + s.wrong;
            const pct = total > 0 ? Math.round((s.correct / total) * 100) : 0;
            const barColor = pct >= 70 ? 'bg-[#10B981]' : pct >= 40 ? 'bg-[#FACC15]' : 'bg-[#EF4444]';
            return (
              <div key={interval.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-mono font-bold text-foreground">{interval.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {total > 0 ? `${pct}% (${s.correct}/${total})` : '—'}
                  </span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}

          {/* Worst intervals hint */}
          {worstIntervals.length > 0 && worstIntervals[0].errorRate > 0 && (
            <div className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/[0.04] p-4 mt-2">
              <p className="text-xs text-[#EF4444] font-bold mb-1">🎯 Foque o treino em:</p>
              {worstIntervals.slice(0, 2).map(i => (
                <p key={i.id} className="text-xs text-muted-foreground">
                  {i.name} — Dica: {i.hint}
                </p>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button onClick={startGame} className="bg-[#A855F7] hover:bg-[#9333EA] text-white flex-1">
              <RotateCcw className="h-4 w-4 mr-2" /> Jogar novamente
            </Button>
            <Button variant="outline" onClick={() => setPhase('menu')} className="border-white/10">
              Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Playing / Feedback ──
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => { setPhase('stats'); }} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[#FACC15]">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-mono font-bold">{streak}</span>
            </div>
            <div className="flex items-center gap-1 text-[#A855F7]">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-mono font-bold">{score}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={round}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center w-full max-w-sm"
          >
            {/* Reference badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#A855F7]/30 bg-[#A855F7]/10 px-4 py-1.5 mb-4">
              <span className="text-xs font-mono font-bold text-[#A855F7]">Dó (C4)</span>
              <span className="text-xs text-muted-foreground">→ ?</span>
            </div>

            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Qual é o intervalo?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Rodada {round}
            </p>

            {/* Replay button */}
            <Button
              onClick={replayInterval}
              variant="outline"
              size="sm"
              className="border-[#A855F7]/30 text-[#A855F7] mb-6 gap-2"
              disabled={phase === 'feedback'}
            >
              <Volume2 className="h-4 w-4" /> Ouvir novamente
            </Button>

            {/* Answer grid */}
            <div className="grid grid-cols-3 gap-3">
              {INTERVALS.map((interval) => {
                let style = 'border-white/10 bg-white/[0.03] text-foreground hover:border-[#A855F7]/40 hover:bg-[#A855F7]/[0.06]';
                if (phase === 'feedback' && selected) {
                  if (interval.id === currentInterval.id) {
                    style = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]';
                  } else if (interval.id === selected) {
                    style = 'border-red-500 bg-red-500/10 text-red-400';
                  } else {
                    style = 'border-white/[0.04] bg-white/[0.01] text-muted-foreground opacity-40';
                  }
                }
                return (
                  <motion.button
                    key={interval.id}
                    whileTap={phase !== 'feedback' ? { scale: 0.95 } : {}}
                    onClick={() => handleAnswer(interval.id)}
                    disabled={phase === 'feedback'}
                    className={`rounded-xl border p-3 text-center transition-all ${style}`}
                  >
                    <span className="text-sm font-mono font-bold block">{interval.name}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            {phase === 'feedback' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                {isCorrect ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                    <p className="text-sm text-emerald-400 font-bold">✅ Correto!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sequência: {streak} | Bônus de velocidade aplicado
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left">
                    <p className="text-sm text-red-400 font-bold mb-2">❌ Era {currentInterval.name}</p>
                    <p className="text-xs text-muted-foreground">
                      💡 <span className="text-[#A855F7] font-medium">{currentInterval.hint}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                      Lembre da música: "{currentInterval.hintSong}"
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-5 justify-center">
                  <Button onClick={nextQuestion} className="bg-[#A855F7] hover:bg-[#9333EA] text-white">
                    Próxima
                  </Button>
                  <Button variant="outline" onClick={() => setPhase('stats')} className="border-white/10 gap-2">
                    <BarChart3 className="h-4 w-4" /> Estatísticas
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OuvidoBionico;
