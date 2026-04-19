import { useParams, useNavigate } from 'react-router-dom';
import { useMusicas } from '@/hooks/useMusicas';
import { useMemo } from 'react';
import { ArrowLeft, Music2, Tag } from 'lucide-react';
import { SongCard } from '@/components/SongCard';

export default function GeneroDetail() {
  const { nome } = useParams<{ nome: string }>();
  const nomeDecoded = decodeURIComponent(nome || '');
  const navigate = useNavigate();
  const { data: musicas, isLoading } = useMusicas();

  const songs = useMemo(() => {
    if (!musicas) return [];
    return musicas.filter(m => ((m as any).genero || 'Sem gênero') === nomeDecoded);
  }, [musicas, nomeDecoded]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background px-4 py-4">
        <div className="container mx-auto max-w-3xl flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Voltar</span>
          </button>
          <div className="h-4 w-px bg-border mx-1" />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FACC15]/10">
            <Tag className="h-5 w-5 text-[#FACC15]" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{nomeDecoded}</h1>
            <p className="text-xs text-muted-foreground">{songs.length} música{songs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
      <div className="container mx-auto max-w-3xl px-4 py-5">
        {isLoading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-[72px] animate-pulse rounded-lg bg-card" />)}</div>
        ) : songs.length > 0 ? (
          <div className="space-y-2">{songs.map((m, i) => <SongCard key={m.id} musica={m} index={i} />)}</div>
        ) : (
          <div className="py-16 text-center">
            <Music2 className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-3 text-sm text-muted-foreground">Nenhuma música encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
