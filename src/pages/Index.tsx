import { useState, useMemo } from 'react';
import { Search, Music2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useMusicas } from '@/hooks/useMusicas';
import { SongCard } from '@/components/SongCard';
import { Input } from '@/components/ui/input';
import { ImportadorFlash } from '@/components/ImportadorFlash';
import { ImportadorLote } from '@/components/ImportadorLote';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const VIBES = ['Todas', 'Animada', 'Romântica', 'Adoração', 'Pra Pular', 'Modão', 'Introspectiva'] as const;

const VIBE_COLORS: Record<string, string> = {
  'Animada': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  'Romântica': 'bg-sky-500/20 text-sky-400 border-sky-500/40',
  'Adoração': 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  'Pra Pular': 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  'Modão': 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  'Introspectiva': 'bg-slate-500/20 text-slate-400 border-slate-500/40',
};

const ALL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];

const Index = () => {
  const { data: musicas, isLoading } = useMusicas();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [vibeFilter, setVibeFilter] = useState<string>('Todas');
  const [keyFilter, setKeyFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState('todas');

  const availableKeys = useMemo(() => {
    if (!musicas) return [];
    const keys = new Set(musicas.map(m => m.tom_original).filter(Boolean));
    return ALL_KEYS.filter(k => keys.has(k));
  }, [musicas]);

  const filtered = useMemo(() => {
    if (!musicas) return [];
    return musicas.filter((m) => {
      const matchSearch = !search ||
        m.titulo.toLowerCase().includes(search.toLowerCase()) ||
        (m.artista && m.artista.toLowerCase().includes(search.toLowerCase()));
      const matchVibe = vibeFilter === 'Todas' || (m.vibe && m.vibe.toLowerCase().includes(vibeFilter.toLowerCase()));
      const matchKey = !keyFilter || m.tom_original === keyFilter;
      return matchSearch && matchVibe && matchKey;
    });
  }, [musicas, search, vibeFilter, keyFilter]);

  const groupedByArtist = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach(m => {
      const artist = m.artista || 'Sem artista';
      if (!map.has(artist)) map.set(artist, []);
      map.get(artist)!.push(m);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const groupedByGenre = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach(m => {
      const genre = (m as any).genero || 'Sem gênero';
      if (!map.has(genre)) map.set(genre, []);
      map.get(genre)!.push(m);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const renderSkeletons = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-[72px] animate-pulse rounded-lg bg-card" />
      ))}
    </div>
  );

  const renderEmpty = () => (
    <div className="py-16 text-center">
      <Music2 className="mx-auto h-10 w-10 text-muted-foreground/20" />
      <p className="mt-3 text-sm text-muted-foreground font-body">
        {search || vibeFilter !== 'Todas' || keyFilter
          ? 'Nenhuma música encontrada com esses filtros.'
          : 'Nenhuma música cadastrada.'}
      </p>
    </div>
  );

  const renderAccordionGroup = (groups: [string, typeof filtered][]) => (
    <Accordion type="multiple" className="space-y-2">
      {groups.map(([groupName, songs]) => (
        <AccordionItem key={groupName} value={groupName} className="border border-border rounded-lg bg-card/50 overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-card/80">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Music2 className="h-4 w-4 text-primary" />
              </div>
              <span className="font-display text-sm font-semibold text-foreground">{groupName}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                {songs.length}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-2 pb-2">
            <div className="space-y-1.5">
              {songs.map((musica, i) => (
                <SongCard key={musica.id} musica={musica} index={i} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  // Calcula altura do cabeçalho fixo dinamicamente
  // Linha topo ~48px + busca ~44px + vibes ~36px + tom ~32px + tabs ~44px + paddings ~32px = ~236px
  const HEADER_H = availableKeys.length > 0 ? 260 : 220;

  return (
    <div className="min-h-screen bg-background">

      {/* CABEÇALHO FIXO — tudo até as tabs fica congelado */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'hsl(var(--background))', borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="container mx-auto px-4 pt-3 pb-2 max-w-3xl">

          {/* Linha 1: Voltar + Título + Importadores (admin) */}
          <div className="flex items-center gap-2 flex-wrap">
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

          {/* Linha 2: Busca */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar música ou artista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border font-body text-sm h-9"
            />
          </div>

          {/* Linha 3: Vibes */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {VIBES.map((vibe) => {
              const active = vibeFilter === vibe;
              const isAll = vibe === 'Todas';
              return (
                <button
                  key={vibe}
                  onClick={() => setVibeFilter(vibe)}
                  className={`rounded-full px-3 py-0.5 text-xs font-medium border transition-all ${
                    active
                      ? isAll ? 'bg-foreground/10 text-foreground border-foreground/30'
                        : VIBE_COLORS[vibe] || 'bg-foreground/10 text-foreground border-foreground/30'
                      : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground/40'
                  }`}
                >
                  {vibe}
                </button>
              );
            })}
          </div>

          {/* Linha 4: Tom */}
          {availableKeys.length > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono shrink-0">Tom:</span>
              <div className="flex flex-wrap gap-1">
                <button onClick={() => setKeyFilter('')}
                  className={`rounded px-2 py-0.5 text-[10px] font-mono border transition-all ${!keyFilter ? 'bg-chord/15 text-chord border-chord/40' : 'text-muted-foreground border-border'}`}>
                  Todos
                </button>
                {availableKeys.map((k) => (
                  <button key={k} onClick={() => setKeyFilter(keyFilter === k ? '' : k)}
                    className={`rounded px-2 py-0.5 text-[10px] font-mono border transition-all ${keyFilter === k ? 'bg-chord/15 text-chord border-chord/40' : 'text-muted-foreground border-border'}`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Linha 5: Tabs */}
          <div className="mt-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-card border border-border h-9">
                <TabsTrigger value="todas" className="flex-1 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Todas</TabsTrigger>
                <TabsTrigger value="artistas" className="flex-1 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Artistas</TabsTrigger>
                <TabsTrigger value="generos" className="flex-1 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Gêneros</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

        </div>
      </div>

      {/* LISTA DE MÚSICAS — começa abaixo do cabeçalho fixo */}
      <div className="container mx-auto px-4 max-w-3xl pb-8" style={{ paddingTop: `${HEADER_H}px` }}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="todas">
            {isLoading ? renderSkeletons() : filtered.length > 0 ? (
              <div className="space-y-2">
                {filtered.map((musica, i) => (
                  <SongCard key={musica.id} musica={musica} index={i} />
                ))}
              </div>
            ) : renderEmpty()}
          </TabsContent>
          <TabsContent value="artistas">
            {isLoading ? renderSkeletons() : groupedByArtist.length > 0
              ? renderAccordionGroup(groupedByArtist)
              : renderEmpty()}
          </TabsContent>
          <TabsContent value="generos">
            {isLoading ? renderSkeletons() : groupedByGenre.length > 0
              ? renderAccordionGroup(groupedByGenre)
              : renderEmpty()}
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
};

export default Index;
