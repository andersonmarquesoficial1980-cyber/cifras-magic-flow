import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Minus, Plus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AutoScrollBarProps {
  bpm?: number | null;
}

// Ultra-fine curve: 1-40 nearly flat (0.01–0.4px/frame), 40-100 ramps up
function speedToPx(level: number): number {
  if (level <= 40) return level * 0.01;           // 0.01 → 0.40
  return 0.4 + Math.pow((level - 40) / 60, 1.8) * 6; // 0.4 → ~6.4
}

function bpmToDefault(bpm: number): number {
  if (bpm <= 0) return 15;
  if (bpm < 70) return 10;
  if (bpm < 100) return 18;
  if (bpm < 130) return 25;
  if (bpm < 160) return 35;
  return 45;
}

export function AutoScrollBar({ bpm }: AutoScrollBarProps) {
  const def = bpm && bpm > 0 ? bpmToDefault(bpm) : 15;
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(def);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const accum = useRef(0);

  useEffect(() => {
    const pause = () => { if (playingRef.current) setPlaying(false); };
    window.addEventListener('wheel', pause, { passive: true });
    window.addEventListener('touchstart', pause, { passive: true });
    return () => {
      window.removeEventListener('wheel', pause);
      window.removeEventListener('touchstart', pause);
    };
  }, []);

  useEffect(() => { playingRef.current = playing; }, [playing]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const pxPerFrame = speedToPx(speed);
    accum.current = 0;

    const tick = () => {
      accum.current += pxPerFrame;
      if (accum.current >= 1) {
        const px = Math.floor(accum.current);
        window.scrollBy(0, px);
        accum.current -= px;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, speed]);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/10 bg-background/70 backdrop-blur-xl shadow-xl">
      <button
        onClick={() => setPlaying(!playing)}
        className={`p-2 rounded-full transition-colors ${playing ? 'bg-chord/20 text-chord' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <button onClick={() => setSpeed(s => Math.max(1, s - 5))} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
        <Minus size={14} />
      </button>
      <Slider min={1} max={100} step={1} value={[speed]} onValueChange={([v]) => setSpeed(v)} className="w-32" />
      <span className="text-[11px] font-mono text-muted-foreground min-w-[24px] text-center">{speed}</span>
      <button onClick={() => setSpeed(s => Math.min(100, s + 5))} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} />
      </button>
    </div>
  );
}
