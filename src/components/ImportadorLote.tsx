import { useState, useCallback, useRef } from 'react';
import { Package, Loader2, Search, CheckSquare, Square, Play, X, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { checkDuplicatesBatch } from '@/hooks/useDuplicateCheck';

const GENEROS = ['Gospel', 'Rock', 'MPB', 'Sertanejo', 'Pop', 'Forró', 'Pagode', 'Axé', 'Reggae', 'Blues', 'Jazz', 'Country', 'Funk', 'Worship', 'Outro'] as const;

interface SongLink {
  titulo: string;
  url: string;
  selected: boolean;
}

type ImportStatus = 'idle' | 'scanning' | 'importing' | 'done';

interface ImportResult {
  titulo: string;
  success: boolean;
  error?: string;
}

export function ImportadorLote() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [genero, setGenero] = useState('');
  const [songs, setSongs] = useState<SongLink[]>([]);
  const [duplicateUrls, setDuplicateUrls] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [scanError, setScanError] = useState('');
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [showReport, setShowReport] = useState(false);
  const abortRef = useRef(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reset = () => {
    setUrl('');
    setGenero('');
    setDuplicateUrls(new Set());
    setSongs([]);
    setStatus('idle');
    setScanError('');
    setCurrent(0);
    setResults([]);
    setShowReport(false);
    abortRef.current = false;
  };

  const handleScan = async () => {
    if (!url.trim()) return;
    setStatus('scanning');
    setScanError('');
    setSongs([]);

    try {
      let urlFinal = url.trim();
      if (!urlFinal.startsWith('http')) urlFinal = 'https://' + urlFinal;

      // Usar fetch direto (evita bug do Supabase SDK com edge functions)
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/scan-artist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ url: urlFinal }),
      });
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      if (!data?.songs?.length) throw new Error('Nenhuma música encontrada. Use a URL da página do artista no Cifra Club, ex: https://www.cifraclub.com.br/ministerio-morada/');

      const songList = data.songs.map((s: any) => ({ ...s, selected: true }));
      setSongs(songList);

      // Check for duplicates
      const dupes = await checkDuplicatesBatch(songList);
      setDuplicateUrls(dupes);

      setStatus('idle');
    } catch (e: any) {
      setScanError(e.message || 'Erro ao escanear');
      setStatus('idle');
    }
  };

  const toggleAll = () => {
    const allSelected = songs.every(s => s.selected);
    setSongs(prev => prev.map(s => ({ ...s, selected: !allSelected })));
  };

  const toggleSong = (index: number) => {
    setSongs(prev => prev.map((s, i) => i === index ? { ...s, selected: !s.selected } : s));
  };

  const selectedCount = songs.filter(s => s.selected).length;

  const handleImport = useCallback(async () => {
    const selected = songs.filter(s => s.selected);
    if (!selected.length) return;

    setStatus('importing');
    setResults([]);
    setCurrent(0);
    abortRef.current = false;

    const importResults: ImportResult[] = [];

    for (let i = 0; i < selected.length; i++) {
      if (abortRef.current) break;
      setCurrent(i + 1);
      const song = selected[i];

      try {
        // Step 1: Extract song data using import-song
        const { data, error } = await supabase.functions.invoke('import-song', {
          body: { url: song.url },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        // Step 2: Save to database
        const { error: insertError } = await supabase.from('musicas').insert({
          titulo: data.titulo,
          artista: data.artista,
          tom_original: data.tom_original,
          bpm: data.bpm || 80,
          capo_fret: data.capo_fret || 0,
          genero: genero || null,
          vibe: (data.vibe || []).join(', '),
          letra_cifrada: data.letra_cifrada,
        });
        if (insertError) throw insertError;

        importResults.push({ titulo: data.titulo || song.titulo, success: true });
      } catch (e: any) {
        importResults.push({ titulo: song.titulo, success: false, error: e.message });
      }

      setResults([...importResults]);

      // Small delay to avoid rate limiting
      if (i < selected.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    setStatus('done');
    setShowReport(true);
    queryClient.invalidateQueries({ queryKey: ['musicas'] });

    const successes = importResults.filter(r => r.success).length;
    toast({
      title: `✅ Importação concluída`,
      description: `${successes} de ${importResults.length} músicas importadas com sucesso.`,
    });
  }, [songs, genero, queryClient, toast]);

  const handleAbort = () => {
    abortRef.current = true;
  };

  const progress = status === 'importing' && selectedCount > 0
    ? (current / selectedCount) * 100
    : 0;

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
        >
          <Package className="h-4 w-4" />
          Importador em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-[hsl(var(--card))] border-border pb-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-display">
            <Package className="h-5 w-5 text-orange-400" />
            Importador em Lote
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-body">
              Cole a URL da página do artista ou gênero (ex: Cifra Club)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="https://www.cifraclub.com.br/artista/"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 bg-background border-border font-body text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && status === 'idle' && handleScan()}
                  disabled={status !== 'idle'}
                />
              </div>
              <Button
                onClick={handleScan}
                disabled={status !== 'idle' || !url.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
              >
                {status === 'scanning' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {status === 'scanning' ? 'Escaneando...' : 'Escanear'}
              </Button>
            </div>

            {status === 'scanning' && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                <span className="text-sm text-muted-foreground font-body">
                  Varrendo a página em busca de músicas...
                </span>
              </div>
            )}

            {scanError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <X className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-sm text-destructive font-body">{scanError}</span>
              </div>
            )}
          </div>

          {/* Genre Selector */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-body">
              Gênero (aplicado a todas as músicas importadas)
            </label>
            <Select value={genero} onValueChange={setGenero}>
              <SelectTrigger className="bg-background border-border text-sm">
                <SelectValue placeholder="Selecione o gênero..." />
              </SelectTrigger>
              <SelectContent>
                {GENEROS.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Song List */}
          {songs.length > 0 && status !== 'done' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-body">
                  {songs.length} músicas encontradas · {selectedCount} selecionadas
                  {duplicateUrls.size > 0 && (
                    <span className="text-yellow-400 ml-1">· {duplicateUrls.size} já existem</span>
                  )}
                </span>
                <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs text-orange-400 hover:text-orange-300">
                  {songs.every(s => s.selected) ? (
                    <><Square className="h-3.5 w-3.5 mr-1" /> Desmarcar Todas</>
                  ) : (
                    <><CheckSquare className="h-3.5 w-3.5 mr-1" /> Selecionar Todas</>
                  )}
                </Button>
              </div>

              <ScrollArea className="flex-1 max-h-[60vh] sm:max-h-[400px] rounded-lg border border-border bg-background overflow-y-auto">
                <div className="divide-y divide-border pb-3">
                  {songs.map((song, i) => {
                    const isDupe = duplicateUrls.has(song.url);
                    return (
                      <button
                        key={i}
                        onClick={() => status === 'idle' && toggleSong(i)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/30 ${
                          status !== 'idle' ? 'opacity-60 cursor-default' : 'cursor-pointer'
                        }`}
                        disabled={status !== 'idle'}
                      >
                        {song.selected ? (
                          <CheckSquare className="h-4 w-4 text-orange-400 shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-sm text-foreground font-body truncate flex-1">{song.titulo}</span>
                        {isDupe && (
                          <span className="flex items-center gap-1 text-xs text-yellow-400 shrink-0">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Já existe
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Import Button */}
              {status === 'idle' && (
                <div className="sticky bottom-0 pt-3 bg-[hsl(var(--card))]">
                  <Button
                    onClick={handleImport}
                    disabled={selectedCount === 0}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2 font-semibold"
                  >
                    <Play className="h-4 w-4" />
                    Iniciar Importação Pesada ({selectedCount} músicas)
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Progress */}
          {status === 'importing' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-body text-foreground">
                  Importando <span className="text-orange-400 font-mono font-bold">{current}</span> de{' '}
                  <span className="font-mono font-bold">{selectedCount}</span> músicas...
                </span>
                <Button variant="ghost" size="sm" onClick={handleAbort} className="text-xs text-destructive hover:text-destructive/80">
                  <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                </Button>
              </div>

              <Progress value={progress} className="h-3 bg-muted" />

              {/* Live results feed */}
              <ScrollArea className="max-h-[200px] rounded-lg border border-border bg-background p-2">
                <div className="space-y-1 font-mono text-xs">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {r.success ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span className={r.success ? 'text-muted-foreground' : 'text-destructive'}>
                        {r.titulo}
                      </span>
                    </div>
                  ))}
                  {current <= selectedCount && results.length < selectedCount && (
                    <div className="flex items-center gap-2 text-orange-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                      <span>Processando...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Final Report */}
          {status === 'done' && showReport && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
                  <span className="text-2xl font-mono font-bold text-emerald-400">{successCount}</span>
                  <span className="text-xs text-emerald-400/70 block">Sucessos</span>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
                  <XCircle className="h-6 w-6 text-destructive mx-auto mb-1" />
                  <span className="text-2xl font-mono font-bold text-destructive">{failCount}</span>
                  <span className="text-xs text-destructive/70 block">Falhas</span>
                </div>
              </div>

              {results.length > 0 && (
                <ScrollArea className="max-h-[200px] rounded-lg border border-border bg-background p-3">
                  <div className="space-y-1 font-mono text-xs">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {r.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                        )}
                        <span className={r.success ? 'text-muted-foreground' : 'text-destructive'}>
                          {r.titulo}
                        </span>
                        {r.error && (
                          <span className="text-destructive/60 ml-auto truncate max-w-[200px]">
                            {r.error}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <Button onClick={reset} variant="outline" className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                Nova Importação
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
