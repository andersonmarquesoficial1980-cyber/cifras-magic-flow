import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Musica } from '@/hooks/useMusicas';
import { transposeLine, ALL_KEYS, getSemitonesDiff } from '@/lib/transpose';
import { Button } from '@/components/ui/button';

interface CifraViewerProps {
  musica: Musica;
}

export function CifraViewer({ musica }: CifraViewerProps) {
  const [semitones, setSemitones] = useState(0);

  const currentKeyIdx = ALL_KEYS.indexOf(musica.tom_original);
  const currentKey = currentKeyIdx >= 0
    ? ALL_KEYS[((currentKeyIdx + semitones) % 12 + 12) % 12]
    : musica.tom_original;

  const lines = musica.letra_cifrada.split('\n');

  const isChordLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const words = trimmed.split(/\s+/);
    const chordPattern = /^[A-G][#b]?(?:m|7|maj7|m7|dim|aug|sus[24]|add9|6|9|11|13|\/[A-G][#b]?)*$/;
    const chordWords = words.filter(w => chordPattern.test(w));
    return chordWords.length > 0 && chordWords.length >= words.length * 0.5;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-body">Voltar</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSemitones(s => s - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="min-w-[3rem] text-center font-mono text-sm font-semibold text-primary">
              {currentKey}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSemitones(s => s + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Song info */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <h1 className="font-display text-4xl text-foreground">{musica.titulo}</h1>
        <p className="mt-1 text-lg text-muted-foreground font-body">
          {musica.artista || 'Artista desconhecido'}
        </p>
        <div className="mt-3 flex items-center gap-3">
          {musica.genero && (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
              {musica.genero}
            </span>
          )}
          {musica.bpm && (
            <span className="text-xs text-muted-foreground font-mono">{musica.bpm} BPM</span>
          )}
          {semitones !== 0 && (
            <span className="text-xs text-primary font-mono">
              Tom original: {musica.tom_original} → {currentKey}
            </span>
          )}
        </div>
      </div>

      {/* Cifra */}
      <div className="container mx-auto px-4 pb-20">
        <pre className="font-mono text-sm leading-7 whitespace-pre-wrap">
          {lines.map((line, i) => {
            const chord = isChordLine(line);
            return (
              <span key={i} className={chord ? 'text-primary font-semibold' : 'text-foreground/80'}>
                {chord ? transposeLine(line, semitones) : line}
                {'\n'}
              </span>
            );
          })}
        </pre>
      </div>
    </motion.div>
  );
}
