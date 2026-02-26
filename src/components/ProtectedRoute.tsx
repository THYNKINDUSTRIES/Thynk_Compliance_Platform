import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Loader2, Clock, Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  requireEmailVerification?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  adminOnly = false,
  requireEmailVerification = true
}: ProtectedRouteProps) => {
  const { user, profile, loading, isEmailVerified, resendVerificationEmail } = useAuth();
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

  // Show loading spinner while checking auth (with timeout)
  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Checking your account...</p>
          <p className="mt-1 text-xs text-slate-400">This should only take a moment</p>
        </div>
      </div>
    );
  }

  // If timed out but still loading, show retry option
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

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check email verification if required
  if (requireEmailVerification && !isEmailVerified) {
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
              Please verify your email address to access the platform. Check your inbox for the verification link we sent when you signed up.
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
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Sign In With a Different Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check admin role if required
  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};
