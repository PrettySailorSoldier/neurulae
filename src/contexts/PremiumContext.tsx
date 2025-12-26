import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type PlanType = 'free' | 'premium' | 'lifetime' | 'admin';

interface PremiumContextType {
  plan: PlanType;
  isPremium: boolean;
  isAdmin: boolean;
  loading: boolean;
  checkSubscription: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanType>('free');
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  const checkSubscription = async () => {
    if (!user || !session?.access_token) {
      setPlan('free');
      setLoading(false);
      return;
    }

    try {
      // Verify session is still valid before making requests
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession?.access_token) {
        console.log('No valid session available');
        setPlan('free');
        setLoading(false);
        return;
      }

      // Check for roles first (admin, creator, premium, lifetime)
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (roles?.some((r: any) => r.role === 'admin')) {
        setPlan('admin');
        setLoading(false);
        return;
      }

      // Treat both 'creator' and 'premium' roles as premium access
      if (roles?.some((r: any) => r.role === 'creator' || r.role === 'premium')) {
        setPlan('premium');
        setLoading(false);
        return;
      }

      // Lifetime role (if used) maps to lifetime plan
      if (roles?.some((r: any) => r.role === 'lifetime')) {
        setPlan('lifetime');
        setLoading(false);
        return;
      }
      
      // Check subscription status via edge function - use fresh session token
      let { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`
        }
      });

      // If auth error, refresh session and retry once
      if (error && (error.message?.includes('Auth') || error.message?.includes('401') || error.message?.includes('Invalid JWT'))) {
        console.log('Auth error detected, refreshing session...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshData.session?.access_token) {
          const retry = await supabase.functions.invoke('check-subscription', {
            headers: {
              Authorization: `Bearer ${refreshData.session.access_token}`
            }
          });
          data = retry.data;
          error = retry.error;
        } else {
          // Session refresh failed, user needs to re-login
          console.log('Session refresh failed');
          setPlan('free');
          setLoading(false);
          return;
        }
      }

      if (error) throw error;
      
      if (data?.plan) {
        setPlan(data.plan);
      } else if (data?.subscribed === true) {
        // If subscribed flag is returned without a plan, treat as premium
        setPlan('premium');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setPlan('free');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Refresh subscription status periodically
    const interval = setInterval(checkSubscription, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [user, session]);

  const isPremium = plan === 'premium' || plan === 'lifetime' || plan === 'admin';
  const isAdmin = plan === 'admin';

  return (
    <PremiumContext.Provider value={{ plan, isPremium, isAdmin, loading, checkSubscription }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
