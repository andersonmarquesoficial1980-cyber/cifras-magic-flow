import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Musica = Tables<'musicas'>;

export function useMusicas() {
  return useQuery({
    queryKey: ['musicas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('musicas')
        .select('*')
        .order('titulo')
        .limit(5000); // Supabase default limit é 1000, forçamos maior
      if (error) throw error;
      return data as Musica[];
    },
  });
}

export function useMusicasCount() {
  return useQuery({
    queryKey: ['musicas-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('musicas')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMusica(id: string | undefined) {
  return useQuery({
    queryKey: ['musica', id],
    queryFn: async () => {
      if (!id) throw new Error('No id');
      const { data, error } = await supabase
        .from('musicas')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Musica;
    },
    enabled: !!id,
  });
}
