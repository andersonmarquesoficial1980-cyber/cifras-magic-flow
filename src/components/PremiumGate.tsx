import { useState } from 'react';
import { Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
}

export function PremiumGate({ children, feature = 'este recurso' }: PremiumGateProps) {
  const { isPremium, isLoggedIn } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (isPremium) return <>{children}</>;

  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        {/* Conteúdo desfocado atrás */}
        <div className="pointer-events-none select-none blur-sm opacity-40">
          {children}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl gap-3 p-4">
          <div className="flex items-center gap-2 text-[#FACC15]">
            <Crown size={24} />
            <span className="font-bold text-lg">Premium</span>
          </div>
          <p className="text-gray-300 text-sm text-center">
            {isLoggedIn
              ? `Faça upgrade para acessar ${feature}`
              : `Faça login para acessar ${feature}`}
          </p>
          {isLoggedIn ? (
            <Button
              className="bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold gap-2"
              onClick={() => window.location.href = '/premium'}
            >
              <Crown size={14} />
              Assinar Premium
            </Button>
          ) : (
            <Button
              className="bg-[#FACC15] hover:bg-[#E6B800] text-black font-bold gap-2"
              onClick={() => setShowAuth(true)}
            >
              <Lock size={14} />
              Fazer Login
            </Button>
          )}
        </div>
      </div>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
