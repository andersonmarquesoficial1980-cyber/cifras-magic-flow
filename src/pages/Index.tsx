import { useState, useMemo } from 'react';
import { Search, Music2, ArrowLeft, Users, Tag, ChevronRight, Star, TrendingUp, Send } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useMusicas } from '@/hooks/useMusicas';
import { SongCard } from '@/components/SongCard';
import { Input } from '@/components/ui/input';
import { ImportadorFlash } from '@/components/ImportadorFlash';
import { ImportadorLote } from '@/components/ImportadorLote';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { data: musicas, isLoading } = useMusicas();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [musicaPedido, setMusicaPedido] = useState('');
  const [artistaPedido, setArtistaPedido] = useState('');
  const [enviando, setEnviando] = useState(false);

  const filtered = useMemo(() => {
    if (!search || !musicas) return [];
    return musicas.filter((m) =>
      m.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (m.artista && m.artista.toLowerCase().includes(search.toLowerCase()))
    );
  }, [musicas, search]);

  // Top 20 mais recentes (futuro: por views)
  const top20 = useMemo(() => {
    if (!musicas) return [];
    return [...musicas].slice(0, 20);
  }, [musicas]);

  // Top artistas por qtd de músicas
  const topArtistas = useMemo(() => {
    if (!musicas) return [];
    const map = new Map<string, number>();
    musicas.forEach(m => {
      const a = m.artista || 'Sem artista';
      map.set(a, (map.get(a) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [musicas]);

  async function handlePedido(e: React.FormEvent) {
    e.preventDefault();
    if (!musicaPedido.trim()) return;
    setEnviando(true);
    await supabase.from('feedbacks').insert({
      tipo: 'pedido',
      mensagem: `Pedido: ${musicaPedido.trim()}${artistaPedido ? ` - ${artistaPedido.trim()}` : ''}`,
      musica_sugerida: musicaPedido.trim(),
      artista_sugerido: artistaPedido.trim() || null,
    });
    setEnviando(false);
    setMusicaPedido('');
    setArtistaPedido('');
    toast({ title: 'Pedido enviado! 🎵', description: 'Vamos tentar adicionar em breve.' });
  }

  const HEADER_H = search ? 120 : 120;

  return (
    <div className="min-h-screen bg-background">

      {/* Header fixo com busca */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'hsl(var(--background))', borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="container mx-auto px-4 pt-3 pb-3 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Voltar</span>
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <h1 className="font-display text-lg font-bold text-foreground">Cifras</h1>
            {isAdmin && (
              <div className="flex gap-2 ml-auto">
                <ImportadorFlash />
                <ImportadorLote />
              </div>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar música ou artista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border font-body text-sm h-9"
            />
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 max-w-3xl pb-10" style={{ paddingTop: `${HEADER_H}px` }}>

        {/* Resultados de busca */}
        {search ? (
          <div className="space-y-2 mt-2">
            {filtered.length > 0 ? filtered.map((m, i) => (
              <SongCard key={m.id} musica={m} index={i} />
            )) : (
              <div className="py-12 text-center">
                <Music2 className="mx-auto h-10 w-10 text-muted-foreground/20" />
                <p className="mt-3 text-sm text-muted-foreground">Nenhuma música encontrada.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Botões Artistas e Gêneros */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Link to="/artistas" className="group relative overflow-hidden rounded-2xl p-5 flex flex-col gap-2 transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(168,85,247,0.3)' }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-display text-base font-bold text-white">Artistas</p>
                  <p className="text-xs text-purple-300/70">{musicas ? new Set(musicas.map(m => m.artista)).size : '—'} artistas</p>
                </div>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400/50 group-hover:text-purple-400 transition-colors" />
                <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/5 transition-colors rounded-2xl" />
              </Link>

              <Link to="/generos" className="group relative overflow-hidden rounded-2xl p-5 flex flex-col gap-2 transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #1a2e1a 0%, #162e16 100%)', border: '1px solid rgba(250,204,21,0.3)' }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FACC15]/20">
                  <Tag className="h-5 w-5 text-[#FACC15]" />
                </div>
                <div>
                  <p className="font-display text-base font-bold text-white">Gêneros</p>
                  <p className="text-xs text-yellow-300/70">{musicas ? new Set(musicas.map(m => (m as any).genero).filter(Boolean)).size : '—'} gêneros</p>
                </div>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#FACC15]/50 group-hover:text-[#FACC15] transition-colors" />
                <div className="absolute inset-0 bg-[#FACC15]/0 group-hover:bg-[#FACC15]/5 transition-colors rounded-2xl" />
              </Link>
            </div>

            {/* Pedir música */}
            <div className="mt-4 rounded-2xl border border-[#FACC15]/20 bg-[#FACC15]/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Music2 className="h-4 w-4 text-[#FACC15]" />
                <h2 className="text-sm font-display font-bold text-foreground">Pedir Música</h2>
              </div>
              <form onSubmit={handlePedido} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={musicaPedido} onChange={e => setMusicaPedido(e.target.value)}
                    placeholder="Nome da música" required
                    className="bg-card border-border text-sm h-9" />
                  <Input value={artistaPedido} onChange={e => setArtistaPedido(e.target.value)}
                    placeholder="Artista (opcional)"
                    className="bg-card border-border text-sm h-9" />
                </div>
                <button type="submit" disabled={enviando || !musicaPedido.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold text-sm py-2 transition-colors disabled:opacity-50">
                  <Send size={14} />
                  {enviando ? 'Enviando...' : 'Pedir Música'}
                </button>
              </form>
            </div>

            {/* Artistas em destaque */}
            {topArtistas.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-[#FACC15]" />
                  <h2 className="text-sm font-display font-bold text-foreground">Artistas em Destaque</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topArtistas.map(([artista, count]) => (
                    <Link key={artista} to={`/artista/${encodeURIComponent(artista)}`}
                      className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-all">
                      <Music2 className="h-3 w-3 text-muted-foreground" />
                      {artista}
                      <span className="text-muted-foreground">({count})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Top 20 */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-[#FACC15] fill-[#FACC15]" />
                <h2 className="text-sm font-display font-bold text-foreground">Mais Tocadas</h2>
                <span className="text-xs text-muted-foreground font-mono ml-1">(top 20)</span>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-[72px] animate-pulse rounded-lg bg-card" />)}
                </div>
              ) : (
                <div className="space-y-1">
                  {top20.map((m, i) => (
                    <Link key={m.id} to={`/musica/${m.id}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-card transition-colors">
                      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.titulo}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.artista}</p>
                      </div>
                      <span className="text-xs font-mono text-chord shrink-0">{m.tom_original}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>


          </>
        )}
      </div>
    </div>
  );
};

export default Index;
