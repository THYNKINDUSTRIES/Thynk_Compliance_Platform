import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Loader2 } from 'lucide-react';

export function CommentReminderPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    comment_reminders_enabled: true,
    comment_reminder_7_days: true,
    comment_reminder_3_days: true,
    comment_reminder_1_day: true,
  });

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('comment_reminders_enabled, comment_reminder_7_days, comment_reminder_3_days, comment_reminder_1_day')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(preferences)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Preferences saved',
        description: 'Your comment reminder preferences have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {preferences.comment_reminders_enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          Comment Deadline Reminders
        </CardTitle>
        <CardDescription>
          Get notified before comment periods close on regulations you've favorited
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Enable Comment Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Receive email reminders for upcoming comment deadlines
            </p>
          </div>
          <Switch
            id="enabled"
            checked={preferences.comment_reminders_enabled}
            onCheckedChange={(checked) => 
              setPreferences({ ...preferences, comment_reminders_enabled: checked })
            }
          />
        </div>

        {preferences.comment_reminders_enabled && (
          <div className="space-y-4 pl-4 border-l-2 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="7days">7 Days Before</Label>
                <p className="text-sm text-muted-foreground">Early reminder</p>
              </div>
              <Switch
                id="7days"
                checked={preferences.comment_reminder_7_days}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, comment_reminder_7_days: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="3days">3 Days Before</Label>
                <p className="text-sm text-muted-foreground">Important reminder</p>
              </div>
              <Switch
                id="3days"
                checked={preferences.comment_reminder_3_days}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, comment_reminder_3_days: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="1day">1 Day Before</Label>
                <p className="text-sm text-muted-foreground">Urgent final reminder</p>
              </div>
              <Switch
                id="1day"
                checked={preferences.comment_reminder_1_day}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, comment_reminder_1_day: checked })
                }
              />
            </div>
          </div>
        )}

        <Button onClick={savePreferences} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}
