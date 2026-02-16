import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminDomain } from '@/lib/betaAccess';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CreditCard, Lock, Loader2 } from 'lucide-react';

interface SubscriptionRouteProps {
  children: React.ReactNode;
  requirePaid?: boolean; // If true, requires paid subscription, trial not enough
}

export const SubscriptionRoute = ({
  children,
  requirePaid = false
}: SubscriptionRouteProps) => {
  const { user, profile, loading, isAdmin, isTrialActive, isPaidUser, trialDaysRemaining, refreshProfile } = useAuth();
  const [activating, setActivating] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const navigate = useNavigate();

  // Failsafe: if loading takes >8 seconds, stop spinning and redirect
  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Whether the user has already used their trial (prevent infinite restarts)
  const trialAlreadyUsed = profile?.trial_started_at != null;

  // Activate a 3-day trial (only if never had one before)
  const handleActivateTrial = async () => {
    if (!user || !profile || trialAlreadyUsed) return;
    setActivating(true);
    try {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const { error } = await supabase.from('user_profiles').update({
        subscription_status: 'trial',
        trial_started_at: now.toISOString(),
        trial_ends_at: trialEnd.toISOString(),
        trial_end_date: trialEnd.toISOString(),
      }).eq('id', user.id);
      if (!error) {
        await refreshProfile();
      } else {
        console.error('Trial activation error:', error);
      }
    } catch (err) {
      console.error('Trial activation error:', err);
    } finally {
      setActivating(false);
    }
  };

  // Admin accounts bypass all subscription checks (check profile role AND email domain as fallback)
  if (!loading && user && (isAdmin || isAdminDomain(user.email))) {
    return <>{children}</>;
  }

  // Show loading spinner while checking auth (with timeout failsafe)
  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (also handles timeout)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If requiring paid subscription and user is paid, allow access
  if (requirePaid && isPaidUser) {
    return <>{children}</>;
  }

  // If not requiring paid but user has trial or paid access, allow access
  if (!requirePaid && (isTrialActive || isPaidUser)) {
    return <>{children}</>;
  }

  // Show upgrade prompt for trial users trying to access paid features
  if (isTrialActive && requirePaid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Premium Feature</CardTitle>
            <CardDescription>
              This feature requires a paid subscription. Upgrade now to unlock all features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant="secondary" className="mb-2">
                <Clock className="h-3 w-3 mr-1" />
                {trialDaysRemaining} days left in trial
              </Badge>
            </div>
            <Button className="w-full" onClick={() => navigate('/profile')}>
              <CreditCard className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show upgrade / trial prompt
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl">Subscription Required</CardTitle>
          <CardDescription>
            {trialAlreadyUsed
              ? 'Your trial has ended. Upgrade to continue accessing premium features.'
              : 'Start your free 3-day trial to access this feature.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!trialAlreadyUsed && (
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                3-day free trial available
              </Badge>
            </div>
          )}
          {trialAlreadyUsed ? (
            <Button className="w-full" onClick={() => navigate('/profile')}>
              <CreditCard className="h-4 w-4 mr-2" /> Upgrade Now
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleActivateTrial}
              disabled={activating}
            >
              {activating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Activating...</>
              ) : (
                <><CreditCard className="h-4 w-4 mr-2" /> Start Free Trial</>
              )}
            </Button>
          )}
          <Button variant="outline" className="w-full" onClick={() => navigate('/app')}>
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};