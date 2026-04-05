import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Minus, Plus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AutoScrollBarProps {
  bpm?: number | null;
}

// Exponential curve: ultra-smooth at low levels, aggressive at high
function speedToPxPerFrame(level: number): number {
  // level 1→0.05, 2→0.12, 3→0.28, 4→0.55, 5→0.95, 6→1.5, 7→2.3, 8→3.5, 9→5.2, 10→7.5
  return 0.05 * Math.pow(2.15, level - 1);
}

function bpmToDefaultSpeed(bpm: number): number {
  if (bpm <= 0) return 3;
  if (bpm < 70) return 2;
  if (bpm < 100) return 3;
  if (bpm < 130) return 4;
  if (bpm < 160) return 5;
  return 6;
}

export function AutoScrollBar({ bpm }: AutoScrollBarProps) {
  const defaultSpeed = bpm && bpm > 0 ? bpmToDefaultSpeed(bpm) : 2;
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(defaultSpeed);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const accumRef = useRef(0);

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
    const pxPerFrame = speedToPxPerFrame(speed);
    accumRef.current = 0;

    const tick = () => {
      accumRef.current += pxPerFrame;
      if (accumRef.current >= 1) {
        const whole = Math.floor(accumRef.current);
        window.scrollBy(0, whole);
        accumRef.current -= whole;
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
      <button onClick={() => setSpeed(s => Math.max(1, s - 1))} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
        <Minus size={14} />
      </button>
      <Slider min={1} max={10} step={1} value={[speed]} onValueChange={([v]) => setSpeed(v)} className="w-24" />
      <span className="text-xs font-mono text-muted-foreground w-4 text-center">{speed}</span>
      <button onClick={() => setSpeed(s => Math.min(10, s + 1))} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
        <Plus size={14} />
      </button>
    </div>
  );
}
