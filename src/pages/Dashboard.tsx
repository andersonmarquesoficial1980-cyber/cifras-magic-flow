import { motion } from 'framer-motion';
import { Music2, BookOpen, Timer, Guitar, Star, LogIn, LogOut, Crown, Settings, MessageSquare, Lock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMusicas } from '@/hooks/useMusicas';
import { useToggleFavorite } from '@/hooks/useToggleFavorite';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';

const GRID_ITEMS = [
  {
    label: 'Cifras',
    icon: Music2,
    to: '/cifras',
    color: 'from-[#FACC15] to-[#D4A90A]',
    glow: 'shadow-[0_0_40px_-8px_rgba(250,204,21,0.35)]',
    iconColor: 'text-black',
    desc: 'Buscar músicas',
    requiresPremium: false
  },
  {
    label: 'Estude',
    icon: BookOpen,
    to: '/estude',
    color: 'from-[#3B82F6] to-[#2563EB]',
    glow: 'shadow-[0_0_40px_-8px_rgba(59,130,246,0.35)]',
    iconColor: 'text-white',
    desc: 'Campo harmônico',
    requiresPremium: false
  },
  {
    label: 'Metrônomo',
    icon: Timer,
    to: '/metronomo',
    color: 'from-[#10B981] to-[#059669]',
    glow: 'shadow-[0_0_40px_-8px_rgba(16,185,129,0.35)]',
    iconColor: 'text-white',
    desc: 'Marcar tempo',
    requiresPremium: true
  },
  {
    label: 'Afinador',
    icon: Guitar,
    to: '/afinador',
    color: 'from-[#A855F7] to-[#7C3AED]',
    glow: 'shadow-[0_0_40px_-8px_rgba(168,85,247,0.35)]',
    iconColor: 'text-white',
    desc: 'Afinar violão',
    requiresPremium: true
  },
  {
    label: 'Fale Conosco',
    icon: MessageSquare,
    to: '/feedback',
    color: 'from-[#EC4899] to-[#C026D3]',
    glow: 'shadow-[0_0_40px_-8px_rgba(236,72,153,0.35)]',
    iconColor: 'text-white',
    desc: 'Ajuda e ideias',
    requiresPremium: false
  },
];

const Dashboard = () => {
  const { data: musicas } = useMusicas();
  const toggleFav = useToggleFavorite();
  const { isLoggedIn, isPremium, isAdmin, profile, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const favorites = useMemo(() => {
    if (!musicas) return [];
    return musicas.filter((m) => m.is_favorite);
  }, [musicas]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-10 pb-2"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center">
            <img src="/logo-dark.png" alt="MelodAI" className="h-14 w-auto" />
          </div>
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {isPremium && (
                    <span className="text-[10px] text-[#FACC15] border border-[#FACC15]/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <Crown size={10} />{isAdmin ? 'Admin' : 'Premium'}
                    </span>
                  )}
                  <Link to="/configuracoes" className="flex items-center justify-center h-9 w-9 rounded-full border border-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors">
                    <Settings size={16} />
                  </Link>
                </div>
                {isAdmin && musicas && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {musicas.length} músicas cadastradas
                  </span>
                )}
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} className="flex items-center gap-1.5 text-xs text-[#FACC15] border border-[#FACC15]/30 rounded-full px-3 py-1.5 hover:bg-[#FACC15]/10 transition-colors">
                <LogIn size={13} />
                Entrar
              </button>
            )}
          </div>
          </div>
        </div>
      </motion.div>

      {/* Vertical Stack */}
      <div className="px-6 pt-6 flex flex-col gap-3">
        {GRID_ITEMS.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 + i * 0.05, duration: 0.3 }}
          >
            {item.requiresPremium && !isPremium ? (
              <Link
                to="/landing"
                className="group flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-5 py-4 transition-all opacity-70 hover:bg-white/[0.04]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] grayscale">
                  <item.icon className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-display font-bold text-gray-400 tracking-wide flex items-center gap-2">
                    {item.label} <Lock size={12} className="text-gray-500" />
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Exclusivo Premium
                  </span>
                </div>
                <ChevronRight className="text-gray-600 h-4 w-4 opacity-50" />
              </Link>
            ) : (
              <Link
                to={item.to}
                className={`group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 transition-all hover:bg-white/[0.06] hover:border-white/[0.12] active:scale-[0.98] ${item.glow}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color}`}>
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-display font-bold text-foreground tracking-wide">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {item.desc}
                  </span>
                </div>
              </Link>
            )}
          </motion.div>
        ))}
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
