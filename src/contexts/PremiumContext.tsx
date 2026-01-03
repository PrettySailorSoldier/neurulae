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
    // Don't check if no user or no session
    if (!user || !session?.access_token) {
      setPlan('free');
      setLoading(false);
      return;
    }

    try {
      // Get fresh session directly from Supabase
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !currentSession?.access_token) {
        console.log('No valid session available, trying refresh...');
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session?.access_token) {
          console.log('Session refresh failed, setting free plan');
          setPlan('free');
          setLoading(false);
          return;
        }
      }

      // Check for roles first (admin, creator, premium, lifetime)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.log('Error fetching roles:', rolesError.message);
      }

      if (roles?.some((r: any) => r.role === 'admin')) {
        setPlan('admin');
        setLoading(false);
        return;
      }

      if (roles?.some((r: any) => r.role === 'creator' || r.role === 'premium')) {
        setPlan('premium');
        setLoading(false);
        return;
      }

      if (roles?.some((r: any) => r.role === 'lifetime')) {
        setPlan('lifetime');
        setLoading(false);
        return;
      }
      
      // Check subscription status via edge function
      // Let the SDK handle auth automatically - don't pass custom headers
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        // If 401 error, try refreshing session and retry
        if (error.message?.includes('401') || error.message?.includes('Invalid JWT')) {
          console.log('JWT error, refreshing session and retrying...');
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (!refreshError) {
            // Wait a moment for session to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
            const retry = await supabase.functions.invoke('check-subscription');
            
            if (!retry.error && retry.data) {
              if (retry.data.plan) {
                setPlan(retry.data.plan);
              } else if (retry.data.subscribed === true) {
                setPlan('premium');
              }
              setLoading(false);
              return;
            }
          }
        }
        throw error;
      }
      
      if (data?.plan) {
        setPlan(data.plan);
      } else if (data?.subscribed === true) {
        setPlan('premium');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Don't change plan on error - keep current state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only check subscription when we have a user
    if (user) {
      // Small delay to ensure session is fully established
      const timeoutId = setTimeout(() => {
        checkSubscription();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else {
      setPlan('free');
      setLoading(false);
    }
  }, [user]);

  // Set up periodic refresh only when user is logged in
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user]);

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
