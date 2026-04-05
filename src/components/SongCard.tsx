import { motion } from 'framer-motion';
import { Music, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Musica } from '@/hooks/useMusicas';
import { useToggleFavorite } from '@/hooks/useToggleFavorite';

interface SongCardProps {
  musica: Musica;
  index: number;
}

const VIBE_COLORS: Record<string, string> = {
  'animada': 'bg-emerald-500/20 text-emerald-400',
  'romântica': 'bg-sky-500/20 text-sky-400',
  'adoração': 'bg-purple-500/20 text-purple-400',
  'pra pular': 'bg-amber-500/20 text-amber-400',
  'modão': 'bg-orange-500/20 text-orange-400',
  'introspectiva': 'bg-slate-500/20 text-slate-400',
};

function getVibeStyle(vibe: string): string {
  const lower = vibe.toLowerCase().trim();
  return VIBE_COLORS[lower] || 'bg-muted text-muted-foreground';
}

export function SongCard({ musica, index }: SongCardProps) {
  const toggleFav = useToggleFavorite();
  const vibes = musica.vibe
    ? musica.vibe.split(',').map(v => v.trim()).filter(Boolean)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
    >
      <Link
        to={`/musica/${musica.id}`}
        className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-card/80 active:scale-[0.99]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Music className="h-4 w-4 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {musica.titulo}
          </h3>
          <p className="truncate text-xs text-muted-foreground font-body mt-0.5">
            {musica.artista || 'Artista desconhecido'}
          </p>
          {vibes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {vibes.map((v) => (
                <span
                  key={v}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getVibeStyle(v)}`}
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-mono font-semibold text-chord">
            {musica.tom_original}
          </span>
          {musica.bpm && (
            <span className="text-[10px] text-muted-foreground font-mono">{musica.bpm} bpm</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFav.mutate({ id: musica.id, isFavorite: !!musica.is_favorite });
          }}
          className="shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <Star
            className={`h-4 w-4 transition-colors ${
              musica.is_favorite ? 'text-chord fill-chord' : 'text-muted-foreground hover:text-chord'
            }`}
          />
        </button>
      </Link>
    </motion.div>
  );
}
