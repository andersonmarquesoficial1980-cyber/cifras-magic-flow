import { useState } from 'react';
import { Zap, Loader2, Check, ExternalLink, X, Music } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { checkDuplicate } from '@/hooks/useDuplicateCheck';
import { DuplicateConfirmDialog } from '@/components/DuplicateConfirmDialog';

const VIBES_AVAILABLE = ['Animada', 'Romântica', 'Adoração', 'Pra Pular', 'Modão', 'Introspectiva'] as const;
type Vibe = typeof VIBES_AVAILABLE[number];

const VIBE_COLORS: Record<Vibe, string> = {
  'Animada': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
  'Romântica': 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
  'Adoração': 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
  'Pra Pular': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
  'Modão': 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
  'Introspectiva': 'bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30',
};

interface SongPreview {
  titulo: string;
  artista: string;
  tom_original: string;
  bpm: number;
  capo_fret: number;
  vibe: string[];
  letra_cifrada: string;
}

export function ImportadorFlash() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<SongPreview | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<Vibe[]>([]);
  const [error, setError] = useState('');
  const [showDupeDialog, setShowDupeDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reset = () => {
    setUrl('');
    setPreview(null);
    setSelectedVibes([]);
    setError('');
    setLoading(false);
    setSaving(false);
  };

  const toggleVibe = (vibe: Vibe) => {
    setSelectedVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  const handleImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setPreview(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('import-song', {
        body: { url: url.trim() },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const songData = data as SongPreview;
      setPreview(songData);
      setSelectedVibes((songData.vibe || []) as Vibe[]);
    } catch (e: any) {
      setError(e.message || 'Erro ao importar');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);

    try {
      const { error: insertError } = await supabase.from('musicas').insert({
        titulo: preview.titulo,
        artista: preview.artista,
        tom_original: preview.tom_original,
        bpm: preview.bpm || 80,
        capo_fret: preview.capo_fret || 0,
        vibe: selectedVibes.join(', '),
        letra_cifrada: preview.letra_cifrada,
      });

      if (insertError) throw insertError;

      toast({ title: '✅ Música importada!', description: `${preview.titulo} - ${preview.artista}` });
      queryClient.invalidateQueries({ queryKey: ['musicas'] });
      reset();
      setOpen(false);
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-[hsl(var(--accent))] text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/10"
        >
          <Zap className="h-4 w-4" />
          Importador Flash
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[hsl(var(--card))] border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-display">
            <Zap className="h-5 w-5 text-[hsl(var(--chord))]" />
            Importador Flash
          </DialogTitle>
        </DialogHeader>

        {/* URL Input */}
        <div className="space-y-3">
          <label className="text-sm text-muted-foreground font-body">
            Cole a URL da cifra (ex: Cifra Club, Cifras.com)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="https://www.cifraclub.com.br/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10 bg-background border-border font-body text-sm"
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleImport()}
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleImport}
              disabled={loading || !url.trim()}
              className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/80 text-accent-foreground gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {loading ? 'Analisando...' : 'Importar'}
            </Button>
          </div>

          {loading && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--accent))]/5 border border-[hsl(var(--accent))]/20">
              <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--accent))]" />
              <span className="text-sm text-muted-foreground font-body">
                IA extraindo cifra e analisando a vibe da música...
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <X className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-sm text-destructive font-body">{error}</span>
            </div>
          )}
        </div>

        {/* Preview */}
        {preview && (
          <div className="space-y-4 mt-2">
            {/* Metadata grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-background border border-border">
                <span className="text-xs text-muted-foreground font-body block mb-1">Título</span>
                <span className="text-sm text-foreground font-display font-semibold truncate block">{preview.titulo}</span>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <span className="text-xs text-muted-foreground font-body block mb-1">Artista</span>
                <span className="text-sm text-foreground font-body truncate block">{preview.artista}</span>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <span className="text-xs text-muted-foreground font-body block mb-1">Tom</span>
                <span className="text-sm font-mono font-bold text-[hsl(var(--chord))]">{preview.tom_original}</span>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <span className="text-xs text-muted-foreground font-body block mb-1">BPM</span>
                <div className="flex items-center gap-1">
                  <Music className="h-3 w-3 text-[hsl(var(--accent))]" />
                  <span className="text-sm font-mono font-bold text-[hsl(var(--accent))]">{preview.bpm}</span>
                </div>
              </div>
            </div>

            {/* Capo indicator */}
            {preview.capo_fret > 0 && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center gap-2">
                <span className="text-orange-400 font-mono font-bold text-sm">Capo {preview.capo_fret}ª casa</span>
                <span className="text-xs text-muted-foreground">detectado automaticamente</span>
              </div>
            )}

            {/* Vibe Tags */}
            <div className="p-4 rounded-lg bg-background border border-border">
              <span className="text-xs text-muted-foreground font-body block mb-3">Vibe da Música (clique para alterar)</span>
              <div className="flex flex-wrap gap-2">
                {VIBES_AVAILABLE.map((vibe) => {
                  const isSelected = selectedVibes.includes(vibe);
                  return (
                    <Badge
                      key={vibe}
                      className={`cursor-pointer border px-3 py-1 text-xs font-medium transition-all ${
                        isSelected
                          ? VIBE_COLORS[vibe]
                          : 'bg-muted/20 text-muted-foreground border-border/50 hover:bg-muted/40 opacity-50'
                      }`}
                      onClick={() => toggleVibe(vibe)}
                    >
                      {vibe}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Cifra preview */}
            <div className="rounded-lg bg-background border border-border p-4 max-h-64 overflow-y-auto">
              <span className="text-xs text-muted-foreground font-body block mb-2">Preview da Cifra</span>
              <pre className="text-xs font-mono text-foreground whitespace-pre leading-relaxed">
                {preview.letra_cifrada}
              </pre>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={reset} className="text-muted-foreground">
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[hsl(var(--chord))] hover:bg-[hsl(var(--chord))]/80 text-[hsl(var(--background))] font-semibold gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Salvando...' : 'Confirmar e Salvar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
