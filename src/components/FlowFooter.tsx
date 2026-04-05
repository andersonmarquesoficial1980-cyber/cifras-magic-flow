import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Musica } from '@/hooks/useMusicas';
import { Music, Loader2, Sparkles } from 'lucide-react';

interface MedleySugestao {
  titulo: string;
  artista: string;
  tom: string;
  motivo: string;
}

interface MedleyResult {
  progressao: string;
  sugestoes: MedleySugestao[];
}

interface FlowFooterProps {
  musica: Musica;
}

export function FlowFooter({ musica }: FlowFooterProps) {
  const [result, setResult] = useState<MedleyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('suggest-medley', {
        body: {
          titulo: musica.titulo,
          tom: musica.tom_original,
          genero: musica.genero,
          artista: musica.artista,
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setResult(data as MedleyResult);
    } catch (e: any) {
      console.error(e);
      setError('Não foi possível gerar sugestões.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="container mx-auto max-w-3xl px-4 py-3">
        {!result ? (
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="flex w-full items-center gap-3 text-left transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <div
                className="absolute inset-0 rounded-lg opacity-40 blur-md"
                style={{ background: 'hsl(var(--flow-glow))' }}
              />
              {loading ? (
                <Loader2 className="relative h-4 w-4 animate-spin text-foreground" />
              ) : (
                <Sparkles className="relative h-4 w-4" style={{ color: 'hsl(var(--flow-glow))' }} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground font-body">Próximo Passo do Flow</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground font-body">
                {loading
                  ? 'IA analisando o tom e o ritmo para sugerir a próxima música...'
                  : error
                    ? error
                    : `Toque para sugerir medley em ${musica.tom_original} • ${musica.genero || 'Geral'}`}
              </p>
            </div>
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                background: 'hsl(var(--flow-glow))',
                boxShadow: '0 0 8px 2px hsl(var(--flow-glow) / 0.5)',
              }}
            />
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono text-muted-foreground">
                Progressão: <span className="text-chord font-bold">{result.progressao}</span>
              </p>
              <button
                onClick={() => setResult(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Fechar
              </button>
            </div>
            <div className="grid gap-1.5">
              {result.sugestoes.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg bg-secondary/60 px-3 py-2"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background text-[10px] font-mono font-bold text-chord">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{s.titulo}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {s.artista} • Tom: {s.tom}
                    </p>
                  </div>
                  <Music className="h-3 w-3 shrink-0 text-muted-foreground" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center italic">
              {result.sugestoes[0]?.motivo}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
