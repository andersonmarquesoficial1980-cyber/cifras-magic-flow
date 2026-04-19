import { supabase } from '@/integrations/supabase/client';

export async function checkDuplicate(titulo: string, artista: string | null): Promise<boolean> {
  const query = supabase
    .from('musicas')
    .select('id')
    .ilike('titulo', titulo.trim());

  if (artista) {
    query.ilike('artista', artista.trim());
  }

  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}

// Normaliza string para comparação: minúsculas, sem acentos, sem pontuação extra
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s]/g, '')     // remove pontuação
    .replace(/\s+/g, ' ')
    .trim();
}

export async function checkDuplicatesBatch(
  songs: { titulo: string; url: string }[]
): Promise<Set<string>> {
  // Busca source_urls existentes para comparação exata por URL
  const { data: byUrl } = await supabase
    .from('musicas')
    .select('source_url')
    .not('source_url', 'is', null);

  const existingUrls = new Set(
    (byUrl ?? []).map((m) => m.source_url as string)
  );

  // Fallback: também busca por título normalizado (músicas sem source_url)
  const { data: byTitle } = await supabase
    .from('musicas')
    .select('titulo')
    .is('source_url', null);

  const existingTitles = new Set(
    (byTitle ?? []).map((m) => normalize(m.titulo ?? ''))
  );

  const duplicateUrls = new Set<string>();
  for (const song of songs) {
    if (existingUrls.has(song.url) || existingTitles.has(normalize(song.titulo))) {
      duplicateUrls.add(song.url);
    }
  }

  return duplicateUrls;
}
