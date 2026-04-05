import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Music2 } from 'lucide-react';
import { useMusicas } from '@/hooks/useMusicas';
import { SongCard } from '@/components/SongCard';
import { Input } from '@/components/ui/input';

const Index = () => {
  const { data: musicas, isLoading } = useMusicas();
  const [search, setSearch] = useState('');

  const filtered = musicas?.filter(m =>
    m.titulo.toLowerCase().includes(search.toLowerCase()) ||
    (m.artista && m.artista.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Music2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-5xl text-foreground tracking-tight">
              Cifras Flow
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-4 max-w-md text-lg text-muted-foreground font-body"
          >
            Suas cifras e letras em um só lugar. Toque, transponha e flua.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative mt-8 max-w-md"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar música ou artista..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-card border-border font-body"
            />
          </motion.div>
        </div>
      </div>

      {/* Song list */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-card" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((musica, i) => (
              <SongCard key={musica.id} musica={musica} index={i} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Music2 className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground font-body">
              {search ? 'Nenhuma música encontrada.' : 'Nenhuma música cadastrada ainda.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
