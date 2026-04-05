import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Music2 } from 'lucide-react';
import { useMusicas } from '@/hooks/useMusicas';
import { SongCard } from '@/components/SongCard';
import { Input } from '@/components/ui/input';
import { ImportadorFlash } from '@/components/ImportadorFlash';

const Index = () => {
  const { data: musicas, isLoading } = useMusicas();
  const [search, setSearch] = useState('');

  const filtered = musicas?.filter(
    (m) =>
      m.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (m.artista && m.artista.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Music2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
              Cifras Flow
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-sm text-muted-foreground font-body max-w-sm"
          >
            Cifras e letras com transposição e campo harmônico.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative mt-6 max-w-sm"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar música ou artista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border font-body text-sm"
            />
          </motion.div>
        </div>
      </div>

      {/* List */}
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-card" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((musica, i) => (
              <SongCard key={musica.id} musica={musica} index={i} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Music2 className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-3 text-sm text-muted-foreground font-body">
              {search ? 'Nenhuma música encontrada.' : 'Nenhuma música cadastrada.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
