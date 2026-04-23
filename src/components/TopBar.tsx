import { Link, useLocation } from 'react-router-dom';

// Páginas que já têm header próprio com o logo (não duplicar)
const PAGES_WITH_OWN_HEADER = ['/', '/cifras', '/landing'];

export function TopBar() {
  const { pathname } = useLocation();

  // Não mostrar em páginas que já têm header próprio
  if (PAGES_WITH_OWN_HEADER.includes(pathname)) return null;

  // Não mostrar em páginas de detalhe (musica, artista, genero)
  if (
    pathname.startsWith('/musica/') ||
    pathname.startsWith('/artista/') ||
    pathname.startsWith('/genero/') ||
    pathname.startsWith('/estude/')
  ) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="container mx-auto max-w-3xl flex items-center justify-center px-4 py-3">
        <Link to="/">
          <img src="/logo-dark.png" alt="MelodAI" className="h-8 w-auto" />
        </Link>
      </div>
    </div>
  );
}
