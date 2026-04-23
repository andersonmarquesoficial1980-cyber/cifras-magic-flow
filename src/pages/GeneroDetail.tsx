import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMusicas } from '@/hooks/useMusicas';
import { useMemo } from 'react';
import { ArrowLeft, Music2, Tag, Mic2, ChevronRight } from 'lucide-react';
import { ImportadorFlash } from '@/components/ImportadorFlash';
import { useAuth } from '@/hooks/useAuth';

export default function GeneroDetail() {
  const { nome } = useParams<{ nome: string }>();
  const nomeDecoded = decodeURIComponent(nome || '');
  const navigate = useNavigate();
  const { data: musicas, isLoading } = useMusicas();
  const { isAdmin } = useAuth();

  const artists = useMemo(() => {
    if (!musicas) return [];
    
    // Filtra músicas do gênero
    const songsInGenre = musicas.filter(m => ((m as any).genero || 'Sem gênero') === nomeDecoded);
    
    // Agrupa por artista
    const grouped = songsInGenre.reduce((acc, song) => {
      const art = song.artista || 'Desconhecido';
      if (!acc[art]) acc[art] = 0;
      acc[art]++;
      return acc;
    }, {} as Record<string, number>);
    
    // Retorna array ordenado alfabeticamente
    return Object.entries(grouped)
      .map(([nome, count]) => ({ nome, count }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
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
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-foreground">{nomeDecoded}</h1>
            <p className="text-xs text-muted-foreground">{artists.length} artista{artists.length !== 1 ? 's' : ''}</p>
          </div>
          {isAdmin && <ImportadorFlash />}
        </div>
      </div>
      
      <div className="container mx-auto max-w-3xl px-4 py-5">
        {isLoading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-card" />)}</div>
        ) : artists.length > 0 ? (
          <div className="flex flex-col gap-2">
            {artists.map((artist) => (
              <Link 
                to={`/artista/${encodeURIComponent(artist.nome)}`} 
                key={artist.nome}
                className="group flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] hover:border-white/[0.08]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-muted-foreground group-hover:bg-[#FACC15]/10 group-hover:text-[#FACC15] transition-colors">
                    <Mic2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-foreground">{artist.nome}</h2>
                    <p className="text-xs text-muted-foreground">{artist.count} música{artist.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-[#FACC15] group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Music2 className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-3 text-sm text-muted-foreground">Nenhum artista encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
