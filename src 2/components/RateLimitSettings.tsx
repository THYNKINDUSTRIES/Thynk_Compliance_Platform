import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RateLimitData {
  action_type: string;
  attempt_count: number;
  reset_at: string;
}

export default function RateLimitSettings() {
  const [rateLimits, setRateLimits] = useState<RateLimitData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRateLimits();
  }, []);

  const fetchRateLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('rate_limits')
        .select('*')
        .order('last_attempt_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRateLimits(data || []);
    } catch (err) {
      console.error('Error fetching rate limits:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (resetAt: string) => {
    const diff = new Date(resetAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const minutes = Math.ceil(diff / 60000);
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle>Rate Limit Status</CardTitle>
        </div>
        <CardDescription>
          View your current rate limit status for security-sensitive actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Rate Limits:</strong> Signup (3/hour), Email Verification (5/hour), Password Reset (3/hour)
          </AlertDescription>
        </Alert>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : rateLimits.length === 0 ? (
          <p className="text-sm text-gray-500">No active rate limits</p>
        ) : (
          <div className="space-y-3">
            {rateLimits.map((limit, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm capitalize">
                    {limit.action_type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    Resets in {getTimeRemaining(limit.reset_at)}
                  </p>
                </div>
                <Badge variant={limit.attempt_count >= 3 ? 'destructive' : 'secondary'}>
                  {limit.attempt_count} attempts
                </Badge>
              </div>
            ))}
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchRateLimits}
          className="w-full"
        >
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
}
