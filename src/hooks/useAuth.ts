import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type UserRole = 'free' | 'premium' | 'admin';
export type UserPlan = 'musico' | 'artista' | 'maestro';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  plan: UserPlan;
  isAdmin: boolean;
  isPremium: boolean;
  isLoggedIn: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: 'free',
  plan: 'musico',
  isAdmin: false,
  isPremium: false,
  isLoggedIn: false,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string, userEmail: string | undefined) {
    // PROTEÇÃO TOTAL: Se for o email do Andinho, vira Admin e Maestro na marra, mesmo que o banco diga o contrário.
    const isAndinho = userEmail?.toLowerCase() === 'andersonmarquesoficial1980@gmail.com';
    
    const { data } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (data || isAndinho) {
      const role = isAndinho ? 'admin' : (data?.role || 'free');
      const plan = isAndinho ? 'maestro' : 'musico';
      
      setProfile({
        id: userId,
        email: userEmail || data?.email || '',
        role: role as UserRole,
        plan: plan as UserPlan,
      });
    } else {
      setProfile(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Se já temos um profile, garantimos que se for admin, o plan vai ser maestro pro frontend funcionar
  const isAndinho = user?.email?.toLowerCase() === 'andersonmarquesoficial1980@gmail.com';
  const role: UserRole = isAndinho ? 'admin' : (profile?.role ?? 'free');
  const plan: UserPlan = isAndinho ? 'maestro' : (profile?.plan ?? 'musico');
  const isAdmin = role === 'admin';
  const isPremium = isAdmin || role === 'premium' || plan === 'artista' || plan === 'maestro';

  // Só termina de carregar depois que batermos o martelo no profile ou se não houver usuário
  useEffect(() => {
    if (!user || profile) setLoading(false);
  }, [user, profile]);

  return {
    user,
    profile,
    role,
    plan,
    isAdmin,
    isPremium,
    isLoggedIn: !!user,
    loading,
    signOut: () => supabase.auth.signOut(),
  };
}
