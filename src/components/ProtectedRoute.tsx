import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  requireEmailVerification?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  adminOnly = false,
  requireEmailVerification = false
}: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
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

  // Check email verification if required (currently disabled for simplicity)
  if (requireEmailVerification && profile && !profile.email_verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verification Required</h2>
          <p className="text-gray-600 mb-4">
            Please verify your email address to access this feature. Check your inbox for the verification link.
          </p>
          <button
            onClick={() => window.location.href = '/profile'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  // Check admin role if required
  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};
