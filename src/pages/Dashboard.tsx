import { motion } from 'framer-motion';
import { Music2, BookOpen, Timer, Guitar, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMusicas } from '@/hooks/useMusicas';
import { useMemo } from 'react';

const GRID_ITEMS = [
  {
    label: 'Cifras',
    icon: Music2,
    to: '/cifras',
    color: 'from-[hsl(47,95%,54%)] to-[hsl(40,96%,40%)]',
    glow: 'shadow-[0_0_30px_-5px_hsl(47,95%,54%,0.3)]',
    iconColor: 'text-black',
  },
  {
    label: 'Estude',
    icon: BookOpen,
    to: '#',
    color: 'from-[hsl(271,81%,56%)] to-[hsl(271,81%,40%)]',
    glow: 'shadow-[0_0_30px_-5px_hsl(271,81%,56%,0.3)]',
    iconColor: 'text-white',
  },
  {
    label: 'Metrônomo',
    icon: Timer,
    to: '#',
    color: 'from-[hsl(160,84%,39%)] to-[hsl(160,84%,28%)]',
    glow: 'shadow-[0_0_30px_-5px_hsl(160,84%,39%,0.3)]',
    iconColor: 'text-white',
  },
  {
    label: 'Afinador',
    icon: Guitar,
    to: '/afinador',
    color: 'from-[hsl(24,95%,53%)] to-[hsl(24,95%,38%)]',
    glow: 'shadow-[0_0_30px_-5px_hsl(24,95%,53%,0.3)]',
    iconColor: 'text-white',
  },
];

const Dashboard = () => {
  const { data: musicas } = useMusicas();

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
        className="px-6 pt-12 pb-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70">
            <Music2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
            Flow Cifras
          </h1>
        </div>
      </motion.div>

      {/* 2x2 Grid */}
      <div className="px-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
          {GRID_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.3 }}
            >
              <Link
                to={item.to}
                className={`group flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-gradient-to-br ${item.color} p-8 aspect-square transition-all hover:scale-[1.03] active:scale-[0.97] ${item.glow}`}
              >
                <item.icon className={`h-10 w-10 ${item.iconColor} drop-shadow-lg`} />
                <span className={`text-sm font-display font-semibold ${item.iconColor} tracking-wide`}>
                  {item.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 px-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-chord fill-chord" />
            <h2 className="text-sm font-display font-semibold text-foreground">Favoritos</h2>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {favorites.map((musica, i) => (
              <motion.div
                key={musica.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.05 }}
              >
                <Link
                  to={`/musica/${musica.id}`}
                  className="group flex flex-col gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 min-w-[140px] max-w-[160px] transition-all hover:bg-white/[0.06] hover:border-chord/20"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chord/10">
                    <Music2 className="h-4 w-4 text-chord" />
                  </div>
                  <p className="text-xs font-display font-semibold text-foreground truncate mt-1 group-hover:text-chord transition-colors">
                    {musica.titulo}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {musica.artista || '—'}
                  </p>
                  <span className="text-[10px] font-mono text-chord/70">{musica.tom_original}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
