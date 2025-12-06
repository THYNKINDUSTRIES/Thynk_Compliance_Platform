import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminRateLimitControls() {
  const [ipAddress, setIpAddress] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const clearRateLimitByIp = async () => {
    if (!ipAddress.trim()) {
      setMessage('Please enter an IP address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('rate_limits')
        .delete()
        .eq('ip_address', ipAddress);

      if (error) throw error;
      setMessage(`Rate limits cleared for IP: ${ipAddress}`);
      setIpAddress('');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearRateLimitByEmail = async () => {
    if (!email.trim()) {
      setMessage('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('rate_limits')
        .delete()
        .eq('email', email);

      if (error) throw error;
      setMessage(`Rate limits cleared for email: ${email}`);
      setEmail('');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-600" />
          <CardTitle>Admin: Rate Limit Controls</CardTitle>
        </div>
        <CardDescription>
          Clear rate limits for specific IP addresses or email addresses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="ipAddress">Clear by IP Address</Label>
          <div className="flex gap-2">
            <Input
              id="ipAddress"
              placeholder="192.168.1.1"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
            <Button 
              onClick={clearRateLimitByIp} 
              disabled={loading}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Clear by Email</Label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button 
              onClick={clearRateLimitByEmail} 
              disabled={loading}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
