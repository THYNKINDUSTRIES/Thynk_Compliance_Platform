import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function DigestTestButton() {
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSendDigest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-digest-emails', {
        body: { frequency }
      });

      if (error) throw error;

      setResult(data);
      toast.success(`Digest sent! ${data.sent} emails sent, ${data.failed} failed`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send digest');
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Test Digest Emails
        </CardTitle>
        <CardDescription>
          Manually trigger digest email sends for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Frequency</label>
          <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Digest</SelectItem>
              <SelectItem value="weekly">Weekly Digest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSendDigest} 
          disabled={loading}
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? 'Sending...' : 'Send Digest Now'}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            {result.error ? (
              <div className="flex items-start gap-2 text-red-600">
                <XCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{result.error}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-green-600">
                <CheckCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Success</p>
                  <p className="text-sm">
                    Sent: {result.sent} | Failed: {result.failed}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
