import { useLocation, Link } from 'react-router-dom';
import { Home, Music2, BookOpen, Timer, Guitar, MessageSquare } from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home, label: 'Início', to: '/' },
  { icon: Music2, label: 'Cifras', to: '/cifras' },
  { icon: BookOpen, label: 'Estude', to: '/estude' },
  { icon: Timer, label: 'Metrônomo', to: '/metronomo' },
  { icon: Guitar, label: 'Afinador', to: '/afinador' },
  { icon: MessageSquare, label: 'Contato', to: '/feedback' },
];

export function BottomNav() {
  const { pathname } = useLocation();

  // Não mostrar em telas de cifra individual
  if (pathname.startsWith('/musica/')) return null;

  const isActive = (to: string) => {
    if (to === '/') return pathname === '/';
    return pathname.startsWith(to);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'hsl(var(--background))',
      borderTop: '1px solid hsl(var(--border))',
    }}>
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center justify-around px-2 py-1">
          {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
            const active = isActive(to);
            return (
              <Link key={to} to={to}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                  active ? 'text-[#FACC15]' : 'text-muted-foreground hover:text-foreground'
                }`}>
                <Icon size={active ? 22 : 20} strokeWidth={active ? 2.5 : 1.5} />
                <span className={`text-[10px] font-medium ${active ? 'text-[#FACC15]' : ''}`}>{label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-[#FACC15] mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
