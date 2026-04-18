import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import type { Musica } from '@/hooks/useMusicas';

const VIBES_AVAILABLE = ['Animada', 'Romântica', 'Adoração', 'Pra Pular', 'Modão', 'Introspectiva'];
const VIBE_COLORS: Record<string, string> = {
  'Animada': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
  'Romântica': 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
  'Adoração': 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
  'Pra Pular': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
  'Modão': 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
  'Introspectiva': 'bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30',
};

const ALL_KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B',
  'Cm','C#m','Dm','D#m','Em','Fm','F#m','Gm','G#m','Am','A#m','Bm'];

const GENEROS = ['Gospel', 'Sertanejo', 'Pagode', 'Rock', 'Pop', 'MPB', 'Forró', 'Axé', 'Outro'];

interface Props {
  musica: Musica;
  open: boolean;
  onClose: () => void;
}

export function EditarMusicaModal({ musica, open, onClose }: Props) {
  const [titulo, setTitulo] = useState(musica.titulo);
  const [artista, setArtista] = useState(musica.artista || '');
  const [tom, setTom] = useState(musica.tom_original || '');
  const [bpm, setBpm] = useState(musica.bpm?.toString() || '');
  const [genero, setGenero] = useState((musica as any).genero || '');
  const [vibes, setVibes] = useState<string[]>(
    musica.vibe ? musica.vibe.split(',').map(v => v.trim()).filter(Boolean) : []
  );
  const [letra, setLetra] = useState(musica.letra_cifrada || '');
  const [saving, setSaving] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setTitulo(musica.titulo);
    setArtista(musica.artista || '');
    setTom(musica.tom_original || '');
    setBpm(musica.bpm?.toString() || '');
    setGenero((musica as any).genero || '');
    setVibes(musica.vibe ? musica.vibe.split(',').map(v => v.trim()).filter(Boolean) : []);
    setLetra(musica.letra_cifrada || '');
  }, [musica]);

  function toggleVibe(v: string) {
    setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from('musicas').update({
      titulo: titulo.trim(),
      artista: artista.trim(),
      tom_original: tom,
      bpm: bpm ? parseInt(bpm) : null,
      genero: genero,
      vibe: vibes.join(', '),
      letra_cifrada: letra,
    }).eq('id', musica.id);
    setSaving(false);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Música salva! ✅' });
      queryClient.invalidateQueries({ queryKey: ['musicas'] });
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border border-[#222] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Música</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Título e Artista */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-gray-400 text-xs">Título</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)}
                className="bg-[#1a1a1a] border-[#333] text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Artista</Label>
              <Input value={artista} onChange={e => setArtista(e.target.value)}
                className="bg-[#1a1a1a] border-[#333] text-white mt-1" />
            </div>
          </div>

          {/* Tom, BPM, Gênero */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-gray-400 text-xs">Tom</Label>
              <select value={tom} onChange={e => setTom(e.target.value)}
                className="w-full mt-1 rounded-md bg-[#1a1a1a] border border-[#333] text-white text-sm px-3 py-2">
                <option value="">—</option>
                {ALL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs">BPM</Label>
              <Input type="number" value={bpm} onChange={e => setBpm(e.target.value)}
                placeholder="120" className="bg-[#1a1a1a] border-[#333] text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Gênero</Label>
              <select value={genero} onChange={e => setGenero(e.target.value)}
                className="w-full mt-1 rounded-md bg-[#1a1a1a] border border-[#333] text-white text-sm px-3 py-2">
                <option value="">—</option>
                {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Vibes */}
          <div>
            <Label className="text-gray-400 text-xs">Vibe</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {VIBES_AVAILABLE.map(v => (
                <button key={v} onClick={() => toggleVibe(v)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    vibes.includes(v)
                      ? VIBE_COLORS[v]
                      : 'bg-transparent text-gray-500 border-[#333] hover:border-gray-500'
                  }`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Letra/Cifra */}
          <div>
            <Label className="text-gray-400 text-xs">Cifra / Letra</Label>
            <textarea
              value={letra}
              onChange={e => setLetra(e.target.value)}
              rows={16}
              className="w-full mt-1 rounded-md bg-[#0a0a0a] border border-[#333] text-white text-xs font-mono p-3 resize-y focus:outline-none focus:border-[#FACC15]/50"
              placeholder="Cole ou edite a cifra aqui..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}
              className="bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
