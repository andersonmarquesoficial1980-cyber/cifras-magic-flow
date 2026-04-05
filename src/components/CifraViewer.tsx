import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Eye, EyeOff, Plus, Minus, Feather, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Musica } from '@/hooks/useMusicas';
import { isChordLine, tokenizeChordLine, chordToGrau, chordToOrdinalDegree } from '@/lib/chordDetector';
import { transposeChord, simplifyChord, ALL_KEYS } from '@/lib/transpose';
import type { DisplayMode } from '@/lib/transpose';
import { Slider } from '@/components/ui/slider';
import { MetronomBar } from '@/components/MetronomBar';
import { FlowFooter } from '@/components/FlowFooter';
import { AutoScrollBar } from '@/components/AutoScrollBar';
import { useWakeLock } from '@/hooks/useWakeLock';
import { Badge } from '@/components/ui/badge';
import { HarmonicFieldBar } from '@/components/HarmonicFieldBar';
import { ChordPopover } from '@/components/ChordPopover';
import { useToggleFavorite } from '@/hooks/useToggleFavorite';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CifraViewerProps {
  musica: Musica;
}

export function CifraViewer({ musica }: CifraViewerProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('cifra');
  const [fontSize, setFontSize] = useState(16);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  
  const [transposeSemitones, setTransposeSemitones] = useState(0);
  const [showHarmonicField, setShowHarmonicField] = useState(false);
  const [simplified, setSimplified] = useState(false);
  const [isFav, setIsFav] = useState(!!musica.is_favorite);
  const [capoFret, setCapoFret] = useState(musica.capo_fret ?? 0);
  const [capoOpen, setCapoOpen] = useState(false);
  
  const toggleFav = useToggleFavorite();
  const navigate = useNavigate();

  useWakeLock(performanceMode);


  const lines = musica.letra_cifrada.split('\n');

  // Real key = original key transposed by user's manual transpose
  const realKey = transposeChord(musica.tom_original, transposeSemitones);

  // Shape key = real key transposed DOWN by capo (i.e., the chord shapes the musician plays)
  const shapeKey = transposeChord(realKey, -capoFret);

  // The key used for display (shapes are what's shown)
  const displayedKey = shapeKey;

  const MODES: DisplayMode[] = ['cifra', 'grau', 'ordinal'];
  const MODE_LABELS: Record<DisplayMode, string> = { cifra: 'Cifra', grau: 'Grau', ordinal: 'Ordinal' };
  const MODE_COLORS: Record<DisplayMode, string> = { cifra: 'text-chord', grau: 'text-[#A855F7]', ordinal: 'text-[#10B981]' };

  function cycleMode() {
    const idx = MODES.indexOf(displayMode);
    setDisplayMode(MODES[(idx + 1) % MODES.length]);
  }

  function renderChordValue(chord: string): string {
    // First transpose by user's manual semitones, then DOWN by capo to get shapes
    const transposed = transposeChord(chord, transposeSemitones - capoFret);
    let result: string;
    if (displayMode === 'grau') result = chordToGrau(transposed, shapeKey);
    else if (displayMode === 'ordinal') result = chordToOrdinalDegree(transposed, shapeKey);
    else result = transposed;
    return simplified ? simplifyChord(result, displayMode) : result;
  }

  function getChordForPopover(chord: string): string {
    const transposed = transposeChord(chord, transposeSemitones - capoFret);
    return simplified ? simplifyChord(transposed, 'cifra') : transposed;
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
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-body">Voltar</span>
            </button>
            <button
              onClick={() => {
                setIsFav(!isFav);
                toggleFav.mutate({ id: musica.id, isFavorite: isFav });
              }}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <Star className={`h-4 w-4 transition-colors ${isFav ? 'text-chord fill-chord' : 'text-muted-foreground'}`} />
            </button>
          </div>

          <div className={`flex items-center ${performanceMode ? 'gap-4' : 'gap-3'}`}>
            {/* Simplified toggle */}
            <button
              onClick={() => setSimplified(!simplified)}
              className={`${btnSize} rounded-lg transition-all border ${
                simplified
                  ? 'bg-[#F97316]/20 border-[#F97316] text-[#F97316]'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
              title="Cifra Simplificada"
            >
              <Feather size={iconSize} />
            </button>

            {/* Capo button */}
            <Popover open={capoOpen} onOpenChange={setCapoOpen}>
              <PopoverTrigger asChild>
                <button
                  className={`${btnSize} rounded-lg transition-all border text-xs font-mono font-bold ${
                    capoFret > 0
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                  title="Capotraste"
                >
                  C{capoFret > 0 ? capoFret : ''}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-background border-border p-3" align="end">
                <p className="text-xs text-muted-foreground font-body mb-2">Casa do Capotraste</p>
                <div className="grid grid-cols-6 gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(fret => (
                    <button
                      key={fret}
                      onClick={() => { setCapoFret(fret); setCapoOpen(false); }}
                      className={`h-8 rounded text-xs font-mono font-bold transition-all ${
                        capoFret === fret
                          ? 'bg-orange-500 text-white'
                          : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {fret === 0 ? '—' : fret}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Harmonic field toggle */}
            <button
              onClick={() => setShowHarmonicField(!showHarmonicField)}
              className={`${btnSize} rounded-lg transition-all border ${
                showHarmonicField
                  ? 'bg-chord/20 border-chord text-chord'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
              title="Campo Harmônico"
            >
              {showHarmonicField ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
            </button>
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
            {/* Mode cycle toggle */}
            <button
              onClick={cycleMode}
              className={`${btnText} rounded-lg font-mono font-semibold transition-all border flex items-center gap-2 ${
                displayMode !== 'cifra'
                  ? displayMode === 'grau'
                    ? 'bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]'
                    : 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-chord'
              }`}
            >
              {MODE_LABELS[displayMode]}
              <Badge className={`text-[10px] px-1.5 py-0 ${
                displayMode === 'cifra' ? 'bg-chord/20 text-chord border-chord' :
                displayMode === 'grau' ? 'bg-[#A855F7]/20 text-[#A855F7] border-[#A855F7]' :
                'bg-[#10B981]/20 text-[#10B981] border-[#10B981]'
              }`} variant="outline">
                {displayMode === 'cifra' ? '1' : displayMode === 'grau' ? '2' : '3'}
              </Badge>
            </button>
          </div>
        </div>
      </div>

      {/* Harmonic field bar */}
      {showHarmonicField && (
        <HarmonicFieldBar keyName={shapeKey} transposeSemitones={0} />
      )}

      {/* Song info */}
      <div className="container mx-auto px-4 pt-8 pb-2 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground">{musica.titulo}</h1>
        <p className="mt-1 text-base text-muted-foreground font-body">
          {musica.artista || 'Artista desconhecido'}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {musica.tom_original && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTransposeSemitones(s => s - 1)}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-chord transition-colors"
                title="Meio tom abaixo"
              >
                <Minus size={12} />
              </button>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs text-chord font-mono font-semibold min-w-[70px] text-center">
                Tom: {realKey}
              </span>
              <button
                onClick={() => setTransposeSemitones(s => s + 1)}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-chord transition-colors"
                title="Meio tom acima"
              >
                <Plus size={12} />
              </button>
              {transposeSemitones !== 0 && (
                <button
                  onClick={() => setTransposeSemitones(0)}
                  className="text-[10px] text-muted-foreground hover:text-foreground ml-1 font-mono underline"
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {/* Capo info display */}
          {capoFret > 0 && (
            <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs text-orange-400 font-mono font-semibold border border-orange-500/30">
              Shapes em {shapeKey} · Capo {capoFret}ª
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
          className="mt-6 leading-relaxed whitespace-pre overflow-x-auto text-foreground/85"
          style={{ fontSize: `${fontSize}px`, fontFamily: "'Roboto Mono', 'Courier New', Courier, monospace" }}
        >
          {lines.map((line, idx) => {
            if (isChordLine(line)) {
              const tokens = tokenizeChordLine(line);
              return (
                <span key={idx} className="min-h-[1.2em] block">
                  {tokens.map((tok, ti) =>
                    tok.type === 'chord' ? (
                      <ChordPopover key={ti} chordName={getChordForPopover(tok.value)}>
                        <span className={`font-bold cursor-pointer hover:underline ${MODE_COLORS[displayMode]}`}>
                          {renderChordValue(tok.value)}
                        </span>
                      </ChordPopover>
                    ) : (
                      <span key={ti} style={{ whiteSpace: 'pre' }}>{tok.value}</span>
                    )
                  )}
                </span>
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

      <AutoScrollBar bpm={musica.bpm} />
      <FlowFooter musica={musica} />
    </motion.div>
  );
}
