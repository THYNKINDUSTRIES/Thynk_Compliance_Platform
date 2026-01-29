import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CreditCard, Lock } from 'lucide-react';

interface SubscriptionRouteProps {
  children: React.ReactNode;
  requirePaid?: boolean; // If true, requires paid subscription, trial not enough
}

export const SubscriptionRoute = ({
  children,
  requirePaid = false
}: SubscriptionRouteProps) => {
  const { user, profile, loading, isTrialActive, isPaidUser, trialDaysRemaining } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
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
            <Button className="w-full" onClick={() => window.location.href = '/profile'}>
              <CreditCard className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show trial expired or upgrade prompt
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl">
            {isTrialActive ? 'Trial Access Required' : 'Subscription Required'}
          </CardTitle>
          <CardDescription>
            {isTrialActive
              ? 'Your trial has expired. Upgrade to continue accessing premium features.'
              : 'This feature requires a paid subscription. Start your free trial or upgrade now.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isTrialActive && (
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                3-day free trial available
              </Badge>
            </div>
          )}
          <Button className="w-full" onClick={() => window.location.href = '/profile'}>
            <CreditCard className="h-4 w-4 mr-2" />
            {isTrialActive ? 'Upgrade Now' : 'Start Free Trial'}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/app'}>
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};