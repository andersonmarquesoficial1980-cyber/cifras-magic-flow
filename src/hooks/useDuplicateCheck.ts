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

export async function checkDuplicatesBatch(
  songs: { titulo: string; url: string }[]
): Promise<Set<string>> {
  // Get all existing songs and check against them
  const { data } = await supabase
    .from('musicas')
    .select('titulo, artista');

  if (!data?.length) return new Set();

  const existingSet = new Set(
    data.map((m) => m.titulo?.toLowerCase().trim())
  );

  const duplicateUrls = new Set<string>();
  for (const song of songs) {
    if (existingSet.has(song.titulo?.toLowerCase().trim())) {
      duplicateUrls.add(song.url);
    }
  }

  return duplicateUrls;
}
