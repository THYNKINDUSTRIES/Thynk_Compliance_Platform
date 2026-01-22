import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Clock, CheckCircle, XCircle, Activity, Play, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobLog {
  id: string;
  job_name: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  records_processed: number;
  error_message: string | null;
  execution_time_ms: number;
}

interface JobStats {
  name: string;
  lastRun: string | null;
  status: string;
  successRate: number;
  avgExecutionTime: number;
  totalRuns: number;
  recordsProcessed: number;
}

export default function SchedulerMonitoring() {
  const [jobStats, setJobStats] = useState<JobStats[]>([]);
  const [recentLogs, setRecentLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const { toast } = useToast();



  useEffect(() => {
    fetchJobStats();
    
    // Auto-refresh stats every 30 seconds
    const statsInterval = setInterval(fetchJobStats, 30000);
    
    // Auto-trigger pollers every 6 hours
    const pollingInterval = setInterval(() => {
      triggerAllPollers();
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
    
    // Trigger pollers on initial load if they haven't run recently
    const checkAndTrigger = async () => {
      const { data } = await supabase
        .from('job_execution_log')
        .select('completed_at, execution_time_ms')
        .order('completed_at.desc')
  ``````.limit(1)
        .maybeSingle(); 
      
      if (!logs || logs.length === 0) {
        // No logs exist, trigger initial polling
        setTimeout(() => triggerAllPollers(), 2000);
      } else {
        const lastRun = new Date(logs[0].started_at);
        const hoursSinceLastRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastRun > 6) {
          // Last run was more than 6 hours ago, trigger polling
          setTimeout(() => triggerAllPollers(), 2000);
        }
      }
    };
    
    checkAndTrigger();
    
    return () => {
      clearInterval(statsInterval);
      clearInterval(pollingInterval);
    };
  }, []);


  const fetchJobStats = async () => {
    try {
      const { data: logs, error } = await supabase
        .from('job_execution_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100)
        .maybeSingle;

        if (data) {
  // Show normal stats
     setLastRun(new Date(data.completed_at));
     setDuration(data.execution_time_ms);
} else {
  // Table empty or no runs yet
     setLastRun(null);
     setMessage('No completed runs yet');
}

      if (error) throw error;

      // Calculate stats per job
      const jobNames = ['federal-register-poller', 'regulations-gov-poller', 'rss-feed-poller'];
      const stats = jobNames.map(name => {
        const jobLogs = logs?.filter(l => l.job_name === name) || [];
        const successCount = jobLogs.filter(l => l.status === 'success').length;
        const totalRuns = jobLogs.length;
        const successRate = totalRuns > 0 ? (successCount / totalRuns) * 100 : 0;
        const avgTime = jobLogs.reduce((sum, l) => sum + (l.execution_time_ms || 0), 0) / (totalRuns || 1);
        const totalRecords = jobLogs.reduce((sum, l) => sum + (l.records_processed || 0), 0);

        return {
          name,
          lastRun: jobLogs[0]?.started_at || null,
          status: jobLogs[0]?.status || 'unknown',
          successRate,
          avgExecutionTime: Math.round(avgTime),
          totalRuns,
          recordsProcessed: totalRecords
        };
      });

      setJobStats(stats);
      setRecentLogs(logs?.slice(0, 10) || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching job stats:', error);
      setLoading(false);
    }
  };

  const triggerAllPollers = async () => {
    setTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-all-pollers');
      
      if (error) throw error;
      
      toast({
        title: 'Pollers Triggered',
        description: 'All data pollers have been started. Results will appear shortly.',
      });
      
      // Refresh stats after a short delay
      setTimeout(fetchJobStats, 3000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to trigger pollers',
        variant: 'destructive',
      });
    } finally {
      setTriggering(false);
    }
  };

  const triggerSinglePoller = async (pollerName: string) => {
    setTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke(pollerName);
      
      if (error) throw error;
      
      toast({
        title: 'Poller Triggered',
        description: `${pollerName} has been started successfully.`,
      });
      
      setTimeout(fetchJobStats, 3000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to trigger ${pollerName}`,
        variant: 'destructive',
      });
    } finally {
      setTriggering(false);
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'running':
        return <Badge variant="secondary"><Activity className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDuration = (ms: number) => {
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatLastRun = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="text-center py-8">Loading scheduler status...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Data Polling Status</h2>
          <p className="text-sm text-muted-foreground">Monitor and control automated data collection</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={triggerAllPollers} disabled={triggering} size="lg">
            <Play className="w-4 h-4 mr-2" />
            {triggering ? 'Running...' : 'Run All Pollers'}
          </Button>
          <Button onClick={fetchJobStats} variant="outline" size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {jobStats.map(job => (
          <Card key={job.name}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {job.name.replace(/-/g, ' ').toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                {getStatusBadge(job.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Last Run</span>
                <span className="text-sm font-medium flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatLastRun(job.lastRun)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Success Rate</span>
                <span className="text-sm font-medium">{job.successRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg Time</span>
                <span className="text-sm font-medium">{formatDuration(job.avgExecutionTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Runs</span>
                <span className="text-sm font-medium">{job.totalRuns}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Records</span>
                <span className="text-sm font-medium">{job.recordsProcessed.toLocaleString()}</span>
              </div>
              <div className="pt-2">
                <Button 
                  onClick={() => triggerSinglePoller(job.name)} 
                  disabled={triggering}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Run Now
                </Button>
              </div>
            </CardContent>

          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Execution Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{log.job_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.started_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs">{log.records_processed} records</span>
                  <span className="text-xs">{formatDuration(log.execution_time_ms)}</span>
                  {getStatusBadge(log.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}