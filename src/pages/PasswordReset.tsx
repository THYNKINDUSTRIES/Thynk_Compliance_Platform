import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ArrowLeft, Loader2, AlertTriangle, Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword, updatePassword, user } = useAuth();
  
  // Determine if this is a recovery (setting new password) or request (sending email)
  const isRecoveryMode = searchParams.get('type') === 'recovery' || user;
  
  // Request reset state
  const [email, setEmail] = useState('');
  
  // Set new password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Common state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // If user just logged in via recovery link, show password update form
  useEffect(() => {
    if (user && searchParams.get('type') === 'recovery') {
      // User is authenticated via recovery link, show password update form
    }
  }, [user, searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to send reset email. Please try again.');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword(newPassword);
      
      if (result.success) {
        setSuccess(true);
        // Redirect to app after success
        setTimeout(() => {
          navigate('/app');
        }, 2000);
      } else {
        setError(result.error || 'Failed to update password. Please try again.');
      }
    } catch (err: any) {
      console.error('Update password error:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Recovery mode - setting new password
  if (isRecoveryMode) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="p-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-3">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-center">Set New Password</CardTitle>
              <CardDescription className="text-center">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdatePassword}>
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
                    <AlertDescription>
                      Password updated successfully! Redirecting...
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={success || loading}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={loading || success}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Must be at least 6 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={success || loading}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={loading || success}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating password...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Password Updated!
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="p-4 text-center text-sm text-gray-500">
          <p>© 2026 Thynk Industries. All rights reserved.</p>
        </div>
      </div>
    );
  }

  // Request mode - sending reset email
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="p-4">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-3">
                <Mail className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRequestReset}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success ? (
                <Alert className="bg-green-50 text-green-900 border-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium">Check your email!</p>
                    <p className="mt-1 text-sm">
                      We've sent a password reset link to <strong>{email}</strong>. 
                      Click the link in the email to reset your password.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {!success && (
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              )}
              <Link 
                to="/login" 
                className="text-sm text-center text-blue-600 hover:underline"
              >
                Back to login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="p-4 text-center text-sm text-gray-500">
        <p>© 2026 Thynk Industries. All rights reserved.</p>
      </div>
    </div>
  );
}
