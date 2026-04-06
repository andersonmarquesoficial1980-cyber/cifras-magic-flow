import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Minus, Plus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AutoScrollBarProps {
  bpm?: number | null;
}

// px per second curve: 1-30 ultra-fine, 30-100 ramps
function speedToPxPerSec(level: number): number {
  if (level <= 30) return level * 0.8;                    // 0.8 – 24 px/s
  return 24 + Math.pow((level - 30) / 70, 1.6) * 300;    // 24 – ~324 px/s
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
  const offsetRef = useRef(0);
  const lastTimeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Find and cache the scroll container on mount
  useEffect(() => {
    containerRef.current = document.getElementById('cifra-scroll-content') as HTMLDivElement | null;
  }, []);

  // Pause on manual interaction
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

  // Sync offset with current scroll position when starting
  useEffect(() => {
    if (playing) {
      offsetRef.current = window.scrollY;
      lastTimeRef.current = 0;
      const pxPerSec = speedToPxPerSec(speed);

      const tick = (time: number) => {
        if (lastTimeRef.current === 0) {
          lastTimeRef.current = time;
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        const dt = (time - lastTimeRef.current) / 1000; // seconds
        lastTimeRef.current = time;
        offsetRef.current += pxPerSec * dt;

        // Clamp to max scroll
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (offsetRef.current > maxScroll) offsetRef.current = maxScroll;

        window.scrollTo(0, offsetRef.current);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
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
