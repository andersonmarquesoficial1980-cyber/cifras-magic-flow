import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, ChevronUp, ChevronDown } from 'lucide-react';

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
        const dt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;
        offsetRef.current += pxPerSec * dt;

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

  // Vertical slider height in px (track)
  const TRACK_H = 80;
  const thumbPct = (speed - 1) / 99; // 0..1, 0=slow (bottom), 1=fast (top)

  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 py-3 px-2 rounded-2xl border border-white/10 bg-background/60 backdrop-blur-xl shadow-lg">
      {/* Play/Pause */}
      <button
        onClick={() => setPlaying(!playing)}
        className={`p-2 rounded-full transition-colors ${
          playing
            ? 'bg-chord/20 text-chord shadow-[0_0_10px_2px_hsl(47,95%,54%,0.3)]'
            : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
        }`}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* Speed up */}
      <button
        onClick={() => setSpeed(s => Math.min(100, s + 5))}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronUp size={14} />
      </button>

      {/* Vertical slider track */}
      <div
        className="relative w-1.5 rounded-full bg-white/10 cursor-pointer"
        style={{ height: TRACK_H }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = 1 - (e.clientY - rect.top) / rect.height;
          setSpeed(Math.round(Math.max(0, Math.min(1, pct)) * 99 + 1));
        }}
      >
        {/* filled portion */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-all"
          style={{
            height: `${thumbPct * 100}%`,
            background: playing ? 'hsl(47,95%,54%)' : 'hsl(var(--muted-foreground))',
            opacity: playing ? 1 : 0.5,
          }}
        />
        {/* thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 transition-all"
          style={{
            bottom: `calc(${thumbPct * 100}% - 7px)`,
            borderColor: playing ? 'hsl(47,95%,54%)' : 'hsl(var(--muted-foreground))',
            background: 'hsl(var(--background))',
          }}
        />
      </div>

      {/* Speed down */}
      <button
        onClick={() => setSpeed(s => Math.max(1, s - 5))}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown size={14} />
      </button>

      {/* Speed label */}
      <span className="text-[9px] font-mono text-muted-foreground">{speed}</span>
    </div>
  );
}
