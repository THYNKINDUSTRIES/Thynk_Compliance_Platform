import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, CheckCircle2, Mail, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';


export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ attemptsRemaining: number } | null>(null);
  const [userIpAddress, setUserIpAddress] = useState<string>('');
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Get user's IP address on component mount
  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIpAddress(data.ip);
      } catch (err) {
        console.error('Failed to fetch IP address:', err);
        // Use a fallback identifier
        setUserIpAddress('unknown');
      }
    };
    fetchIpAddress();
  }, []);

  const checkRateLimit = async (actionType: string) => {
    // Skip rate limit check if IP not available
    if (!userIpAddress || userIpAddress === 'unknown') {
      return true;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-rate-limit', {
        body: { 
          ipAddress: userIpAddress,
          email: email,
          action: actionType // Changed from actionType to action
        }
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // Allow the action to proceed if rate limit check fails
        return true;
      }

      if (!data.allowed) {
        setError(data.message);
        return false;
      }

      return true;
    } catch (err: any) {
      console.error('Rate limit check error:', err);
      // Allow the action to proceed if rate limit check fails
      return true;
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Check rate limit before attempting signup
      const rateLimitPassed = await checkRateLimit('signup');
      if (!rateLimitPassed) {
        setLoading(false);
        return;
      }

      await signUp(email, password, fullName);
      setSuccess(true);
      setEmailSent(true);
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Handle specific error codes
      if (err.message?.includes('User already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.message?.includes('Invalid email')) {
        setError('Please enter a valid email address');
      } else if (err.message?.includes('Password')) {
        setError('Password must be at least 6 characters long');
      } else if (err.status === 422) {
        setError('Invalid signup data. Please check your email and password.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };



  const handleResendVerification = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      // Check rate limit before resending verification email
      const rateLimitPassed = await checkRateLimit('email_verification');
      if (!rateLimitPassed) {
        setResendLoading(false);
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };


  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-medium mb-2">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check your email inbox</li>
                <li>Click the verification link</li>
                <li>Return here to sign in</li>
              </ol>
            </div>
            {success && (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Verification email resent!</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleResendVerification}
              disabled={resendLoading}
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </Button>
            <Button 
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Sign up to start tracking regulations
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Account created! Redirecting to login...</AlertDescription>
              </Alert>
            )}
            {rateLimitInfo && rateLimitInfo.attemptsRemaining <= 1 && (
              <Alert className="bg-amber-50 text-amber-900 border-amber-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Warning: {rateLimitInfo.attemptsRemaining} signup attempt{rateLimitInfo.attemptsRemaining !== 1 ? 's' : ''} remaining before cooldown.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
