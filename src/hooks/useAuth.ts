import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

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

export function useAuthState(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, role, plan')
      .eq('id', userId)
      .single();
    if (data) {
      const normalized = {
        ...data,
        plan: (data.plan ?? (data.role === 'premium' ? 'artista' : data.role === 'admin' ? 'maestro' : 'musico')) as UserPlan,
      };
      setProfile(normalized as UserProfile);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const role: UserRole = profile?.role ?? 'free';
  const plan: UserPlan = profile?.plan ?? 'musico';
  const isAdmin = role === 'admin';
  const isPremium = isAdmin || role === 'premium' || plan === 'artista' || plan === 'maestro';

  return {
    user,
    profile,
    role,
    plan: isAdmin ? 'maestro' : plan, // Admin é forçado a ter plano Maestro visualmente
    isAdmin,
    isPremium,
    isLoggedIn: !!user,
    loading,
    signOut: () => supabase.auth.signOut(),
  };
}
