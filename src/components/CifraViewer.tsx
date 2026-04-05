import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Musica } from '@/hooks/useMusicas';
import { isChordLine, tokenizeChordLine, chordToGrau, chordToOrdinalDegree } from '@/lib/chordDetector';
import type { DisplayMode } from '@/lib/transpose';
import { Slider } from '@/components/ui/slider';
import { MetronomBar } from '@/components/MetronomBar';
import { FlowFooter } from '@/components/FlowFooter';
import { useWakeLock } from '@/hooks/useWakeLock';
import { Badge } from '@/components/ui/badge';

interface CifraViewerProps {
  musica: Musica;
}

export function CifraViewer({ musica }: CifraViewerProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('cifra');
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); // 0 = off, 1-10
  const scrollRef = useRef<number | null>(null);

  useWakeLock(performanceMode);

  // Auto-scroll logic
  useEffect(() => {
    if (autoScrollSpeed > 0 && performanceMode) {
      const pxPerFrame = autoScrollSpeed * 0.4;
      const scroll = () => {
        window.scrollBy(0, pxPerFrame);
        scrollRef.current = requestAnimationFrame(scroll);
      };
      scrollRef.current = requestAnimationFrame(scroll);
      return () => {
        if (scrollRef.current) cancelAnimationFrame(scrollRef.current);
      };
    } else {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current);
    }
  }, [autoScrollSpeed, performanceMode]);

  const lines = musica.letra_cifrada.split('\n');

  function renderChordValue(chord: string): string {
    if (modoGrau) return chordToGrau(chord, musica.tom_original);
    return chord;
  }

  const btnSize = performanceMode ? 'p-3' : 'p-1.5';
  const btnText = performanceMode ? 'px-5 py-2.5 text-sm' : 'px-4 py-1.5 text-xs';
  const iconSize = performanceMode ? 20 : 16;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pb-16">
      <MetronomBar bpm={musica.bpm ?? 0} active={metronomeActive} />

      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 max-w-3xl">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-body">Voltar</span>
          </Link>

          <div className={`flex items-center ${performanceMode ? 'gap-4' : 'gap-3'}`}>
            {/* Performance mode toggle */}
            <button
              onClick={() => setPerformanceMode(!performanceMode)}
              className={`${btnSize} rounded-lg transition-all border ${
                performanceMode
                  ? 'bg-chord/20 border-chord text-chord'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
              title="Modo Performance"
            >
              <Zap size={iconSize} />
            </button>
            {/* Metronome toggle */}
            <button
              onClick={() => setMetronomeActive(!metronomeActive)}
              className={`${btnSize} rounded-lg transition-all border ${
                metronomeActive
                  ? 'bg-chord/20 border-chord text-chord'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
              title="Metrônomo visual"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m15.2 7.6 2.4-2.4"/><path d="M16 12h4"/><path d="M7.8 16.4 5.4 18.8"/><path d="M12 18v4"/><path d="M4 12H2"/><circle cx="12" cy="12" r="4"/></svg>
            </button>
            {/* Mode toggle */}
            <button
              onClick={() => setModoGrau(!modoGrau)}
              className={`${btnText} rounded-lg font-mono font-semibold transition-all border ${
                modoGrau
                  ? 'bg-grau text-white border-grau'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-chord'
              }`}
            >
              {modoGrau ? 'Modo Grau' : 'Modo Cifra'}
            </button>
          </div>
        </div>
      </div>

      {/* Song info */}
      <div className="container mx-auto px-4 pt-8 pb-2 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground">{musica.titulo}</h1>
        <p className="mt-1 text-base text-muted-foreground font-body">
          {musica.artista || 'Artista desconhecido'}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {musica.tom_original && (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-chord font-mono font-semibold">
              Tom: {musica.tom_original}
            </span>
          )}
          {musica.genero && (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground font-body">
              {musica.genero}
            </span>
          )}
          {musica.bpm && (
            <span className="text-xs text-muted-foreground font-mono">{musica.bpm} BPM</span>
          )}
        </div>

        {/* Font size slider */}
        <div className="mt-5 flex items-center gap-3 max-w-xs">
          <span className="text-xs text-muted-foreground font-mono">A</span>
          <Slider
            min={12}
            max={28}
            step={1}
            value={[fontSize]}
            onValueChange={([v]) => setFontSize(v)}
            className="flex-1"
          />
          <span className="text-base text-muted-foreground font-mono font-bold">A</span>
        </div>
      </div>

      {/* Cifra content */}
      <div className="container mx-auto px-4 pb-24 max-w-3xl">
        <pre
          className="mt-6 font-mono leading-relaxed whitespace-pre-wrap break-words text-foreground/85"
          style={{ fontSize: `${fontSize}px` }}
        >
          {lines.map((line, idx) => {
            if (isChordLine(line)) {
              const tokens = tokenizeChordLine(line);
              return (
                <div key={idx} className="min-h-[1.2em]">
                  {tokens.map((tok, ti) =>
                    tok.type === 'chord' ? (
                      <span
                        key={ti}
                        className={`font-bold ${modoGrau ? 'text-[#A855F7]' : 'text-chord'}`}
                      >
                        {renderChordValue(tok.value)}
                      </span>
                    ) : (
                      <span key={ti}>{tok.value}</span>
                    )
                  )}
                </div>
              );
            }
            return (
              <div key={idx} className="min-h-[1.2em]">
                {line || '\u00A0'}
              </div>
            );
          })}
        </pre>
      </div>

      {/* Auto-scroll slider — fixed right side, visible only in performance mode */}
      {performanceMode && (
        <div className="fixed right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2">
          <span className="text-[10px] font-mono text-chord rotate-0">▲</span>
          <Slider
            orientation="vertical"
            min={0}
            max={10}
            step={1}
            value={[autoScrollSpeed]}
            onValueChange={([v]) => setAutoScrollSpeed(v)}
            className="h-32"
          />
          <span className="text-[10px] font-mono text-muted-foreground">
            {autoScrollSpeed > 0 ? autoScrollSpeed : 'Off'}
          </span>
        </div>
      )}

      <FlowFooter musica={musica} />
    </motion.div>
  );
}
