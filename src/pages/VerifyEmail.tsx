import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

/**
 * VerifyEmail page - handles email verification redirects from Supabase
 * This page is reached when users click the verification link in their email.
 */
export default function VerifyEmail() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Check if user has a session (they should after clicking the email link)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is logged in, ensure their profile is marked as verified
          await supabase
            .from('user_profiles')
            .update({ email_verified: true })
            .eq('id', session.user.id);

          setStatus('success');
        } else {
          // No session - might be an expired link or already verified
          // Just redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Verification page error:', error);
        setStatus('error');
      }
    };

    // Small delay to let Supabase process the token from URL
    const timer = setTimeout(handleVerification, 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'checking' && (
            <>
              <CardTitle>Verifying Email</CardTitle>
              <CardDescription>Please wait while we verify your email address</CardDescription>
            </>
          )}
          {status === 'success' && (
            <>
              <CardTitle className="text-green-600">Email Verified!</CardTitle>
              <CardDescription>Your email has been successfully verified</CardDescription>
            </>
          )}
          {status === 'error' && (
            <>
              <CardTitle className="text-red-600">Verification Issue</CardTitle>
              <CardDescription>There was a problem verifying your email</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === 'checking' && (
            <>
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              <p className="text-gray-600">Verifying your email address...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <p className="text-gray-800 font-medium text-center">
                Your account is ready to use!
              </p>
              <Button onClick={() => navigate('/app')} className="mt-4">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="text-gray-600 text-center">
                The verification link may have expired or already been used.
              </p>
              <div className="flex gap-3 mt-4">
                <Link to="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button>Create Account</Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
