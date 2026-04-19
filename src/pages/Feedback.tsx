import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music2, Lightbulb, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type Tipo = 'pedido' | 'sugestao' | 'reclamacao';

const TIPOS = [
  { value: 'pedido', label: 'Pedir Música', icon: Music2, color: 'text-[#FACC15] border-[#FACC15]/40 bg-[#FACC15]/10' },
  { value: 'sugestao', label: 'Sugestão', icon: Lightbulb, color: 'text-blue-400 border-blue-400/40 bg-blue-400/10' },
  { value: 'reclamacao', label: 'Reclamação', icon: AlertTriangle, color: 'text-red-400 border-red-400/40 bg-red-400/10' },
] as const;

export default function Feedback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tipo, setTipo] = useState<Tipo>('pedido');
  const [mensagem, setMensagem] = useState('');
  const [email, setEmail] = useState('');
  const [musicaSugerida, setMusicaSugerida] = useState('');
  const [artistaSugerido, setArtistaSugerido] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mensagem.trim()) return;
    setLoading(true);

    const { error } = await supabase.from('feedbacks').insert({
      tipo,
      mensagem: mensagem.trim(),
      email: email.trim() || null,
      musica_sugerida: musicaSugerida.trim() || null,
      artista_sugerido: artistaSugerido.trim() || null,
    });

    setLoading(false);
    if (error) {
      toast({ title: 'Erro ao enviar', description: error.message, variant: 'destructive' });
    } else {
      setEnviado(true);
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 className="h-16 w-16 text-[#FACC15] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Recebido! 🙌</h2>
        <p className="text-gray-400 text-sm mb-6">Obrigado pelo seu feedback. Vamos analisar em breve.</p>
        <Button onClick={() => navigate(-1)} className="bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-4 py-4">
        <div className="container mx-auto max-w-2xl flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Voltar</span>
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <h1 className="text-base font-bold">Fale Conosco</h1>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">

        {/* Tipo */}
        <div>
          <Label className="text-gray-400 text-xs mb-3 block">O que você quer fazer?</Label>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(({ value, label, icon: Icon, color }) => (
              <button key={value} onClick={() => setTipo(value as Tipo)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${
                  tipo === value ? color : 'border-white/[0.06] bg-white/[0.03] text-gray-500'
                }`}>
                <Icon size={20} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campos específicos para pedido de música */}
          {tipo === 'pedido' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-400 text-xs">Música</Label>
                <Input value={musicaSugerida} onChange={e => setMusicaSugerida(e.target.value)}
                  placeholder="Nome da música"
                  className="bg-[#111] border-[#222] text-white mt-1" />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Artista</Label>
                <Input value={artistaSugerido} onChange={e => setArtistaSugerido(e.target.value)}
                  placeholder="Nome do artista"
                  className="bg-[#111] border-[#222] text-white mt-1" />
              </div>
            </div>
          )}

          {/* Mensagem */}
          <div>
            <Label className="text-gray-400 text-xs">
              {tipo === 'pedido' ? 'Observação (opcional)' : 'Mensagem'}
            </Label>
            <textarea
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
              required={tipo !== 'pedido'}
              rows={4}
              placeholder={
                tipo === 'pedido' ? 'Alguma observação sobre a música?' :
                tipo === 'sugestao' ? 'Sua sugestão para melhorar o app...' :
                'Descreva o problema encontrado...'
              }
              className="w-full mt-1 rounded-md bg-[#111] border border-[#222] text-white text-sm p-3 resize-none focus:outline-none focus:border-[#FACC15]/50"
            />
          </div>

          {/* Email */}
          <div>
            <Label className="text-gray-400 text-xs">Email (opcional — para resposta)</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)}
              type="email" placeholder="seu@email.com"
              className="bg-[#111] border-[#222] text-white mt-1" />
          </div>

          <Button type="submit" disabled={loading || (!mensagem.trim() && tipo !== 'pedido')}
            className="w-full bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold gap-2">
            <Send size={14} />
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
