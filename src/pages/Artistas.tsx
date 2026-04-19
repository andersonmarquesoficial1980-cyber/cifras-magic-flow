import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMusicas } from '@/hooks/useMusicas';
import { ArrowLeft, Music2, ChevronRight, Users } from 'lucide-react';

export default function Artistas() {
  const navigate = useNavigate();
  const { data: musicas, isLoading } = useMusicas();

  const artistas = useMemo(() => {
    if (!musicas) return [];
    const map = new Map<string, number>();
    musicas.forEach(m => {
      const a = m.artista || 'Sem artista';
      map.set(a, (map.get(a) || 0) + 1);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [musicas]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background px-4 py-4">
        <div className="container mx-auto max-w-3xl flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Voltar</span>
          </button>
          <div className="h-4 w-px bg-border mx-1" />
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20">
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Artistas</h1>
            <p className="text-xs text-muted-foreground">{artistas.length} artistas</p>
          </div>
        </div>
      </div>
      <div className="container mx-auto max-w-3xl px-4 py-4 space-y-2">
        {isLoading ? (
          [...Array(8)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-card" />)
        ) : artistas.map(([nome, count]) => (
          <Link key={nome} to={`/artista/${encodeURIComponent(nome)}`}
            className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-purple-500/30 hover:bg-card/80 transition-all active:scale-[0.99]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-purple-500/10">
              <Music2 className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-semibold text-foreground group-hover:text-purple-400 transition-colors truncate">{nome}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{count} música{count !== 1 ? 's' : ''}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-400 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
