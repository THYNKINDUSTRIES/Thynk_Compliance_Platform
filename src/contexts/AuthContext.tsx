import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { hasBetaAccess, isAdminDomain } from '@/lib/betaAccess';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  email_verified: boolean;
  saved_searches: any[];
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  subscription_status: 'trial' | 'active' | 'expired' | 'cancelled';
  trial_started_at: string;
  trial_ends_at: string;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  hasBetaAccess: boolean;
  onboardingCompleted: boolean;
  isTrialActive: boolean;
  isPaidUser: boolean;
  trialDaysRemaining: number;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage key for onboarding fallback
const ONBOARDING_STORAGE_KEY = 'thynk_onboarding_completed';

// Check if onboarding was completed (fallback to localStorage)
const getOnboardingStatus = (userId: string): boolean => {
  if (!userId) return true; // No user = no onboarding needed
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return data[userId] === true;
    }
  } catch (e) {
    console.error('Error reading onboarding status from localStorage:', e);
  }
  return false;
};

// Save onboarding completion to localStorage (fallback)
const saveOnboardingToStorage = (userId: string): void => {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data[userId] = true;
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving onboarding status to localStorage:', e);
  }
};

// Clear onboarding from localStorage (for replay)
const clearOnboardingFromStorage = (userId: string): void => {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      delete data[userId];
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Error clearing onboarding status from localStorage:', e);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true); // Default to true to prevent flash

  // Refs to prevent duplicate work
  const currentUserIdRef = useRef<string | null>(null);
  const selfHealAttemptedRef = useRef<string | null>(null);
  const suppressAuthChangeRef = useRef(false);
  const initialSessionHandledRef = useRef(false);

  // Check beta access based on user email
  const userHasBetaAccess = hasBetaAccess(user?.email);

  // Subscription helpers
  const isTrialActive = profile ? (
    profile.role === 'admin' ||
    (profile.subscription_status === 'trial' &&
    new Date(profile.trial_ends_at) > new Date())
  ) : false;

  const isPaidUser = profile ? (
    profile.role === 'admin' ||
    (profile.subscription_status === 'active' &&
    (!profile.subscription_ends_at || new Date(profile.subscription_ends_at) > new Date()))
  ) : false;

  const trialDaysRemaining = profile ? (
    profile.subscription_status === 'trial' ?
      Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) :
      0
  ) : 0;

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Use a simpler query to avoid RLS recursion issues
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to avoid errors on empty results

      if (error) {
        // Check if it's an RLS recursion error
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          console.warn('RLS recursion detected, using fallback profile');
          // Create a fallback profile from auth user data
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            setProfile({
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || null,
              role: 'user',
              email_verified: authUser.email_confirmed_at !== null,
              saved_searches: [],
              onboarding_completed: getOnboardingStatus(userId),
              onboarding_completed_at: null,
              subscription_status: 'trial',
              trial_started_at: authUser.created_at || new Date().toISOString(),
              trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
              subscription_started_at: null,
              subscription_ends_at: null,
              stripe_customer_id: null,
              stripe_subscription_id: null,
              created_at: authUser.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as UserProfile);
          }
          setOnboardingCompleted(getOnboardingStatus(userId));
          return;
        }
        
        // For other errors that aren't "no rows", log them
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }
        setOnboardingCompleted(getOnboardingStatus(userId));
        return;
      }
      
      if (data) {
        // Ensure all fields have defaults (some columns may not exist in DB yet)
        const profileWithDefaults: UserProfile = {
          ...data,
          email_verified: data.email_verified ?? true,
          saved_searches: data.saved_searches ?? [],
          onboarding_completed: data.onboarding_completed ?? false,
          onboarding_completed_at: data.onboarding_completed_at ?? null,
          subscription_status: data.subscription_status ?? 'trial',
          trial_started_at: data.trial_started_at ?? data.created_at,
          trial_ends_at: data.trial_ends_at ?? data.trial_end_date ?? new Date(new Date(data.created_at).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_started_at: data.subscription_started_at ?? null,
          subscription_ends_at: data.subscription_ends_at ?? null,
          stripe_customer_id: data.stripe_customer_id ?? null,
          stripe_subscription_id: data.stripe_subscription_id ?? null
        };

        // Auto-upgrade comp accounts: if user is not yet active and their email is in comp_accounts, upgrade them
        if (profileWithDefaults.subscription_status !== 'active' && profileWithDefaults.role !== 'admin' && profileWithDefaults.email) {
          try {
            const { data: compData } = await supabase
              .from('comp_accounts')
              .select('expires_at, is_active')
              .eq('email', profileWithDefaults.email.toLowerCase())
              .eq('is_active', true)
              .maybeSingle();
            if (compData && (!compData.expires_at || new Date(compData.expires_at) > new Date())) {
              const now = new Date();
              const neverExpires = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000);
              const accessExpiry = compData.expires_at || neverExpires.toISOString();
              // Upgrade the profile in DB
              await supabase.from('user_profiles').update({
                subscription_status: 'active',
                subscription_started_at: now.toISOString(),
                subscription_ends_at: accessExpiry,
              }).eq('id', userId);
              // Update local profile
              profileWithDefaults.subscription_status = 'active';
              profileWithDefaults.subscription_started_at = now.toISOString();
              profileWithDefaults.subscription_ends_at = typeof accessExpiry === 'string' ? accessExpiry : accessExpiry;
            }
          } catch (compErr) {
            // Don't fail profile fetch if comp check fails (table might not exist yet)
            console.warn('Comp account check failed:', compErr);
          }
        }

        setProfile(profileWithDefaults);
        
        // Check onboarding status from profile or localStorage
        const localOnboarding = getOnboardingStatus(userId);
        setOnboardingCompleted(profileWithDefaults.onboarding_completed || localOnboarding);
      } else if (selfHealAttemptedRef.current !== userId) {
        // No profile found - self-heal by creating one (once per user)
        selfHealAttemptedRef.current = userId;
        console.warn('No profile found for user', userId, '- attempting to create one');
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const now = new Date();
          const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
          const autoAdmin = isAdminDomain(authUser.email);
          
          const newProfile: Record<string, any> = {
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || null,
            role: autoAdmin ? 'admin' : 'user',
            subscription_status: autoAdmin ? 'active' : 'trial',
            trial_started_at: authUser.created_at || now.toISOString(),
            trial_ends_at: autoAdmin 
              ? new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString() 
              : trialEnd.toISOString(),
          };

          // Try to insert the profile into the DB (ignoreDuplicates avoids
          // overwriting a row the handle_new_user trigger may have created)
          const { error: insertError } = await supabase
            .from('user_profiles')
            .upsert(newProfile, { onConflict: 'id', ignoreDuplicates: true });
          
          if (insertError) {
            console.error('Failed to self-heal profile:', insertError);
          }

          // Set the local profile state regardless so the UI works
          setProfile({
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || null,
            role: autoAdmin ? 'admin' : 'user',
            email_verified: authUser.email_confirmed_at !== null,
            saved_searches: [],
            onboarding_completed: false,
            onboarding_completed_at: null,
            subscription_status: autoAdmin ? 'active' : 'trial',
            trial_started_at: authUser.created_at || now.toISOString(),
            trial_ends_at: autoAdmin 
              ? new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString() 
              : trialEnd.toISOString(),
            subscription_started_at: autoAdmin ? now.toISOString() : null,
            subscription_ends_at: null,
            stripe_customer_id: null,
            stripe_subscription_id: null,
            created_at: authUser.created_at || now.toISOString(),
            updated_at: now.toISOString()
          } as UserProfile);
        }
        setOnboardingCompleted(getOnboardingStatus(userId));
      } else {
        // Self-heal already attempted for this user — don't retry
        setOnboardingCompleted(getOnboardingStatus(userId));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback to localStorage
      setOnboardingCompleted(getOnboardingStatus(userId));
    }
  }, []);



  useEffect(() => {
    let isMounted = true;

    // Get initial session with timeout protection
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Session fetch timed out')), 10000)
    );
    
    Promise.race([sessionPromise, timeoutPromise]).then(async ({ data: { session } }: any) => {
      if (!isMounted) return;
      initialSessionHandledRef.current = true;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          await fetchProfile(session.user.id);
          currentUserIdRef.current = session.user.id;
        } catch (err) {
          if ((err as any)?.name !== 'AbortError') {
            console.error('Failed to fetch profile on init:', err);
          }
        }
      } else {
        setOnboardingCompleted(true); // No user = no onboarding
      }
      if (isMounted) setLoading(false);
    }).catch((err: any) => {
      // AbortError is expected when component unmounts/remounts (React StrictMode)
      if (err?.name === 'AbortError') return;
      console.error('Failed to get session:', err);
      if (isMounted) setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      // Skip if signUp is handling session setup itself
      if (suppressAuthChangeRef.current) return;

      // Skip INITIAL_SESSION if getSession() already handled it — prevents
      // the double-fetch race condition that causes AbortErrors everywhere
      if (_event === 'INITIAL_SESSION' && initialSessionHandledRef.current) return;

      const newUserId = session?.user?.id ?? null;

      // Skip if we already loaded this user's profile
      if (newUserId && newUserId === currentUserIdRef.current && profile) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Reset self-heal ref when user changes
        if (newUserId !== currentUserIdRef.current) {
          selfHealAttemptedRef.current = null;
        }
        setLoading(true);
        try {
          await fetchProfile(session.user.id);
          currentUserIdRef.current = session.user.id;
        } catch (err) {
          if ((err as any)?.name !== 'AbortError') {
            console.error('Failed to fetch profile on auth change:', err);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        currentUserIdRef.current = null;
        setProfile(null);
        setOnboardingCompleted(true); // No user = no onboarding
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const clientOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const emailRedirectTo = import.meta.env.VITE_EMAIL_VERIFICATION_REDIRECT_URL ||
      (clientOrigin ? `${clientOrigin}/verify-email` : undefined);

    const buildOptions = (withRedirect: boolean) => {
      const baseOptions = { data: { full_name: fullName } };
      if (withRedirect && emailRedirectTo) {
        return { ...baseOptions, emailRedirectTo };
      }
      return baseOptions;
    };

    const attemptSignUp = async (withRedirect: boolean) => supabase.auth.signUp({
      email,
      password,
      options: buildOptions(withRedirect)
    });

    const looksLikeRedirectError = (err: any) => {
      const message = (err?.message ?? '').toLowerCase();
      return message.includes('redirect') || message.includes('emailredirectto');
    };

    const initialAttempt = await attemptSignUp(Boolean(emailRedirectTo));
    let { data, error } = initialAttempt;

    if (error && emailRedirectTo && looksLikeRedirectError(error)) {
      console.warn('Supabase rejected emailRedirectTo, retrying without it');
      const fallbackAttempt = await attemptSignUp(false);
      data = fallbackAttempt.data;
      error = fallbackAttempt.error;
    }

    if (error) {
      return { data: null, error };
    }
    
    // If user was created, create their profile
    if (data.user) {
      try {
        // CRITICAL: Ensure the session from signUp is active before making DB calls.
        // Suppress onAuthStateChange while we set session + create profile to
        // prevent a race where the listener tries to fetchProfile before we're done.
        suppressAuthChangeRef.current = true;
        if (data.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }

        // Check if this email gets automatic admin privileges
        const autoAdmin = isAdminDomain(data.user.email);
        
        // Check if this email is in the comp_accounts table (free paid access)
        let isCompAccount = false;
        let compExpiresAt: string | null = null;
        if (!autoAdmin && data.user.email) {
          const { data: compData } = await supabase
            .from('comp_accounts')
            .select('expires_at, is_active')
            .eq('email', data.user.email.toLowerCase())
            .eq('is_active', true)
            .maybeSingle();
          if (compData) {
            // Check if comp hasn't expired
            if (!compData.expires_at || new Date(compData.expires_at) > new Date()) {
              isCompAccount = true;
              compExpiresAt = compData.expires_at;
            }
          }
        }

        const grantFullAccess = autoAdmin || isCompAccount;
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
        const neverExpires = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
        const accessExpiry = compExpiresAt ? compExpiresAt : neverExpires.toISOString();
        
        const profileData: Record<string, any> = {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          role: autoAdmin ? 'admin' : 'user',
          subscription_status: grantFullAccess ? 'active' : 'trial',
          trial_started_at: now.toISOString(),
          trial_ends_at: grantFullAccess ? accessExpiry : trialEnd.toISOString(),
          trial_end_date: grantFullAccess ? accessExpiry : trialEnd.toISOString(),
          subscription_started_at: grantFullAccess ? now.toISOString() : null,
          subscription_ends_at: grantFullAccess ? accessExpiry : null,
        };

        const { error: profileError } = await supabase.from('user_profiles').upsert(
          profileData, 
          { onConflict: 'id' }
        );
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
          
          // Retry once without optional columns in case of schema mismatch
          const { error: retryError } = await supabase.from('user_profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            role: autoAdmin ? 'admin' : 'user',
            subscription_status: grantFullAccess ? 'active' : 'trial',
            trial_started_at: now.toISOString(),
            trial_ends_at: grantFullAccess ? accessExpiry : trialEnd.toISOString(),
          }, { onConflict: 'id' });
          
          if (retryError) {
            console.error('Profile creation retry also failed:', retryError);
          }
        }
        
        // Mark onboarding as not completed for new user
        setOnboardingCompleted(false);
        
        // Create notification preferences (optional, don't fail if it errors)
        try {
          await supabase.from('notification_preferences').upsert({
            user_id: data.user.id,
            digest_enabled: false
          }, { onConflict: 'user_id' });
        } catch (notifErr) {
          console.warn('Notification prefs creation skipped:', notifErr);
        }

        // Set local state so the user is immediately active
        currentUserIdRef.current = data.user.id;
        setUser(data.user);
        if (data.session) setSession(data.session);
        await fetchProfile(data.user.id);
        
      } catch (err) {
        console.error('Post-signup setup error:', err);
        // Don't fail - user account is created successfully
      } finally {
        // Re-enable auth change listener
        suppressAuthChangeRef.current = false;
      }
    }
    
    return { data, error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setOnboardingCompleted(true);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password?type=recovery`
      });
      
      if (error) {
        console.error('Reset password error:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err: any) {
      console.error('Reset password error:', err);
      return { success: false, error: err.message || 'Failed to send reset email' };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        console.error('Update password error:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err: any) {
      console.error('Update password error:', err);
      return { success: false, error: err.message || 'Failed to update password' };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) {
        // Check for RLS recursion error
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          console.warn('RLS recursion detected during profile update');
          // Update local profile state even if DB update fails
          setProfile(prev => prev ? { ...prev, ...updates } : null);
          return;
        }
        throw error;
      }
      
      await fetchProfile(user.id);
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };


  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    // Always save to localStorage as fallback
    saveOnboardingToStorage(user.id);
    setOnboardingCompleted(true);
    
    // Try to update database
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        // If the column doesn't exist, that's okay - we have localStorage fallback
        console.log('Could not update onboarding in database (may not have column):', error.message);
      } else {
        // Refresh profile to get updated data
        await fetchProfile(user.id);
      }
    } catch (err) {
      console.error('Error completing onboarding:', err);
      // localStorage fallback is already set, so user won't see onboarding again
    }
  };

  const resetOnboarding = () => {
    if (!user) return;
    clearOnboardingFromStorage(user.id);
    setOnboardingCompleted(false);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      isAdmin: profile?.role === 'admin',
      hasBetaAccess: userHasBetaAccess,
      onboardingCompleted,
      isTrialActive,
      isPaidUser,
      trialDaysRemaining,
      signUp, signIn, signOut, resetPassword, updatePassword, updateProfile, refreshProfile, completeOnboarding, resetOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
