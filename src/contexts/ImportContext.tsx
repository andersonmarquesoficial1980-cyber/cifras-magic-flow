import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { checkDuplicatesBatch } from '@/hooks/useDuplicateCheck';

interface SongLink {
  titulo: string;
  url: string;
  selected: boolean;
}

export type ImportStatus = 'idle' | 'scanning' | 'importing' | 'done';

interface ImportResult {
  titulo: string;
  success: boolean;
  error?: string;
}

interface ImportContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
  url: string;
  setUrl: (v: string) => void;
  genero: string;
  setGenero: (v: string) => void;
  songs: SongLink[];
  setSongs: (v: SongLink[]) => void;
  duplicateUrls: Set<string>;
  status: ImportStatus;
  current: number;
  results: ImportResult[];
  scanError: string;
  showReport: boolean;
  setShowReport: (v: boolean) => void;
  showDupesOnly: boolean;
  setShowDupesOnly: (v: boolean) => void;
  isRunning: boolean;
  handleScan: () => Promise<void>;
  handleImport: () => Promise<void>;
  handleAbort: () => void;
  toggleAll: () => void;
  toggleSong: (i: number) => void;
  deselectDupes: () => void;
  reset: () => void;
  selectedCount: number;
}

const ImportContext = createContext<ImportContextType | null>(null);

export function ImportProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [genero, setGenero] = useState('');
  const [songs, setSongs] = useState<SongLink[]>([]);
  const [duplicateUrls, setDuplicateUrls] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [scanError, setScanError] = useState('');
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [showDupesOnly, setShowDupesOnly] = useState(false);
  const abortRef = useRef(false);
  const queryClient = useQueryClient();

  const isRunning = status === 'importing' || status === 'scanning';

  const reset = () => {
    setUrl('');
    setGenero('');
    setDuplicateUrls(new Set());
    setSongs([]);
    setStatus('idle');
    setScanError('');
    setCurrent(0);
    setResults([]);
    setShowReport(false);
    setShowDupesOnly(false);
    abortRef.current = false;
  };

  const toggleAll = () => {
    const allSelected = songs.every(s => s.selected);
    setSongs(songs.map(s => ({ ...s, selected: !allSelected })));
  };

  const toggleSong = (index: number) => {
    setSongs(songs.map((s, i) => i === index ? { ...s, selected: !s.selected } : s));
  };

  const deselectDupes = () => {
    setSongs(songs.map(s => duplicateUrls.has(s.url) ? { ...s, selected: false } : s));
  };

  const selectedCount = songs.filter(s => s.selected).length;

  const handleScan = async () => {
    if (!url.trim()) return;
    setStatus('scanning');
    setScanError('');
    setSongs([]);

    try {
      let urlFinal = url.trim();
      if (!urlFinal.startsWith('http')) urlFinal = 'https://' + urlFinal;

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/scan-artist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ url: urlFinal }),
      });

      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      if (!data?.songs?.length) throw new Error('Nenhuma música encontrada.');

      const songList = data.songs.map((s: any) => ({ ...s, selected: true }));
      setSongs(songList);

      const dupes = await checkDuplicatesBatch(songList);
      setDuplicateUrls(dupes);
      setStatus('idle');
    } catch (e: any) {
      setScanError(e.message || 'Erro ao escanear');
      setStatus('idle');
    }
  };

  const handleImport = useCallback(async () => {
    const selected = songs.filter(s => s.selected);
    if (!selected.length) return;

    setStatus('importing');
    setResults([]);
    setCurrent(0);
    abortRef.current = false;

    const importResults: ImportResult[] = [];

    for (let i = 0; i < selected.length; i++) {
      if (abortRef.current) break;
      setCurrent(i + 1);
      const song = selected[i];

      try {
        const { data, error } = await supabase.functions.invoke('import-song', {
          body: { url: song.url },
        });

        if (error || !data) throw new Error(error?.message || 'Erro ao importar');

        const { error: dbError } = await supabase.from('musicas').insert({
          titulo: data.titulo,
          artista: data.artista,
          genero: genero || data.genero || 'Gospel',
          tom_original: data.tom_original,
          bpm: data.bpm,
          capo_fret: data.capo_fret ?? 0,
          vibe: data.vibe,
          letra_cifrada: data.letra_cifrada,
          compositor: data.compositor,
          source_url: song.url,
        });

        if (dbError) throw new Error(dbError.message);

        importResults.push({ titulo: data.titulo, success: true });
      } catch (e: any) {
        importResults.push({ titulo: song.titulo, success: false, error: e.message });
      }

      setResults([...importResults]);
    }

    queryClient.invalidateQueries({ queryKey: ['musicas'] });
    setStatus('done');
    setShowReport(true);
  }, [songs, genero, queryClient]);

  const handleAbort = () => {
    abortRef.current = true;
  };

  return (
    <ImportContext.Provider value={{
      open, setOpen, url, setUrl, genero, setGenero,
      songs, setSongs, duplicateUrls, status, current, results,
      scanError, showReport, setShowReport, showDupesOnly, setShowDupesOnly,
      isRunning, handleScan, handleImport, handleAbort,
      toggleAll, toggleSong, deselectDupes, reset, selectedCount,
    }}>
      {children}
    </ImportContext.Provider>
  );
}

export function useImport() {
  const ctx = useContext(ImportContext);
  if (!ctx) throw new Error('useImport must be used within ImportProvider');
  return ctx;
}
