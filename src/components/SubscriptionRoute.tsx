import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminDomain } from '@/lib/betaAccess';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CreditCard, Loader2, Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

declare const Stripe: any;

interface SubscriptionRouteProps {
  children: React.ReactNode;
}

export const SubscriptionRoute = ({
  children,
}: SubscriptionRouteProps) => {
  const { user, profile, loading, session, isAdmin, isTrialActive, isPaidUser, isEmailVerified, trialDaysRemaining, refreshProfile, resendVerificationEmail } = useAuth();
  const [activating, setActivating] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const navigate = useNavigate();

  // Failsafe: if loading takes >5 seconds, stop spinning and show fallback
  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Redirect to Stripe checkout
  const redirectToStripeCheckout = async () => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      toast({ title: 'Session expired', description: 'Please sign out and sign back in.', variant: 'destructive' });
      return;
    }
    setCheckingOut(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kruwbjaszdwzttblxqwr.supabase.co';
      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          success_url: `${window.location.origin}/app?checkout=success`,
          cancel_url: `${window.location.origin}/app?checkout=cancel`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to start checkout.');
      // Use the direct checkout URL from Stripe (more reliable than redirectToCheckout)
      if (payload.url) {
        window.location.href = payload.url;
        return;
      }
      // Fallback to Stripe.js redirectToCheckout if no URL returned
      const publishableKey = payload.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey || !payload.sessionId) throw new Error('Stripe configuration is missing.');
      const stripeInstance = Stripe(publishableKey);
      const { error } = await stripeInstance.redirectToCheckout({ sessionId: payload.sessionId });
      if (error) throw error;
    } catch (err) {
      console.error('Checkout redirect failed:', err);
      toast({ title: 'Checkout failed', description: err instanceof Error ? err.message : 'Unable to start Stripe checkout.', variant: 'destructive' });
    } finally {
      setCheckingOut(false);
    }
  };

  // Whether the user has already used their trial (prevent infinite restarts)
  const trialAlreadyUsed = profile?.trial_started_at != null;

  // Activate a 7-day trial (only if never had one before)
  const handleActivateTrial = async () => {
    if (!user || !profile || trialAlreadyUsed) return;
    setActivating(true);
    try {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
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
          <p className="mt-4 text-slate-600">Checking your account...</p>
          <p className="mt-1 text-xs text-slate-400">This should only take a moment</p>
        </div>
      </div>
    );
  }

  // If timed out but still loading, show a retry option instead of redirecting
  if (timedOut && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-xl">Taking longer than expected</CardTitle>
            <CardDescription>
              We're having trouble loading your account. This could be a temporary issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/app')}>
              Go to Platform
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/login')}>
              Sign In Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to login if not authenticated (also handles timeout)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Require email verification before granting subscription access
  if (!isEmailVerified) {
    const handleResend = async () => {
      setResending(true);
      setResendSuccess(false);
      const result = await resendVerificationEmail();
      if (result.success) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
      setResending(false);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-10 w-10 text-yellow-600" />
            </div>
            <CardTitle className="text-xl">Email Verification Required</CardTitle>
            <CardDescription className="text-base">
              Please verify your email address to access premium features. Check your inbox for the verification link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resendSuccess && (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Verification email resent! Check your inbox.</AlertDescription>
              </Alert>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resending...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Resend Verification Email</>
              )}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/app')}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Trial users AND paid users both get full Pro access
  if (isTrialActive || isPaidUser) {
    return <>{children}</>;
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
              ? 'Your trial has ended. Subscribe to continue, or use coupon code COMPLIANCE4ALL at checkout for 3 months free.'
              : 'Start your free 7-day trial for full access to all features.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!trialAlreadyUsed && (
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                7-day free trial — full access
              </Badge>
            </div>
          )}
          {trialAlreadyUsed && (
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Use code COMPLIANCE4ALL for 3 months free
              </Badge>
            </div>
          )}
          {trialAlreadyUsed ? (
            <Button className="w-full" onClick={redirectToStripeCheckout} disabled={checkingOut}>
              {checkingOut ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting to checkout...</>
              ) : (
                <><CreditCard className="h-4 w-4 mr-2" /> Upgrade Now</>
              )}
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