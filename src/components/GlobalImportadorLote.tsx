import { Package, Loader2, Search, CheckSquare, Square, Play, X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useImport } from '@/contexts/ImportContext';
import { useAuth } from '@/hooks/useAuth';

const GENEROS = ['Gospel', 'Rock', 'MPB', 'Sertanejo', 'Pop', 'Forró', 'Pagode', 'Axé', 'Reggae', 'Blues', 'Jazz', 'Country', 'Funk', 'Worship', 'Outro'] as const;

export function GlobalImportadorLote() {
  const { isAdmin } = useAuth();
  const {
    open, setOpen, url, setUrl, genero, setGenero,
    songs, duplicateUrls, status, current, results,
    scanError, showReport, showDupesOnly, setShowDupesOnly,
    isRunning, handleScan, handleImport, handleAbort,
    toggleAll, toggleSong, deselectDupes, reset, selectedCount,
  } = useImport();

  if (!isAdmin) return null;

  const progress = status === 'importing' && selectedCount > 0
    ? (current / selectedCount) * 100 : 0;
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <>
      {/* Botão flutuante quando importação está rodando e o dialog está fechado */}
      {isRunning && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 bg-orange-500 text-white rounded-full px-4 py-2 shadow-lg text-sm font-bold animate-pulse"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Importando {current}/{selectedCount}
        </button>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v && status === 'done') reset(); }}>
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
                  <span className="text-sm text-muted-foreground font-body">Varrendo a página...</span>
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
              <label className="text-xs text-muted-foreground font-body">Gênero</label>
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground font-body flex-1">
                    {songs.length} encontradas · <span className="text-foreground font-medium">{selectedCount} selecionadas</span>
                    {duplicateUrls.size > 0 && <span className="text-yellow-400 ml-1">· {duplicateUrls.size} já existem</span>}
                  </span>
                  <div className="flex gap-2">
                    {duplicateUrls.size > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setShowDupesOnly(v => !v)}
                        className={`text-xs ${showDupesOnly ? 'text-yellow-400 bg-yellow-400/10' : 'text-yellow-600 hover:text-yellow-400'}`}>
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                        {showDupesOnly ? 'Ver todas' : 'Ver duplicatas'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs text-orange-400 hover:text-orange-300">
                      {songs.every(s => s.selected)
                        ? <><Square className="h-3.5 w-3.5 mr-1" /> Desmarcar</>
                        : <><CheckSquare className="h-3.5 w-3.5 mr-1" /> Todas</>}
                    </Button>
                  </div>
                </div>

                {duplicateUrls.size > 0 && (
                  <button onClick={deselectDupes} className="text-xs text-yellow-500 hover:text-yellow-300 underline text-left">
                    Desmarcar as {duplicateUrls.size} que já existem
                  </button>
                )}

                <ScrollArea className="flex-1 max-h-[300px] rounded-lg border border-border bg-background overflow-y-auto">
                  <div className="divide-y divide-border pb-3">
                    {songs
                      .filter(s => !showDupesOnly || duplicateUrls.has(s.url))
                      .map((song) => {
                        const realIndex = songs.indexOf(song);
                        const isDupe = duplicateUrls.has(song.url);
                        return (
                          <button key={realIndex} onClick={() => status === 'idle' && toggleSong(realIndex)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/30 ${isDupe ? 'bg-yellow-500/[0.04]' : ''} ${status !== 'idle' ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                            disabled={status !== 'idle'}>
                            {song.selected
                              ? <CheckSquare className={`h-4 w-4 shrink-0 ${isDupe ? 'text-yellow-400' : 'text-orange-400'}`} />
                              : <Square className="h-4 w-4 text-muted-foreground shrink-0" />}
                            <span className={`text-sm font-body truncate flex-1 ${isDupe ? 'text-yellow-200' : 'text-foreground'}`}>{song.titulo}</span>
                            {isDupe && (
                              <span className="flex items-center gap-1 text-xs text-yellow-500 shrink-0 bg-yellow-500/10 rounded px-1.5 py-0.5">
                                <AlertTriangle className="h-3 w-3" /> Já existe
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </ScrollArea>

                {status === 'idle' && (
                  <Button onClick={handleImport} disabled={selectedCount === 0}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2 font-semibold">
                    <Play className="h-4 w-4" />
                    Importar ({selectedCount} músicas)
                  </Button>
                )}
              </>
            )}

            {/* Progress */}
            {status === 'importing' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body text-foreground">
                    Importando <span className="text-orange-400 font-mono font-bold">{current}</span> de <span className="font-mono font-bold">{selectedCount}</span>...
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleAbort} className="text-xs text-destructive hover:text-destructive/80">
                    <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                  </Button>
                </div>
                <Progress value={progress} className="h-3 bg-muted" />
                <ScrollArea className="max-h-[200px] rounded-lg border border-border bg-background p-2">
                  <div className="space-y-1 font-mono text-xs">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {r.success ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                        <span className={r.success ? 'text-muted-foreground' : 'text-destructive'}>{r.titulo}</span>
                      </div>
                    ))}
                    {results.length < selectedCount && (
                      <div className="flex items-center gap-2 text-orange-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                        <span>Processando...</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Report */}
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
                <Button onClick={reset} variant="outline" className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                  Nova Importação
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
