import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Eye, EyeOff, Plus, Minus, Feather, Star, Music2, AlignLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Musica } from '@/hooks/useMusicas';
import { isChordLine, tokenizeChordLine, chordToGrau, chordToOrdinalDegree, isMixedSectionChordLine, splitSectionAndChords } from '@/lib/chordDetector';
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
import { useAuth } from '@/hooks/useAuth';
import { Crown } from 'lucide-react';

interface CifraViewerProps {
  musica: Musica;
}

export function CifraViewer({ musica }: CifraViewerProps) {
  const { isPremium } = useAuth();
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
  const [viewMode, setViewMode] = useState<'normal' | 'progressao' | 'so-cifras'>('normal');
  
  const toggleFav = useToggleFavorite();
  const navigate = useNavigate();

  useWakeLock(performanceMode);


  // Pré-processa linhas: agrupa acordes consecutivos sozinhos em uma linha só
  const lines = useMemo(() => {
    const raw = musica.letra_cifrada.split('\n');
    const result: string[] = [];
    let i = 0;
    while (i < raw.length) {
      const line = raw[i];
      const trimmed = line.trim();
      // Normaliza linhas tipo "Intro: D G7M" → "[Intro]\nD G7M"
      const introMatch = trimmed.match(/^(Intro|Vers[oó]|Refr[aã]o|Ponte|Final|Pr[eé]-Refr[aã]o)\s*:\s*(.+)$/i);
      if (introMatch) {
        result.push(`[${introMatch[1]}]`);
        const chordPart = introMatch[2].trim();
        if (chordPart) result.push(chordPart);
        i++;
        continue;
      }
      // Seção ou vazia — passa direto
      if (trimmed === '' || /^\[.+\]$/.test(trimmed) || isMixedSectionChordLine(line)) {
        result.push(line);
        i++;
        continue;
      }
      // Linha de acorde sozinha (só 1-2 tokens, sem posicionamento)
      const isSingleChord = isChordLine(line) && line.trim().split(/\s+/).filter(Boolean).length <= 2;
      if (isSingleChord) {
        // Agrupa acordes consecutivos — MAS para imediatamente ao encontrar linha vazia
        // (linha vazia = fim do bloco intro/instrumental, próximo bloco é verso com letra)
        const chordGroup: string[] = [line.trim()];
        let j = i + 1;
        while (j < raw.length) {
          const next = raw[j].trim();
          if (next === '') break; // linha vazia = fim do bloco — para
          if (/^\[.+\]$/.test(next)) break; // nova seção — para
          // Se for acorde sozinho, adiciona ao grupo
          if (isChordLine(raw[j]) && raw[j].trim().split(/\s+/).filter(Boolean).length <= 2) {
            chordGroup.push(raw[j].trim());
            j++;
          } else {
            // Chegou em letra — para
            break;
          }
        }
        if (chordGroup.length >= 2) {
          result.push(chordGroup.join('  '));
          i = j;
        } else {
          result.push(line);
          i++;
        }
        continue;
      }
      result.push(line);
      i++;
    }
    return result;
  }, [musica.letra_cifrada]);

  // ── Detecção de progressão repetida ──
  const progressaoInfo = useMemo(() => {
    // Extrai TODOS os acordes da cifra em ordem (ignora letra e marcadores)
    const allChords: string[] = [];
    lines.forEach(line => {
      const chordPart = isMixedSectionChordLine(line)
        ? splitSectionAndChords(line).chords
        : line;
      if (isChordLine(chordPart)) {
        const tokens = tokenizeChordLine(chordPart);
        tokens.filter(t => t.type === 'chord').forEach(t => {
          const val = t.value.trim();
          // Deduplica consecutivos
          if (val && allChords[allChords.length - 1] !== val) allChords.push(val);
        });
      }
    });

    if (allChords.length < 4) return null;

    // Tenta detectar padrão de N acordes que se repete na sequência total
    for (let patLen = 2; patLen <= Math.min(8, Math.floor(allChords.length / 2)); patLen++) {
      const pattern = allChords.slice(0, patLen);
      let count = 0;
      let allMatch = true;
      for (let i = 0; i + patLen <= allChords.length; i += patLen) {
        const slice = allChords.slice(i, i + patLen);
        // Permite que o último bloco seja incompleto (truncado)
        const isLast = i + patLen >= allChords.length;
        const matches = isLast
          ? pattern.slice(0, slice.length).join('|') === slice.join('|')
          : slice.join('|') === pattern.join('|');
        if (!matches) { allMatch = false; break; }
        count++;
      }
      // Progressão válida: repete 3x+ e cobre 75%+ dos acordes
      if (allMatch && count >= 3 && count * patLen >= allChords.length * 0.7) {
        return { pattern, repeticoes: count };
      }
    }
    return null;
  }, [lines]);

  // ── Render helpers para novos modos ──
  function renderChordLineTokens(line: string) {
    // Se linha mista, pega só a parte de acordes
    const chordPart = isMixedSectionChordLine(line) ? splitSectionAndChords(line).chords : line;
    const tokens = tokenizeChordLine(chordPart);
    return tokens.map((tok, ti) =>
      tok.type === 'chord' ? (
        <ChordPopover key={ti} chordName={getChordForPopover(tok.value)}>
          <span className={`font-bold cursor-pointer hover:underline ${MODE_COLORS[displayMode]}`}>
            {renderChordValue(tok.value)}
          </span>
        </ChordPopover>
      ) : (
        <span key={ti} style={{ whiteSpace: 'pre' }}>{tok.value}</span>
      )
    );
  }

  // Tom original da música (como gravado — com capo original do banco)
  const initialCapo = musica.capo_fret ?? 0;
  const capoCompensation = initialCapo - capoFret;

  // Real key = tom original + transpose manual + compensação do capo
  const realKey = transposeChord(musica.tom_original, transposeSemitones);

  // Shape key = tom dos shapes exibidos (acordes da cifra + compensação)
  const shapeKey = transposeChord(musica.tom_original, transposeSemitones + capoCompensation - initialCapo);

  // The key used for display
  const displayedKey = shapeKey;

  const MODES: DisplayMode[] = ['cifra', 'grau', 'ordinal'];
  const MODE_LABELS: Record<DisplayMode, string> = { cifra: 'Cifra', grau: 'Grau', ordinal: 'Ordinal' };
  const MODE_COLORS: Record<DisplayMode, string> = { cifra: 'text-chord', grau: 'text-[#A855F7]', ordinal: 'text-[#10B981]' };

  function cycleMode() {
    const idx = MODES.indexOf(displayMode);
    const next = MODES[(idx + 1) % MODES.length];
    // Bloqueia grau/ordinal para free
    if (!isPremium && (next === 'grau' || next === 'ordinal')) {
      // Mostra tooltip de premium — por ora ignora o ciclo
      return;
    }
    setDisplayMode(next);
  }

  function renderChordValue(chord: string): string {
    // Cifra armazena shapes (acordes com capo)
    // Com capo: mostra shapes direto (+ transpose manual)
    // Sem capo: transpõe +capoOriginal para mostrar acordes reais
    const initialCapo = musica.capo_fret ?? 0;
    const capoCompensation = initialCapo - capoFret; // 0 quando capo normal, +N quando remove capo
    const transposed = transposeChord(chord, transposeSemitones + capoCompensation);
    let result: string;
    if (displayMode === 'grau') result = chordToGrau(transposed, shapeKey);
    else if (displayMode === 'ordinal') result = chordToOrdinalDegree(transposed, shapeKey);
    else result = transposed;
    return simplified ? simplifyChord(result, displayMode) : result;
  }

  function getChordForPopover(chord: string): string {
    const initialCapo = musica.capo_fret ?? 0;
    const capoCompensation = initialCapo - capoFret;
    const transposed = transposeChord(chord, transposeSemitones + capoCompensation);
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
            <div className="hidden sm:flex flex-col ml-2">
              <span className="text-sm font-bold text-foreground leading-tight truncate max-w-[160px]">{musica.titulo}</span>
              <span className="text-xs text-muted-foreground leading-tight truncate max-w-[160px]">{musica.artista}</span>
            </div>
          </div>

          <div className={`flex items-center ${performanceMode ? 'gap-4' : 'gap-3'}`}>
            {/* Modo Progressão */}
            <button
              onClick={() => setViewMode(v => v === 'progressao' ? 'normal' : 'progressao')}
              className={`${btnSize} rounded-lg transition-all border text-xs font-mono font-bold ${
                viewMode === 'progressao'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
              title="Modo Progressão"
            >
              <Music2 size={iconSize} />
            </button>

            {/* Modo Só Cifras */}
            <button
              onClick={() => setViewMode(v => v === 'so-cifras' ? 'normal' : 'so-cifras')}
              className={`${btnSize} rounded-lg transition-all border ${
                viewMode === 'so-cifras'
                  ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
              title="Só Cifras"
            >
              <AlignLeft size={iconSize} />
            </button>

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
              title={!isPremium ? 'Recurso Premium — faça upgrade' : undefined}
            >
              {MODE_LABELS[displayMode]}
              {!isPremium && (
                <Crown size={10} className="text-[#FACC15]" />
              )}
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

      {/* Harmonic field bar — premium only */}
      {showHarmonicField && isPremium && (
        <HarmonicFieldBar keyName={shapeKey} transposeSemitones={0} />
      )}
      {showHarmonicField && !isPremium && (
        <div className="sticky top-[57px] z-10 border-b border-border bg-[#050505] px-4 py-2">
          <div className="flex items-center gap-2 text-[#FACC15] text-sm">
            <Crown size={14} />
            <span>Campo Harmônico — recurso Premium</span>
          </div>
        </div>
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
      <div className="container mx-auto px-4 pb-24 max-w-3xl" style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}>

        {/* ── MODO PROGRESSÃO ── */}
        {viewMode === 'progressao' && (
          <div className="mt-6">
            {progressaoInfo ? (
              <>
                {/* Sequência que se repete */}
                <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-400/70 mb-2">Sequência que se repete</p>
                  <pre
                    className="leading-relaxed whitespace-pre overflow-x-auto"
                    style={{ fontSize: `${fontSize}px`, fontFamily: "'Roboto Mono', 'Courier New', Courier, monospace" }}
                  >
                    {progressaoInfo.pattern.map((line, idx) => (
                      <span key={idx} className="block">
                        {renderChordLineTokens(line)}
                      </span>
                    ))}
                  </pre>
                </div>
                {/* Letra limpa sem cifras e sem repetições de seção */}
                <div
                  className="leading-relaxed text-foreground/85"
                  style={{ fontSize: `${fontSize}px`, fontFamily: "'Roboto Mono', 'Courier New', Courier, monospace" }}
                >
                  {(() => {
                    const seenSections = new Set<string>();
                    const result: JSX.Element[] = [];
                    let i = 0;
                    while (i < lines.length) {
                      const line = lines[i];
                      // Pula linhas de acordes
                      if (isChordLine(line)) { i++; continue; }
                      // Marcadores de seção — deduplicar
                      const sectionMatch = line.trim().match(/^\[(.+)\]$/);
                      if (sectionMatch) {
                        const secKey = sectionMatch[1].trim().toLowerCase();
                        if (!seenSections.has(secKey)) {
                          seenSections.add(secKey);
                          result.push(
                            <div key={i} className="mt-4 mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                              {sectionMatch[1]}
                            </div>
                          );
                        }
                        i++; continue;
                      }
                      result.push(
                        <div key={i} className="min-h-[1.4em]">{line || '\u00A0'}</div>
                      );
                      i++;
                    }
                    return result;
                  })()}
                </div>
              </>
            ) : (
              <>
                {/* Sem progressão fixa — mostra aviso + cifra normal */}
                <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-muted-foreground">
                  Esta música não tem uma progressão fixa que se repete — mostrando cifra completa.
                </div>
                <pre
                  className="mt-2 leading-relaxed whitespace-pre overflow-x-auto text-foreground/85"
                  style={{ fontSize: `${fontSize}px`, fontFamily: "'Roboto Mono', 'Courier New', Courier, monospace" }}
                >
                  {lines.map((line, idx) => {
                    if (isChordLine(line)) {
                      return <span key={idx} className="block">{renderChordLineTokens(line)}</span>;
                    }
                    return <div key={idx} className="min-h-[1.2em]">{line || '\u00A0'}</div>;
                  })}
                </pre>
              </>
            )}
          </div>
        )}

        {/* ── MODO SÓ CIFRAS ── */}
        {viewMode === 'so-cifras' && (
          <div className="mt-6">
            {(() => {
              // Agrupa todos os acordes por seção
              type Section = { label: string; chords: string[] };
              const sections: Section[] = [];
              let currentSection: Section = { label: '', chords: [] };

              lines.forEach(line => {
                // Linha mista [Intro] E E7/G# — trata como nova seção + acordes
                if (isMixedSectionChordLine(line)) {
                  const { section, chords } = splitSectionAndChords(line);
                  if (currentSection.chords.length > 0 || currentSection.label) {
                    sections.push(currentSection);
                  }
                  currentSection = { label: section, chords: [] };
                  const tokens = tokenizeChordLine(chords);
                  tokens.filter(t => t.type === 'chord')
                    .forEach(t => currentSection.chords.push(renderChordValue(t.value)));
                  return;
                }
                const sectionMatch = line.trim().match(/^\[(.+)\]$/);
                if (sectionMatch) {
                  if (currentSection.chords.length > 0 || currentSection.label) {
                    sections.push(currentSection);
                  }
                  currentSection = { label: sectionMatch[1], chords: [] };
                } else if (isChordLine(line)) {
                  const tokens = tokenizeChordLine(line);
                  tokens
                    .filter(t => t.type === 'chord')
                    .forEach(t => currentSection.chords.push(renderChordValue(t.value)));
                }
              });
              // Salva última seção
              if (currentSection.chords.length > 0 || currentSection.label) {
                sections.push(currentSection);
              }

              // Deduplica acordes consecutivos iguais dentro da seção
              const deduped = sections.map(sec => {
                const chords: string[] = [];
                sec.chords.forEach(c => {
                  if (chords[chords.length - 1] !== c) chords.push(c);
                });
                return { ...sec, chords };
              });

              return deduped.map((sec, si) => (
                <div key={si} className="mb-5">
                  {sec.label && (
                    <div className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {sec.label}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-1 gap-y-1" style={{ fontSize: `${fontSize}px` }}>
                    {sec.chords.map((chord, ci) => (
                      <span key={ci} className="flex items-center">
                        <span className={`font-bold font-mono ${MODE_COLORS[displayMode]}`}>{chord}</span>
                        {ci < sec.chords.length - 1 && (
                          <span className="text-white/20 font-mono select-none mx-2">|</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* ── MODO NORMAL (padrão) ── */}
        {viewMode === 'normal' && (
          <pre
            className="mt-6 leading-relaxed whitespace-pre overflow-x-auto text-foreground/85"
            style={{ fontSize: `${fontSize}px`, fontFamily: "'Roboto Mono', 'Courier New', Courier, monospace", willChange: 'transform', backfaceVisibility: 'hidden' }}
          >
            {(() => {
              // Normaliza espaçamento:
              // 1. Remove linha vazia entre acorde e letra do mesmo bloco
              // 2. Garante linha vazia antes de cada marcador de seção [Xxx]
              const normalized: string[] = [];
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();
                // Marcador de seção: garante linha vazia antes (se não for a primeira linha)
                if (/^\[.+\]$/.test(trimmed)) {
                  const prev = normalized[normalized.length - 1];
                  if (normalized.length > 0 && prev !== undefined && prev.trim() !== '') {
                    normalized.push('');
                  }
                  normalized.push(line);
                  continue;
                }
                // Linha vazia: descarta só se anterior é acorde E próxima é letra
                if (trimmed === '') {
                  const prev = normalized[normalized.length - 1];
                  const next = lines[i + 1];
                  const prevIsChord = prev && isChordLine(prev);
                  const nextIsLyric = next && next.trim() !== '' && !isChordLine(next) && !/^\[.+\]$/.test(next.trim());
                  if (prevIsChord && nextIsLyric) {
                    // descarta — linha vazia espúria entre acorde e letra
                  } else if (normalized[normalized.length - 1]?.trim() === '') {
                    // descarta — evita dupla linha vazia
                  } else {
                    normalized.push(line);
                  }
                  continue;
                }
                normalized.push(line);
              }
              return normalized.map((line, idx) => {
              // Linha mista: [Intro] E E7/G# A D7 — separar marcador + acordes
              if (isMixedSectionChordLine(line)) {
                const { section, chords } = splitSectionAndChords(line);
                const tokens = tokenizeChordLine(chords);
                return (
                  <span key={idx} className="min-h-[1.2em] block">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-2">[{section}]</span>
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
            })})()}
          </pre>
        )}
      </div>

      {/* Compositor no rodapé */}
      {(musica as any).compositor && (
        <div className="container mx-auto px-4 pb-4 max-w-3xl">
          <p className="text-xs text-muted-foreground border-t border-border pt-3 mt-2">
            <span className="font-medium">Composição:</span> {(musica as any).compositor}
          </p>
        </div>
      )}

      <AutoScrollBar bpm={musica.bpm} />
      <FlowFooter musica={musica} />
    </motion.div>
  );
}
