import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh session when "Remember Me" is enabled
  useEffect(() => {
    const shouldPersist = localStorage.getItem('neurulae-persist-session') === 'true';
    
    if (!shouldPersist || !session) return;

    // Don't refresh immediately after login - only refresh sessions older than 5 minutes
    const checkAndRefreshSession = async () => {
      try {
        // Check if session is close to expiring (less than 30 minutes left)
        const expiresAt = session.expires_at;
        if (!expiresAt) return;
        
        const expiresAtMs = expiresAt * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiresAtMs - now;
        const thirtyMinutes = 30 * 60 * 1000;
        
        // Only refresh if session expires in less than 30 minutes
        if (timeUntilExpiry > thirtyMinutes) {
          console.log('Session still fresh, no refresh needed');
          return;
        }

        console.log('Session expiring soon, refreshing...');
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.log('Session refresh failed:', error.message);
        } else if (data.session) {
          console.log('Session refreshed successfully');
        }
      } catch (e) {
        console.log('Session refresh error:', e);
      }
    };

    // Wait 30 seconds before first check to avoid interfering with fresh login
    const initialDelay = setTimeout(checkAndRefreshSession, 30 * 1000);

    // Set up interval to check every 10 minutes
    const refreshInterval = setInterval(checkAndRefreshSession, 10 * 60 * 1000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(refreshInterval);
    };
  }, [session]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
