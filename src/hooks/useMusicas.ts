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
        .order('titulo');
      if (error) throw error;
      return data as Musica[];
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
