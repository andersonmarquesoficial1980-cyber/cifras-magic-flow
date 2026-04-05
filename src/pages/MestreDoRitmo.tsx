import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Volume2, Music, ChevronUp, ChevronDown, X, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// ── Rhythm pattern types ──

type StrokeType = 'down' | 'up' | 'mute' | 'rest';

interface RhythmPattern {
  id: string;
  name: string;
  timeSignature: string;
  defaultBpm: number;
  beats: StrokeType[];
  description: string;
}

const PATTERNS: RhythmPattern[] = [
  {
    id: 'pop-rock',
    name: 'Pop/Rock 4/4',
    timeSignature: '4/4',
    defaultBpm: 100,
    beats: ['down', 'down', 'up', 'up', 'down', 'up', 'mute', 'up'],
    description: 'Batida básica pop/rock — ↓ ↓↑ ↑↓↑ X↑',
  },
  {
    id: 'guarania',
    name: 'Guarânia',
    timeSignature: '3/4',
    defaultBpm: 80,
    beats: ['down', 'rest', 'up', 'down', 'rest', 'up'],
    description: 'Ritmo sertanejo clássico em compasso ternário',
  },
  {
    id: 'valsa',
    name: 'Valsa',
    timeSignature: '3/4',
    defaultBpm: 90,
    beats: ['down', 'up', 'up', 'down', 'up', 'up'],
    description: 'Compasso 3/4 elegante — ↓ ↑ ↑',
  },
  {
    id: 'worship',
    name: 'Worship',
    timeSignature: '4/4',
    defaultBpm: 72,
    beats: ['down', 'rest', 'up', 'rest', 'down', 'up', 'rest', 'up'],
    description: 'Batida suave para louvor e adoração',
  },
];

const PRACTICE_CHORDS = ['G', 'C', 'D', 'Em', 'Am', 'F', 'A', 'E'];

function getStrokeSymbol(s: StrokeType) {
  switch (s) {
    case 'down': return '↓';
    case 'up': return '↑';
    case 'mute': return 'X';
    case 'rest': return '·';
  }
}

function getStrokeColor(s: StrokeType) {
  switch (s) {
    case 'down': return 'text-[#FACC15]';
    case 'up': return 'text-[#3B82F6]';
    case 'mute': return 'text-[#EF4444]';
    case 'rest': return 'text-white/20';
  }
}

function getStrokeBorder(s: StrokeType) {
  switch (s) {
    case 'down': return 'border-[#FACC15]/40';
    case 'up': return 'border-[#3B82F6]/40';
    case 'mute': return 'border-[#EF4444]/40';
    case 'rest': return 'border-white/[0.06]';
  }
}

// ── Audio engine ──

function createClickSound(ctx: AudioContext, time: number, type: StrokeType) {
  if (type === 'rest') return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'mute') {
    // Percussive muted hit
    osc.type = 'square';
    osc.frequency.value = 100;
    filter.type = 'highpass';
    filter.frequency.value = 800;
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.start(time);
    osc.stop(time + 0.05);
  } else if (type === 'down') {
    // Strong downstroke
    osc.type = 'triangle';
    osc.frequency.value = 220;
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.start(time);
    osc.stop(time + 0.12);

    // Add a noise burst
    const noiseOsc = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    noiseOsc.type = 'sawtooth';
    noiseOsc.frequency.value = 600;
    noiseOsc.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseGain.gain.setValueAtTime(0.08, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    noiseOsc.start(time);
    noiseOsc.stop(time + 0.06);
  } else {
    // Lighter upstroke
    osc.type = 'triangle';
    osc.frequency.value = 330;
    filter.type = 'lowpass';
    filter.frequency.value = 3000;
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.start(time);
    osc.stop(time + 0.08);
  }
}

// ── Component ──

const MestreDoRitmo = () => {
  const [pattern, setPattern] = useState<RhythmPattern>(PATTERNS[0]);
  const [bpm, setBpm] = useState(PATTERNS[0].defaultBpm);
  const [playing, setPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [practiceChord, setPracticeChord] = useState('G');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const beatIndexRef = useRef(0);
  const nextBeatTimeRef = useRef(0);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const stopPlayback = useCallback(() => {
    setPlaying(false);
    setCurrentBeat(-1);
    beatIndexRef.current = 0;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPlayback = useCallback(() => {
    const ctx = getAudioCtx();
    beatIndexRef.current = 0;
    setPlaying(true);

    const subdivisionInterval = (60 / bpm / 2) * 1000; // each arrow is a subdivision

    const tick = () => {
      const idx = beatIndexRef.current % pattern.beats.length;
      setCurrentBeat(idx);

      createClickSound(ctx, ctx.currentTime, pattern.beats[idx]);

      beatIndexRef.current++;
    };

    tick(); // play first immediately
    timerRef.current = window.setInterval(tick, subdivisionInterval);
  }, [bpm, pattern, getAudioCtx]);

  const togglePlayback = useCallback(() => {
    if (playing) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [playing, startPlayback, stopPlayback]);

  // Play example once
  const playExample = useCallback(() => {
    const ctx = getAudioCtx();
    const subdivDuration = 60 / bpm / 2;

    pattern.beats.forEach((beat, i) => {
      createClickSound(ctx, ctx.currentTime + i * subdivDuration, beat);
    });

    // Visual cursor for the example
    let i = 0;
    setCurrentBeat(0);
    const interval = window.setInterval(() => {
      i++;
      if (i >= pattern.beats.length) {
        clearInterval(interval);
        setCurrentBeat(-1);
        return;
      }
      setCurrentBeat(i);
    }, subdivDuration * 1000);
  }, [bpm, pattern, getAudioCtx]);

  // Stop on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Reset when pattern changes
  useEffect(() => {
    stopPlayback();
    setBpm(pattern.defaultBpm);
  }, [pattern.id]);

  const progress = currentBeat >= 0 ? ((currentBeat + 1) / pattern.beats.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Link to="/estude">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">Mestre do Ritmo</h1>
          <p className="text-[11px] text-muted-foreground">Treine batidas no tempo certo</p>
        </div>
      </div>

      {/* Progress bar synced to beat */}
      <div className="px-4 mb-4">
        <Progress value={progress} className="h-1.5 bg-white/[0.06] [&>div]:bg-[#10B981] [&>div]:transition-all [&>div]:duration-100" />
      </div>

      {/* Pattern selector pills */}
      <div className="px-4 mb-6">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Padrão de Ritmo</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PATTERNS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPattern(p)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                pattern.id === p.id
                  ? 'bg-[#10B981] text-black font-bold shadow-[0_0_16px_-4px_rgba(16,185,129,0.5)]'
                  : 'bg-white/[0.04] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.08]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 italic">{pattern.description}</p>
      </div>

      {/* Arrow visualizer */}
      <div className="px-4 mb-6">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {pattern.beats.map((beat, i) => (
              <motion.div
                key={`${pattern.id}-${i}`}
                animate={currentBeat === i ? { scale: 1.3 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className={`
                  flex items-center justify-center w-11 h-14 rounded-xl border-2 transition-colors duration-100
                  ${currentBeat === i
                    ? `${getStrokeBorder(beat)} bg-white/[0.08] shadow-lg`
                    : `border-white/[0.04] bg-white/[0.02]`
                  }
                `}
              >
                <span className={`text-2xl font-bold select-none ${currentBeat === i ? getStrokeColor(beat) : 'text-white/30'}`}>
                  {getStrokeSymbol(beat)}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px]">
            <span className="flex items-center gap-1"><ChevronDown className="h-3 w-3 text-[#FACC15]" /> Baixo</span>
            <span className="flex items-center gap-1"><ChevronUp className="h-3 w-3 text-[#3B82F6]" /> Cima</span>
            <span className="flex items-center gap-1"><X className="h-3 w-3 text-[#EF4444]" /> Abafada</span>
            <span className="text-white/20">· Pausa</span>
          </div>
        </div>
      </div>

      {/* BPM control */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setBpm(b => Math.max(40, b - 5))}
            className="border-white/10 h-10 w-10"
            disabled={playing}
          >
            <span className="text-lg font-bold">−</span>
          </Button>
          <div className="text-center min-w-[80px]">
            <span className="text-3xl font-mono font-bold text-foreground">{bpm}</span>
            <p className="text-[10px] text-muted-foreground">BPM</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setBpm(b => Math.min(200, b + 5))}
            className="border-white/10 h-10 w-10"
            disabled={playing}
          >
            <span className="text-lg font-bold">+</span>
          </Button>
        </div>
      </div>

      {/* Play/stop + example buttons */}
      <div className="px-4 mb-6 flex items-center justify-center gap-3">
        <Button
          onClick={togglePlayback}
          className={`h-14 w-14 rounded-full ${
            playing
              ? 'bg-[#EF4444] hover:bg-[#DC2626]'
              : 'bg-[#10B981] hover:bg-[#059669]'
          } text-white shadow-lg`}
          size="icon"
        >
          {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </Button>
        <Button
          onClick={playExample}
          variant="outline"
          className="border-white/10 gap-2"
          disabled={playing}
        >
          <Volume2 className="h-4 w-4 text-[#10B981]" />
          Tocar Exemplo
        </Button>
      </div>

      {/* Practice chord selector */}
      <div className="px-4 pb-8">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Acorde para Prática</p>
        <div className="flex gap-2 flex-wrap">
          {PRACTICE_CHORDS.map((chord) => (
            <button
              key={chord}
              onClick={() => setPracticeChord(chord)}
              className={`rounded-lg px-4 py-2.5 text-sm font-mono font-bold transition-all ${
                practiceChord === chord
                  ? 'bg-[#FACC15]/20 border border-[#FACC15]/40 text-[#FACC15] shadow-[0_0_12px_-4px_rgba(250,204,21,0.4)]'
                  : 'bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:bg-white/[0.06]'
              }`}
            >
              {chord}
            </button>
          ))}
        </div>

        {/* Big chord display */}
        <div className="mt-4 flex items-center justify-center">
          <div className="rounded-2xl border border-[#FACC15]/20 bg-[#FACC15]/[0.04] px-10 py-6 text-center">
            <Music className="h-5 w-5 text-[#FACC15]/60 mx-auto mb-1" />
            <span className="text-4xl font-mono font-bold text-[#FACC15]">{practiceChord}</span>
            <p className="text-[10px] text-muted-foreground mt-1">Toque este acorde</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MestreDoRitmo;
