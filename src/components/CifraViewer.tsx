import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Musica } from '@/hooks/useMusicas';
import {
  transposeChord,
  chordToDegree,
  parseCifraLine,
  hasChords,
  ALL_KEYS,
  type DisplayMode,
} from '@/lib/transpose';
import { Button } from '@/components/ui/button';

interface CifraViewerProps {
  musica: Musica;
}

export function CifraViewer({ musica }: CifraViewerProps) {
  const [semitones, setSemitones] = useState(0);
  const [mode, setMode] = useState<DisplayMode>('cifra');

  const keyIdx = ALL_KEYS.indexOf(musica.tom_original);
  const currentKey =
    keyIdx >= 0 ? ALL_KEYS[((keyIdx + semitones) % 12 + 12) % 12] : musica.tom_original;

  const lines = musica.letra_cifrada.split('\n');

  function renderChord(raw: string): string {
    const transposed = transposeChord(raw, semitones);
    if (mode === 'grau') {
      return chordToDegree(transposed, currentKey);
    }
    return transposed;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-xl">
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
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setMode('cifra')}
                className={`px-3 py-1.5 text-xs font-mono font-medium transition-colors ${
                  mode === 'cifra'
                    ? 'bg-chord text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Cifra
              </button>
              <button
                onClick={() => setMode('grau')}
                className={`px-3 py-1.5 text-xs font-mono font-medium transition-colors ${
                  mode === 'grau'
                    ? 'bg-grau text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Grau
              </button>
            </div>

            {/* Transpose */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSemitones((s) => s - 1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="min-w-[2.5rem] text-center font-mono text-xs font-semibold text-primary">
                {currentKey}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSemitones((s) => s + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Song info */}
      <div className="container mx-auto px-4 pt-8 pb-4 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground">{musica.titulo}</h1>
        <p className="mt-1 text-base text-muted-foreground font-body">
          {musica.artista || 'Artista desconhecido'}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {musica.genero && (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground font-body">
              {musica.genero}
            </span>
          )}
          {musica.bpm && (
            <span className="text-xs text-muted-foreground font-mono">{musica.bpm} BPM</span>
          )}
          {semitones !== 0 && (
            <span className="text-xs text-primary font-mono">
              {musica.tom_original} → {currentKey}
            </span>
          )}
        </div>
      </div>

      {/* Cifra content */}
      <div className="container mx-auto px-4 pb-24 max-w-3xl">
        <div className="mt-6 space-y-0">
          {lines.map((line, lineIdx) => {
            if (!hasChords(line)) {
              // Plain text line (could be empty)
              return (
                <div key={lineIdx} className="min-h-[1.75rem]">
                  <span className="font-body text-sm text-foreground/80 leading-7 whitespace-pre-wrap">
                    {line}
                  </span>
                </div>
              );
            }

            // Line with chords
            const segments = parseCifraLine(line);
            return (
              <div key={lineIdx} className="flex flex-wrap">
                {segments.map((seg, segIdx) => (
                  <span key={segIdx} className="inline-flex flex-col">
                    {seg.chord ? (
                      <span
                        className={`font-mono text-xs font-semibold leading-5 ${
                          mode === 'cifra' ? 'text-chord' : 'text-grau'
                        }`}
                      >
                        {renderChord(seg.chord)}
                      </span>
                    ) : (
                      <span className="leading-5 text-xs invisible">.</span>
                    )}
                    <span className="font-body text-sm text-foreground/80 leading-6 whitespace-pre">
                      {seg.text || '\u00A0'}
                    </span>
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
