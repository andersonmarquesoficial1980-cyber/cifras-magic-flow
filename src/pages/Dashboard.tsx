import { motion } from 'framer-motion';
import { Music2, BookOpen, Timer, Guitar, Star, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMusicas } from '@/hooks/useMusicas';
import { useToggleFavorite } from '@/hooks/useToggleFavorite';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';

const GRID_ITEMS = [
  {
    label: 'Cifras',
    icon: Music2,
    to: '/cifras',
    color: 'from-[#FACC15] to-[#D4A90A]',
    glow: 'shadow-[0_0_40px_-8px_rgba(250,204,21,0.35)]',
    iconColor: 'text-black',
    desc: 'Buscar músicas',
  },
  {
    label: 'Estude',
    icon: BookOpen,
    to: '/estude',
    color: 'from-[#3B82F6] to-[#2563EB]',
    glow: 'shadow-[0_0_40px_-8px_rgba(59,130,246,0.35)]',
    iconColor: 'text-white',
    desc: 'Campo harmônico',
  },
  {
    label: 'Metrônomo',
    icon: Timer,
    to: '/metronomo',
    color: 'from-[#10B981] to-[#059669]',
    glow: 'shadow-[0_0_40px_-8px_rgba(16,185,129,0.35)]',
    iconColor: 'text-white',
    desc: 'Marcar tempo',
  },
  {
    label: 'Afinador',
    icon: Guitar,
    to: '/afinador',
    color: 'from-[#A855F7] to-[#7C3AED]',
    glow: 'shadow-[0_0_40px_-8px_rgba(168,85,247,0.35)]',
    iconColor: 'text-white',
    desc: 'Afinar violão',
  },
];

const Dashboard = () => {
  const { data: musicas } = useMusicas();
  const toggleFav = useToggleFavorite();

  const favorites = useMemo(() => {
    if (!musicas) return [];
    return musicas.filter((m) => m.is_favorite);
  }, [musicas]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-10 pb-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-chord to-chord/60 shadow-[0_0_20px_-4px_rgba(250,204,21,0.3)]">
              <Music2 className="h-5 w-5 text-black" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
                Flow Cifras
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Seu companheiro musical</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground border border-white/[0.06]">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>

      {/* 2x2 Grid */}
      <div className="px-6 pt-6">
        <div className="grid grid-cols-2 gap-4">
          {GRID_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.3 }}
            >
              <Link
                to={item.to}
                className={`group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-gradient-to-br ${item.color} p-7 aspect-square transition-all hover:scale-[1.03] active:scale-[0.97] ${item.glow}`}
              >
                <item.icon className={`h-10 w-10 ${item.iconColor} drop-shadow-lg`} />
                <span className={`text-sm font-display font-bold ${item.iconColor} tracking-wide`}>
                  {item.label}
                </span>
                <span className={`text-[10px] ${item.iconColor} opacity-70`}>
                  {item.desc}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Favorites Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 px-6 pb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-4 w-4 text-chord fill-chord" />
          <h2 className="text-sm font-display font-semibold text-foreground">Minhas Favoritas</h2>
          {favorites.length > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono ml-1">({favorites.length})</span>
          )}
        </div>

        {favorites.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-6 px-6">
            {favorites.map((musica, i) => (
              <motion.div
                key={musica.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.04 }}
                className="relative"
              >
                <Link
                  to={`/musica/${musica.id}`}
                  className="group flex flex-col gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 min-w-[150px] max-w-[170px] transition-all hover:bg-white/[0.06] hover:border-chord/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chord/10">
                      <Music2 className="h-4 w-4 text-chord" />
                    </div>
                  </div>
                  <p className="text-xs font-display font-semibold text-foreground truncate mt-1 group-hover:text-chord transition-colors">
                    {musica.titulo}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {musica.artista || '—'}
                  </p>
                  <span className="text-[10px] font-mono text-chord/70">{musica.tom_original}</span>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFav.mutate({ id: musica.id, isFavorite: !!musica.is_favorite });
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Star className="h-3.5 w-3.5 text-chord fill-chord" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] py-8 text-center">
            <Star className="mx-auto h-8 w-8 text-muted-foreground/20" />
            <p className="mt-2 text-xs text-muted-foreground">
              Toque na ⭐ de uma música para adicioná-la aqui.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
