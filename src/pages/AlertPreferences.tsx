import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Plus, Trash2, Mail, Calendar } from 'lucide-react';
import FederalAlertPreferences from '@/components/FederalAlertPreferences';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AlertPreferences() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      loadUserData(savedEmail);
    }
  }, []);

  const loadUserData = async (userEmail: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-alerts', {
        body: { action: 'get_user', data: { email: userEmail } }
      });

      if (data?.data) {
        setUserId(data.data.id);
        setName(data.data.name || '');
        loadProfiles(data.data.id);
      }
    } catch (err) {
      console.error('Error loading user:', err);
    }
  };

  const loadProfiles = async (uid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-alerts', {
        body: { action: 'list', data: { userId: uid } }
      });

      if (data?.data) {
        setProfiles(data.data);
      }
    } catch (err) {
      console.error('Error loading profiles:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-12 px-4">

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Bell className="w-16 h-16 text-[#794108] mx-auto mb-4" />
          <h1 className="text-4xl font-serif font-bold text-[#794108] mb-4">Alert Preferences</h1>
          <p className="text-xl text-gray-600">Stay informed about regulations that matter to you</p>
        </div>


        <Tabs defaultValue="subscribe" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subscribe">Subscribe</TabsTrigger>
            <TabsTrigger value="federal">Federal Alerts</TabsTrigger>
            <TabsTrigger value="manage">Manage Alerts</TabsTrigger>
          </TabsList>


          <TabsContent value="subscribe">
            <Card>
              <CardHeader>
                <CardTitle>Create New Alert</CardTitle>
                <CardDescription>Set up a new alert profile to receive notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertSubscriptionForm 
                  email={email}
                  name={name}
                  onSuccess={() => {
                    if (userId) loadProfiles(userId);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="federal">
            <FederalAlertPreferences />
          </TabsContent>


          <TabsContent value="manage">
            <AlertProfilesList 
              profiles={profiles}
              onUpdate={() => userId && loadProfiles(userId)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AlertSubscriptionForm({ email: initialEmail, name: initialName, onSuccess }: any) {
  const [formData, setFormData] = useState({
    email: initialEmail || '',
    name: initialName || '',
    profileName: '',
    frequency: 'daily',
    jurisdictions: [] as string[],
    productCategories: [] as string[],
    keywords: '',
    criticalOnly: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('manage-alerts', {
        body: {
          action: 'subscribe',
          data: {
            email: formData.email,
            name: formData.name,
            profileName: formData.profileName,
            frequency: formData.frequency,
            jurisdictions: formData.jurisdictions,
            productCategories: formData.productCategories,
            keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
            criticalOnly: formData.criticalOnly
          }
        }
      });

      if (error) throw error;

      localStorage.setItem('userEmail', formData.email);
      toast.success('Alert created successfully!');
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Alert Profile Name</Label>
        <Input
          value={formData.profileName}
          onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
          placeholder="e.g., California Cannabis Regulations"
          required
        />
      </div>

      <div>
        <Label>Email Frequency</Label>
        <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">Immediate (as they happen)</SelectItem>
            <SelectItem value="daily">Daily Digest (8 AM UTC)</SelectItem>
            <SelectItem value="weekly">Weekly Digest (Monday 8 AM UTC)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          {formData.frequency === 'daily' && 'Receive a summary of new regulations once per day'}
          {formData.frequency === 'weekly' && 'Receive a weekly summary every Monday morning'}
          {formData.frequency === 'immediate' && 'Get notified as soon as regulations match your criteria'}
        </p>
      </div>


      <div>
        <Label>Keywords (comma-separated)</Label>
        <Input
          value={formData.keywords}
          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
          placeholder="e.g., cannabis, testing, packaging"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          checked={formData.criticalOnly}
          onCheckedChange={(checked) => setFormData({ ...formData, criticalOnly: checked as boolean })}
        />
        <Label>Critical updates only</Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Alert'}
      </Button>
    </form>
  );
}

function AlertProfilesList({ profiles, onUpdate }: any) {
  const handleDelete = async (profileId: string) => {
    try {
      await supabase.functions.invoke('manage-alerts', {
        body: { action: 'delete', data: { profileId } }
      });
      toast.success('Alert deleted');
      onUpdate();
    } catch (err) {
      toast.error('Failed to delete alert');
    }
  };

  return (
    <div className="space-y-4">
      {profiles.map((profile: any) => (
        <Card key={profile.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{profile.profile_name}</CardTitle>
                <CardDescription>
                  {profile.frequency} • {profile.is_active ? 'Active' : 'Inactive'}
                </CardDescription>
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(profile.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profile.keywords?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.keywords.map((kw: string) => (
                    <Badge key={kw} variant="secondary">{kw}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
