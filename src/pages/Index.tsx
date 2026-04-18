import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Music2, ArrowLeft, ChevronDown } from 'lucide-react';
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

  // Group by artist
  const groupedByArtist = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach(m => {
      const artist = m.artista || 'Sem artista';
      if (!map.has(artist)) map.set(artist, []);
      map.get(artist)!.push(m);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Group by genre
  const groupedByGenre = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach(m => {
      const genre = m.genero || 'Sem gênero';
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 pt-6 pb-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mr-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-body">Voltar</span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Music2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
              Cifras
            </h1>

          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-sm text-muted-foreground font-body max-w-sm"
          >
            Cifras e letras com transposição e campo harmônico.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-4"
          >
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                <ImportadorFlash />
                <ImportadorLote />
              </div>
            )}
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative mt-5"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar música ou artista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border font-body text-sm"
            />
          </motion.div>

          {/* Vibe pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {VIBES.map((vibe) => {
              const active = vibeFilter === vibe;
              const isAll = vibe === 'Todas';
              return (
                <button
                  key={vibe}
                  onClick={() => setVibeFilter(vibe)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                    active
                      ? isAll
                        ? 'bg-foreground/10 text-foreground border-foreground/30'
                        : VIBE_COLORS[vibe] || 'bg-foreground/10 text-foreground border-foreground/30'
                      : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground/40 hover:text-foreground/70'
                  }`}
                >
                  {vibe}
                </button>
              );
            })}
          </motion.div>

          {/* Key filter */}
          {availableKeys.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-3 flex items-center gap-2"
            >
              <span className="text-xs text-muted-foreground font-mono shrink-0">Tom:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setKeyFilter('')}
                  className={`rounded px-2 py-0.5 text-[10px] font-mono border transition-all ${
                    !keyFilter
                      ? 'bg-chord/15 text-chord border-chord/40'
                      : 'text-muted-foreground border-border hover:border-muted-foreground/40'
                  }`}
                >
                  Todos
                </button>
                {availableKeys.map((k) => (
                  <button
                    key={k}
                    onClick={() => setKeyFilter(keyFilter === k ? '' : k)}
                    className={`rounded px-2 py-0.5 text-[10px] font-mono border transition-all ${
                      keyFilter === k
                        ? 'bg-chord/15 text-chord border-chord/40'
                        : 'text-muted-foreground border-border hover:border-muted-foreground/40'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Tabs congeladas no sticky header */}
      <div className="sticky top-[var(--header-h,140px)] z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 max-w-3xl py-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-card border border-border">
            <TabsTrigger value="todas" className="flex-1 text-xs font-body data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Todas
            </TabsTrigger>
            <TabsTrigger value="artistas" className="flex-1 text-xs font-body data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Artistas
            </TabsTrigger>
            <TabsTrigger value="generos" className="flex-1 text-xs font-body data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Gêneros
            </TabsTrigger>
          </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-5 max-w-3xl">
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
