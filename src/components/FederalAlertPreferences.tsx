import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const agencies = [
  { id: 'DEA', name: 'Drug Enforcement Administration (DEA)' },
  { id: 'FDA', name: 'Food and Drug Administration (FDA)' },
  { id: 'EPA', name: 'Environmental Protection Agency (EPA)' },
  { id: 'USDA', name: 'U.S. Department of Agriculture (USDA)' },
  { id: 'TTB', name: 'Alcohol and Tobacco Tax and Trade Bureau (TTB)' },
  { id: 'ALL', name: 'All Federal Agencies' }
];

const alertTypes = [
  { id: 'deadline_reminder', name: 'Deadline Reminders' },
  { id: 'new_guidance', name: 'New Guidance Releases' },
  { id: 'enforcement_action', name: 'Enforcement Actions' },
  { id: 'rule_change', name: 'Regulation Changes' }
];

export default function FederalAlertPreferences() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('federal_alert_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      setSubscriptions(data);
    }
    setLoading(false);
  };

  const toggleAgency = async (agencyId: string, enabled: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (enabled) {
      const { error } = await supabase
        .from('federal_alert_subscriptions')
        .insert({
          user_id: user.id,
          agency: agencyId,
          alert_types: ['deadline_reminder', 'new_guidance', 'enforcement_action', 'rule_change']
        });

      if (!error) {
        toast({ title: 'Subscription added', description: `You'll receive alerts from ${agencyId}` });
        loadSubscriptions();
      }
    } else {
      const { error } = await supabase
        .from('federal_alert_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('agency', agencyId);

      if (!error) {
        toast({ title: 'Subscription removed' });
        loadSubscriptions();
      }
    }
  };

  const updateAlertTypes = async (agencyId: string, types: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('federal_alert_subscriptions')
      .update({ alert_types: types })
      .eq('user_id', user.id)
      .eq('agency', agencyId);

    if (!error) {
      toast({ title: 'Alert preferences updated' });
      loadSubscriptions();
    }
  };

  const getSub = (agencyId: string) => subscriptions.find(s => s.agency === agencyId);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Federal Agency Alerts</CardTitle>
          <CardDescription>
            Subscribe to alerts from federal agencies that regulate cannabis operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {agencies.map(agency => {
            const sub = getSub(agency.id);
            const isSubscribed = !!sub;

            return (
              <div key={agency.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={agency.id} className="text-base font-semibold">
                    {agency.name}
                  </Label>
                  <Switch
                    id={agency.id}
                    checked={isSubscribed}
                    onCheckedChange={(checked) => toggleAgency(agency.id, checked)}
                  />
                </div>

                {isSubscribed && (
                  <div className="ml-4 space-y-3">
                    <p className="text-sm text-muted-foreground">Alert Types:</p>
                    {alertTypes.map(type => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${agency.id}-${type.id}`}
                          checked={sub?.alert_types?.includes(type.id)}
                          onCheckedChange={(checked) => {
                            const current = sub?.alert_types || [];
                            const updated = checked
                              ? [...current, type.id]
                              : current.filter((t: string) => t !== type.id);
                            updateAlertTypes(agency.id, updated);
                          }}
                        />
                        <Label htmlFor={`${agency.id}-${type.id}`} className="text-sm">
                          {type.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
