import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check if user is already logged in and verified
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User clicked verification link and is now logged in
          // Update the email_verified status in user_profiles
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ email_verified: true })
            .eq('id', session.user.id);

          if (updateError) {
            console.error('Error updating email_verified status:', updateError);
          }

          setStatus('success');
          setMessage('Email verified successfully! Redirecting to dashboard...');
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          // No session found - verification might have failed
          setStatus('error');
          setMessage('Verification link expired or invalid. Please request a new verification email.');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Verification failed. Please try again.');
      }
    };

    verifyEmail();
  }, [navigate]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>Confirming your email address</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === 'verifying' && (
            <>
              <Loader2 className="h-16 w-16 text-green-600 animate-spin" />
              <p className="text-gray-600">Verifying your email...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <p className="text-gray-800 font-medium">{message}</p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-600" />
              <p className="text-gray-800 font-medium">{message}</p>
              <Button onClick={() => navigate('/login')}>Go to Login</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
