import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Musica } from '@/hooks/useMusicas';
import { Loader2, Sparkles, Play } from 'lucide-react';

interface FlowFooterProps {
  musica: Musica;
}

export function FlowFooter({ musica }: FlowFooterProps) {
  const [suggestions, setSuggestions] = useState<Musica[] | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchSuggestions = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('musicas')
        .select('*')
        .eq('tom_original', musica.tom_original)
        .eq('genero', musica.genero ?? '')
        .neq('id', musica.id)
        .limit(3);

      if (error) throw error;
      setSuggestions(data as Musica[]);
    } catch (e) {
      console.error(e);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    navigate(`/musica/${id}`);
    setSuggestions(null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-card/95 backdrop-blur-xl">
      <div className="container mx-auto max-w-3xl px-4 py-3">
        {!suggestions ? (
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
              <p className="text-xs font-semibold text-foreground font-body">Sugerir Próxima</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground font-body">
                {loading
                  ? 'Buscando músicas compatíveis...'
                  : `Medley em ${musica.tom_original} • ${musica.genero || 'Geral'}`}
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
                Sugestões em <span className="text-chord font-bold">{musica.tom_original}</span>
              </p>
              <button
                onClick={() => setSuggestions(null)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Fechar
              </button>
            </div>
            {suggestions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-2">
                Nenhuma música compatível encontrada.
              </p>
            ) : (
              <div className="grid gap-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(s.id)}
                    className="flex items-center gap-2.5 rounded-lg bg-secondary/60 px-3 py-2 text-left transition-colors hover:bg-secondary w-full"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background text-[10px] font-mono font-bold text-chord">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{s.titulo}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {s.artista || 'Artista desconhecido'}
                      </p>
                    </div>
                    <Play className="h-3 w-3 shrink-0 text-chord" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
