import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Music2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: 'Bem-vindo de volta! 🎸' });
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: 'Conta criada!', description: 'Verifique seu e-mail para confirmar.' });
        onClose();
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border border-[#222] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Music2 className="text-[#FACC15]" size={20} />
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className="text-gray-400 text-sm">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600 mt-1"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-sm">Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-600 mt-1"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        <div className="text-center mt-2">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
