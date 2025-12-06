import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DigestMonitoring() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0, avgRegs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDigestLogs();
    const interval = setInterval(loadDigestLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDigestLogs = async () => {
    try {
      const { data: logsData } = await supabase
        .from('digest_log')
        .select('*, alert_profiles(profile_name, users(email))')
        .order('sent_at', { ascending: false })
        .limit(20);

      if (logsData) {
        setLogs(logsData);
        
        const total = logsData.length;
        const sent = logsData.filter(l => l.status === 'sent').length;
        const failed = logsData.filter(l => l.status === 'failed').length;
        const avgRegs = logsData.reduce((sum, l) => sum + (l.regulations_count || 0), 0) / total || 0;
        
        setStats({ total, sent, failed, avgRegs: Math.round(avgRegs) });
      }
    } catch (err) {
      console.error('Error loading digest logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Mail className="w-8 h-8 text-[#794108]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold">{stats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Regulations</p>
                <p className="text-2xl font-bold">{stats.avgRegs}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Digest Sends</CardTitle>
          <CardDescription>Last 20 digest email deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No digest emails sent yet</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {log.alert_profiles?.profile_name || 'Unknown Profile'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {log.alert_profiles?.users?.email || 'No email'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={log.frequency === 'daily' ? 'default' : 'secondary'}>
                      {log.frequency}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {log.regulations_count} regs
                    </span>
                    <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(log.sent_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
