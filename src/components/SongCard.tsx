import { motion } from 'framer-motion';
import { Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Musica } from '@/hooks/useMusicas';

interface SongCardProps {
  musica: Musica;
  index: number;
}

export function SongCard({ musica, index }: SongCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        to={`/musica/${musica.id}`}
        className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-card/80"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Music className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {musica.titulo}
          </h3>
          <p className="truncate text-xs text-muted-foreground font-body">
            {musica.artista || 'Artista desconhecido'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-mono text-secondary-foreground">
            {musica.tom_original}
          </span>
          {musica.bpm && (
            <span className="text-[10px] text-muted-foreground font-mono">{musica.bpm}</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
