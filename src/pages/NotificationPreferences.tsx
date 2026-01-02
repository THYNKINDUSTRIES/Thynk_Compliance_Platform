import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, Save, Clock, Calendar, Shield } from 'lucide-react';
import RateLimitSettings from '@/components/RateLimitSettings';
import AdminRateLimitControls from '@/components/AdminRateLimitControls';

import { CommentReminderPreferences } from '@/components/CommentReminderPreferences';


interface NotificationPreference {
  id: string;
  notification_type: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  digest_enabled?: boolean;
  digest_frequency?: string;
  digest_time?: string;
  digest_day?: number;
}

const notificationTypes = [
  { value: 'task_assigned', label: 'Task Assignments', description: 'When you are assigned to a new task' },
  { value: 'deadline_approaching', label: 'Deadline Reminders', description: 'When a task deadline is approaching' },
  { value: 'approval_required', label: 'Approval Requests', description: 'When your approval is required' },
  { value: 'comment_added', label: 'Comments', description: 'When someone comments on your tasks' },
  { value: 'task_completed', label: 'Task Completions', description: 'When a task is marked as completed' },
];

const dayOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [digestFrequency, setDigestFrequency] = useState('daily');
  const [digestTime, setDigestTime] = useState('09:00');
  const [digestDay, setDigestDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        await createDefaultPreferences(user.id);
        return;
      }

      setPreferences(data);
      
      // Set digest settings from first preference (they're the same for all)
      if (data[0]) {
        setDigestEnabled(data[0].digest_enabled || false);
        setDigestFrequency(data[0].digest_frequency || 'daily');
        setDigestTime(data[0].digest_time?.substring(0, 5) || '09:00');
        setDigestDay(data[0].digest_day || 1);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async (userId: string) => {
    const defaultPrefs = notificationTypes.map(type => ({
      user_id: userId,
      notification_type: type.value,
      in_app_enabled: true,
      email_enabled: true,
      digest_enabled: false,
      digest_frequency: 'daily',
      digest_time: '09:00:00',
      digest_day: 1,
    }));

    const { data, error } = await supabase
      .from('notification_preferences')
      .insert(defaultPrefs)
      .select();

    if (!error && data) {
      setPreferences(data);
    }
    setLoading(false);
  };

  const updatePreference = (notificationType: string, field: 'in_app_enabled' | 'email_enabled', value: boolean) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.notification_type === notificationType
          ? { ...pref, [field]: value }
          : pref
      )
    );
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      // Update all preferences with digest settings
      const updatedPrefs = preferences.map(pref => ({
        ...pref,
        digest_enabled: digestEnabled,
        digest_frequency: digestFrequency,
        digest_time: digestTime + ':00',
        digest_day: digestDay,
      }));

      const { error } = await supabase
        .from('notification_preferences')
        .upsert(updatedPrefs);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Notification preferences saved successfully',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading preferences...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize how you receive notifications and manage alert rate limits
        </p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="comments">Comment Reminders</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="admin">Admin Controls</TabsTrigger>
        </TabsList>


        <TabsContent value="notifications" className="space-y-6">

      <div className="space-y-6">
        {/* Digest Email Settings */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Email Digest Settings
            </CardTitle>
            <CardDescription>
              Receive a summary of all notifications in a single email instead of individual emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="digest-enabled" className="text-base font-medium">Enable Email Digest</Label>
                <p className="text-sm text-muted-foreground">Group notifications into scheduled digest emails</p>
              </div>
              <Switch
                id="digest-enabled"
                checked={digestEnabled}
                onCheckedChange={setDigestEnabled}
              />
            </div>

            {digestEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="digest-frequency" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Frequency
                    </Label>
                    <Select value={digestFrequency} onValueChange={setDigestFrequency}>
                      <SelectTrigger id="digest-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="digest-time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time (UTC)
                    </Label>
                    <Select value={digestTime} onValueChange={setDigestTime}>
                      <SelectTrigger id="digest-time">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {digestFrequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label htmlFor="digest-day">Day of Week</Label>
                    <Select value={digestDay.toString()} onValueChange={(v) => setDigestDay(parseInt(v))}>
                      <SelectTrigger id="digest-day">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dayOptions.map(day => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> When digest is enabled, individual email notifications will be disabled. 
                    You'll receive a single email {digestFrequency === 'daily' ? 'every day' : 'every week'} at {digestTime} UTC
                    {digestFrequency === 'weekly' && ` on ${dayOptions.find(d => d.value === digestDay)?.label}`}.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Individual Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Choose which notifications you want to receive and how
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {notificationTypes.map(type => {
              const pref = preferences.find(p => p.notification_type === type.value);
              if (!pref) return null;

              return (
                <div key={type.value} className="border-b pb-6 last:border-0">
                  <div className="mb-3">
                    <h3 className="font-medium">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                  <div className="flex items-center justify-between space-x-8">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`${type.value}-in-app`}>In-App</Label>
                      <Switch
                        id={`${type.value}-in-app`}
                        checked={pref.in_app_enabled}
                        onCheckedChange={(checked) =>
                          updatePreference(type.value, 'in_app_enabled', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`${type.value}-email`}>
                        {digestEnabled ? 'Include in Digest' : 'Email'}
                      </Label>
                      <Switch
                        id={`${type.value}-email`}
                        checked={pref.email_enabled}
                        onCheckedChange={(checked) =>
                          updatePreference(type.value, 'email_enabled', checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <Button onClick={savePreferences} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="comments">
          <CommentReminderPreferences />
        </TabsContent>


        <TabsContent value="rate-limits">
          <RateLimitSettings />
        </TabsContent>

        <TabsContent value="admin">
          <AdminRateLimitControls />
        </TabsContent>
      </Tabs>
    </div>
  );
}

