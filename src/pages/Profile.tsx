import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Lock, Shield, RefreshCw, CheckCircle, AlertCircle, Play, CreditCard, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

declare const Stripe: any;

function SubscriptionTab() {
  const { profile, session, isTrialActive, isPaidUser, trialDaysRemaining, refreshProfile } = useAuth();

  // Whether this user has already had a trial before
  const trialAlreadyUsed = profile?.trial_started_at != null;

  const redirectToStripeCheckout = async () => {
    const accessToken = session?.access_token;
    if (!accessToken) {
      toast({ title: 'Session expired', description: 'Please sign out and sign back in to continue.', variant: 'destructive' });
      return;
    }

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

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to start checkout.');
      }

      // Use the direct checkout URL from Stripe (more reliable than redirectToCheckout)
      if (payload.url) {
        window.location.href = payload.url;
        return;
      }

      // Fallback to Stripe.js redirectToCheckout if no URL returned
      const publishableKey = payload.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey || !payload.sessionId) {
        throw new Error('Stripe configuration is missing.');
      }
      const stripeInstance = Stripe(publishableKey);
      const { error } = await stripeInstance.redirectToCheckout({ sessionId: payload.sessionId });
      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Checkout redirect failed:', err);
      toast({ title: 'Checkout failed', description: err instanceof Error ? err.message : 'Unable to start Stripe checkout.', variant: 'destructive' });
    }
  };

  const handleSubscriptionAction = async () => {
    if (!isTrialActive && !isPaidUser && !trialAlreadyUsed && profile) {
      // Never had a trial — activate a fresh 3-day trial
      try {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const { error } = await supabase.from('user_profiles').update({
          subscription_status: 'trial',
          trial_started_at: now.toISOString(),
          trial_ends_at: trialEnd.toISOString(),
          trial_end_date: trialEnd.toISOString(),
        }).eq('id', profile.id);
        if (error) {
          toast({ title: 'Error', description: 'Failed to activate trial. Please try again.', variant: 'destructive' });
          console.error('Trial activation error:', error);
        } else {
          toast({ title: 'Trial Activated!', description: 'Your 3-day free trial has started.' });
          await refreshProfile();
        }
      } catch (err) {
        console.error('Trial activation error:', err);
        toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
      }
    } else {
      // Trial expired or currently active — redirect to Stripe checkout
      await redirectToStripeCheckout();
    }
  };

  const getSubscriptionStatus = () => {
    if (isPaidUser) return { status: 'Active', color: 'text-green-600', bg: 'bg-green-50' };
    if (isTrialActive) return { status: 'Trial', color: 'text-blue-600', bg: 'bg-blue-50' };
    return { status: 'Expired', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const status = getSubscriptionStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription Status
          </CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={`p-4 rounded-lg ${status.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Current Plan</span>
              <Badge variant={isPaidUser ? 'default' : isTrialActive ? 'secondary' : 'destructive'}>
                {status.status}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              {isPaidUser ? (
                'You have full access to all features.'
              ) : isTrialActive ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {trialDaysRemaining} days remaining in trial
                </span>
              ) : (
                'Your trial has expired. Upgrade to continue using premium features.'
              )}
            </div>
          </div>

          {isTrialActive && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Trial Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Access to platform and dashboard</li>
                <li>• Basic compliance monitoring</li>
                <li>• State regulation tracking</li>
                <li>• Email notifications</li>
              </ul>
            </div>
          )}

          {isPaidUser && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Pro Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All trial features</li>
                <li>• Advanced analytics and reporting</li>
                <li>• Compliance checklists and templates</li>
                <li>• Workflow automation</li>
                <li>• Priority support</li>
                <li>• API access</li>
              </ul>
            </div>
          )}

          {!isPaidUser && (
            <div className="flex gap-3">
              <Button className="bg-[#794108] hover:bg-[#E89C5C]" onClick={handleSubscriptionAction}>
                <CreditCard className="w-4 h-4 mr-2" />
                {isTrialActive ? 'Upgrade to Pro' : trialAlreadyUsed ? 'Upgrade to Pro' : 'Start Free Trial'}
              </Button>
            </div>
          )}

          {profile && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>Trial started: {new Date(profile.trial_started_at).toLocaleDateString()}</div>
              <div>Trial ends: {new Date(profile.trial_ends_at).toLocaleDateString()}</div>
              {profile.subscription_started_at && (
                <div>Subscription started: {new Date(profile.subscription_started_at).toLocaleDateString()}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, updatePassword, onboardingCompleted, resetOnboarding } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);

  // Sync fullName when profile loads asynchronously
  useEffect(() => {
    if (profile?.full_name && !fullName) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await updateProfile({ full_name: fullName });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.'
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords match.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setChangingPassword(true);
      const result = await updatePassword(newPassword);
      
      if (result.success) {
        toast({
          title: 'Password Changed',
          description: 'Your password has been updated successfully.'
        });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to change password.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      toast({
        title: 'Error',
        description: 'Failed to change password. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleReplayTour = () => {
    resetOnboarding();
    navigate('/app');
    toast({
      title: 'Tour Restarted',
      description: 'The platform tour will begin shortly.'
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />
      <div className="container mx-auto px-4 py-8 mt-20 max-w-4xl">
        <h1 className="text-4xl font-bold text-[#794108] mb-8">Profile Settings</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Shield className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <p className="text-sm text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-[#794108] hover:bg-[#E89C5C]"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#794108]" />
                      <span>Account Role</span>
                    </div>
                    <span className="font-medium capitalize">{profile?.role || 'User'}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {profile?.email_verified ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      )}
                      <span>Email Verified</span>
                    </div>
                    <span className={`font-medium ${profile?.email_verified ? 'text-green-600' : 'text-amber-600'}`}>
                      {profile?.email_verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-[#794108]" />
                      <span>Onboarding</span>
                    </div>
                    <span className="font-medium">
                      {onboardingCompleted ? 'Completed' : 'Not Started'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-[#794108]" />
                      <span>Member Since</span>
                    </div>
                    <span className="font-medium">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionTab />
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <p className="text-sm text-gray-500">Must be at least 6 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  className="bg-[#794108] hover:bg-[#E89C5C]"
                >
                  {changingPassword ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Tour</CardTitle>
                <CardDescription>Replay the onboarding experience</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Want to see the platform tour again? Click below and you'll be taken through 
                  the full interactive walkthrough.
                </p>
                <Button 
                  onClick={handleReplayTour}
                  variant="outline"
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  Replay Platform Tour
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
