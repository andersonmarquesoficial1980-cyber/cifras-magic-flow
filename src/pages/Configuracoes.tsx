import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, LogOut, KeyRound, User, Loader2, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Configuracoes() {
  const { profile, role, isAdmin, isPremium, signOut } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);
  const { toast } = useToast();

  const ROLE_LABEL: Record<string, string> = {
    admin: 'Admin',
    premium: 'Premium',
    free: 'Gratuito',
  };

  const ROLE_COLOR: Record<string, string> = {
    admin: 'text-[#FACC15] border-[#FACC15]/30 bg-[#FACC15]/10',
    premium: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    free: 'text-gray-400 border-gray-400/30 bg-gray-400/10',
  };

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Senha muito curta (mín. 6 caracteres)', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      toast({ title: 'Erro ao trocar senha', description: error.message, variant: 'destructive' });
    } else {
      setChanged(true);
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Senha alterada com sucesso! 🔐' });
      setTimeout(() => setChanged(false), 3000);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#050505]/95 backdrop-blur px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm">Voltar</span>
        </button>
        <span className="text-gray-700">|</span>
        <h1 className="text-base font-bold">Configurações</h1>
      </div>

      <div className="max-w-md mx-auto px-5 py-8 space-y-6">

        {/* Perfil */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <User size={18} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">{profile?.email ?? '—'}</p>
              <span className={`text-[11px] border rounded-full px-2 py-0.5 mt-0.5 inline-flex items-center gap-1 ${ROLE_COLOR[role]}`}>
                {isPremium && <Crown size={10} />}
                {ROLE_LABEL[role]}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Trocar senha */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={16} className="text-[#FACC15]" />
            <h2 className="text-sm font-semibold">Trocar senha</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <Label className="text-gray-400 text-xs">Nova senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                className="bg-[#111] border-[#222] text-white placeholder:text-gray-600 mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Confirmar senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                className="bg-[#111] border-[#222] text-white placeholder:text-gray-600 mt-1"
              />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold mt-1">
              {loading ? <Loader2 size={16} className="animate-spin" /> :
               changed ? <><Check size={16} /> Alterada!</> : 'Salvar nova senha'}
            </Button>
          </form>
        </motion.div>

        {/* Sair */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button onClick={signOut} variant="ghost"
            className="w-full border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2">
            <LogOut size={15} />
            Sair da conta
          </Button>
        </motion.div>

      </div>
    </div>
  );
}
