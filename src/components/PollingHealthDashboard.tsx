import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { RefreshCw, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface ExecutionLog {
  id: string;
  job_name: string;
  status: string;
  records_processed: number;
  error_message: string | null;
  executed_at: string;
  duration_ms: number;
}

export function PollingHealthDashboard() {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, avgDuration: 0 });
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_execution_log')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setLogs(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  const calculateStats = (data: ExecutionLog[]) => {
    const total = data.length;
    const success = data.filter(l => l.status === 'success').length;
    const failed = data.filter(l => l.status === 'failed').length;
    const avgDuration = data.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / total;
    setStats({ total, success, failed, avgDuration: Math.round(avgDuration) });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Polling Health Dashboard</h2>
        <Button onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.success} / {stats.total} executions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Total failures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgDuration / 1000).toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">Per execution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Last 50 runs</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {log.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{log.job_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.executed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                    {log.records_processed} records
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {(log.duration_ms / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}