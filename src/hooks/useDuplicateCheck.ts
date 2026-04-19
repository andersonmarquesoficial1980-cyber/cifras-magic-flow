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
  // Busca todas as músicas existentes
  const { data } = await supabase
    .from('musicas')
    .select('titulo, artista');

  if (!data?.length) return new Set();

  const existingSet = new Set(
    data.map((m) => normalize(m.titulo ?? ''))
  );

  const duplicateUrls = new Set<string>();
  for (const song of songs) {
    if (existingSet.has(normalize(song.titulo))) {
      duplicateUrls.add(song.url);
    }
  }

  return duplicateUrls;
}
