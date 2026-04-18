import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, Minus, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TIME_SIGNATURES = ['2/4', '3/4', '4/4'] as const;

function createClick(ctx: AudioContext, time: number, isAccent: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = isAccent ? 1000 : 800;
  gain.gain.setValueAtTime(isAccent ? 0.6 : 0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  osc.start(time);
  osc.stop(time + 0.05);
}

const Metronomo = () => {
  const navigate = useNavigate();
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [timeSig, setTimeSig] = useState<typeof TIME_SIGNATURES[number]>('4/4');
  const [currentBeat, setCurrentBeat] = useState(-1);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const timerRef = useRef<number>(0);
  const playingRef = useRef(false);

  const beatsPerMeasure = parseInt(timeSig.split('/')[0]);

  const schedule = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !playingRef.current) return;

    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const beat = currentBeatRef.current;
      createClick(ctx, nextNoteTimeRef.current, beat === 0);
      setCurrentBeat(beat);
      currentBeatRef.current = (beat + 1) % beatsPerMeasure;
      nextNoteTimeRef.current += 60 / bpm;
    }
    timerRef.current = window.setTimeout(schedule, 25);
  }, [bpm, beatsPerMeasure]);

  const start = useCallback(() => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    currentBeatRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime;
    playingRef.current = true;
    setPlaying(true);
    schedule();
  }, [schedule]);

  const stop = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    setCurrentBeat(-1);
    clearTimeout(timerRef.current);
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }, []);

  // Restart scheduler when bpm/timeSig changes while playing
  useEffect(() => {
    if (playingRef.current) {
      clearTimeout(timerRef.current);
      currentBeatRef.current = 0;
      if (audioCtxRef.current) {
        nextNoteTimeRef.current = audioCtxRef.current.currentTime;
      }
      schedule();
    }
  }, [bpm, beatsPerMeasure, schedule]);

  useEffect(() => () => { stop(); }, [stop]);

  const adjustBpm = (delta: number) => {
    setBpm((prev) => Math.max(40, Math.min(250, prev + delta)));
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)}>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Metrônomo</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 px-6 pb-12">
        {/* Beat visualizer */}
        <div className="flex gap-4">
          {Array.from({ length: beatsPerMeasure }, (_, i) => {
            const isActive = currentBeat === i;
            const isAccent = i === 0;
            return (
              <motion.div
                key={i}
                animate={isActive ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`h-16 w-16 rounded-full border-2 transition-colors ${
                  isActive
                    ? isAccent
                      ? 'bg-chord/30 border-chord shadow-[0_0_25px_-3px_hsl(47,95%,54%,0.5)]'
                      : 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_-3px_hsl(160,84%,39%,0.4)]'
                    : 'bg-white/[0.03] border-white/10'
                }`}
              />
            );
          })}
        </div>

        {/* Central pulse */}
        <div className="relative flex items-center justify-center">
          {playing && (
            <motion.div
              key={currentBeat}
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 60 / bpm * 0.9, ease: 'easeOut' }}
              className="absolute h-40 w-40 rounded-full border-2 border-chord/40"
            />
          )}
          <motion.div
            animate={playing && currentBeat >= 0 ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.12 }}
            className={`h-40 w-40 rounded-full flex items-center justify-center border-2 transition-colors ${
              playing
                ? currentBeat === 0
                  ? 'border-chord bg-chord/10'
                  : 'border-emerald-500/60 bg-emerald-500/5'
                : 'border-white/10 bg-white/[0.03]'
            }`}
          >
            <span className="text-5xl font-display font-bold text-foreground">{bpm}</span>
          </motion.div>
        </div>

        {/* BPM controls */}
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustBpm(-5)}
            className="h-12 w-12 rounded-full border border-white/10 text-muted-foreground hover:text-foreground"
          >
            <Minus className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustBpm(-1)}
            className="h-10 w-10 rounded-full border border-white/10 text-muted-foreground hover:text-foreground"
          >
            <Minus className="h-3 w-3" />
          </Button>

          <span className="text-sm font-mono text-muted-foreground w-12 text-center">BPM</span>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustBpm(1)}
            className="h-10 w-10 rounded-full border border-white/10 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustBpm(5)}
            className="h-12 w-12 rounded-full border border-white/10 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Time signature */}
        <div className="flex gap-2">
          {TIME_SIGNATURES.map((ts) => (
            <button
              key={ts}
              onClick={() => setTimeSig(ts)}
              className={`rounded-lg px-4 py-2 text-sm font-mono border transition-all ${
                timeSig === ts
                  ? 'border-chord bg-chord/10 text-chord'
                  : 'border-white/10 text-muted-foreground hover:border-white/20'
              }`}
            >
              {ts}
            </button>
          ))}
        </div>

        {/* Play/Stop */}
        <Button
          onClick={playing ? stop : start}
          size="lg"
          variant="ghost"
          className={`rounded-full h-16 w-16 transition-all ${
            playing
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 shadow-[0_0_20px_-5px_hsl(0,70%,50%,0.3)]'
              : 'bg-chord/10 text-chord border border-chord/30 hover:bg-chord/20 shadow-[0_0_20px_-5px_hsl(47,95%,54%,0.3)]'
          }`}
        >
          {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </Button>
      </div>
    </div>
  );
};

export default Metronomo;
