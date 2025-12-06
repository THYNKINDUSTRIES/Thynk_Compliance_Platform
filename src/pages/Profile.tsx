import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, User, Heart, Search, Mail, AlertCircle } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RegulationCard } from '@/components/RegulationCard';

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResendVerification = async () => {
    if (!profile?.email) return;
    setResendLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: profile.email,
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


  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_favorites')
        .select('instrument_id, instrument(*)')
        .eq('user_id', user?.id);
      return data?.map(f => f.instrument) || [];
    },
    enabled: !!user
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateProfile({ full_name: fullName });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User size={16} />
              Account
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart size={16} />
              Favorites ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="searches" className="flex items-center gap-2">
              <Search size={16} />
              Saved Searches
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!profile?.email_verified && (
                  <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Your email is not verified. Please check your inbox.</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={resendLoading}
                      >
                        {resendLoading ? 'Sending...' : 'Resend'}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="bg-green-50 text-green-900 border-green-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>Profile updated successfully!</AlertDescription>
                  </Alert>
                )}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="flex items-center gap-2">
                    <Input value={profile?.email} disabled />
                    {profile?.email_verified && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div>
                    <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
                      {profile?.role}
                    </Badge>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Favorite Regulations</CardTitle>
                <CardDescription>Regulations you've saved for quick access</CardDescription>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No favorites yet</p>
                ) : (
                  <div className="space-y-4">
                    {favorites.map((reg: any) => (
                      <RegulationCard key={reg.id} regulation={reg} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="searches">
            <Card>
              <CardHeader>
                <CardTitle>Saved Searches</CardTitle>
                <CardDescription>Your saved search queries</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">Coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
