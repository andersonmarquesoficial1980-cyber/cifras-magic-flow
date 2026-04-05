import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MetronomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Musica } from '@/hooks/useMusicas';
import { isChordLine, tokenizeChordLine, chordToGrau } from '@/lib/chordDetector';
import { Slider } from '@/components/ui/slider';
import { MetronomBar } from '@/components/MetronomBar';
import { FlowFooter } from '@/components/FlowFooter';

interface CifraViewerProps {
  musica: Musica;
}

export function CifraViewer({ musica }: CifraViewerProps) {
  const [modoGrau, setModoGrau] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [metronomeActive, setMetronomeActive] = useState(false);

  const lines = musica.letra_cifrada.split('\n');

  function renderChordValue(chord: string): string {
    if (modoGrau) {
      return chordToGrau(chord, musica.tom_original);
    }
    return chord;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen">
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

          <div className="flex items-center gap-4">
            {/* Mode toggle */}
            <button
              onClick={() => setModoGrau(!modoGrau)}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
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
                        className={`font-bold ${modoGrau ? 'text-grau' : 'text-chord'}`}
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
            // Regular lyrics or empty line
            return (
              <div key={idx} className="min-h-[1.2em]">
                {line || '\u00A0'}
              </div>
            );
          })}
        </pre>
      </div>
    </motion.div>
  );
}
