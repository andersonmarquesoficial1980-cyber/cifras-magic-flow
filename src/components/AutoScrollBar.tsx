import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Minus, Plus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export function AutoScrollBar() {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(false);

  // Pause on manual scroll
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const onWheel = () => {
      if (playingRef.current) {
        setPlaying(false);
      }
    };
    const onTouchStart = () => {
      if (playingRef.current) {
        setPlaying(false);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
    };
  }, []);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    if (playing && speed > 0) {
      const pxPerFrame = speed * 0.35;
      const scroll = () => {
        window.scrollBy(0, pxPerFrame);
        rafRef.current = requestAnimationFrame(scroll);
      };
      rafRef.current = requestAnimationFrame(scroll);
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

      <button
        onClick={() => setSpeed(s => Math.max(1, s - 1))}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Minus size={14} />
      </button>

      <Slider
        min={1}
        max={10}
        step={1}
        value={[speed]}
        onValueChange={([v]) => setSpeed(v)}
        className="w-24"
      />

      <span className="text-xs font-mono text-muted-foreground w-4 text-center">{speed}</span>

      <button
        onClick={() => setSpeed(s => Math.min(10, s + 1))}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
