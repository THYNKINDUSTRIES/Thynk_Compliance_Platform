import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Database,
  Activity,
  Filter,
  Calendar,
  BarChart3,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface ExecutionLog {
  id: string;
  job_name: string;
  status: string;
  records_processed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  execution_time_ms: number;
}

interface DailyStats {
  date: string;
  total: number;
  success: number;
  failed: number;
  records: number;
  avgDuration: number;
}

interface PollerStats {
  name: string;
  total: number;
  success: number;
  failed: number;
  records: number;
  avgDuration: number;
  lastRun: string | null;
  lastStatus: string;
}

const POLLER_TYPES = [
  { value: 'all', label: 'All Pollers' },
  { value: 'federal-register-poller', label: 'Federal Register' },
  { value: 'regulations-gov-poller', label: 'Regulations.gov' },
  { value: 'rss-feed-poller', label: 'RSS Feed' },
  { value: 'cannabis-hemp-poller', label: 'Cannabis & Hemp' },
  { value: 'kratom-poller', label: 'Kratom' },
  { value: 'kava-poller', label: 'Kava' },
  { value: 'scheduled-poller-cron', label: 'Scheduled Cron' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'success', label: 'Success Only' },
  { value: 'failed', label: 'Failed Only' },
  { value: 'running', label: 'Running' },
];

export default function PollingExecutionHistory() {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollerFilter, setPollerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      let query = supabase
        .from('job_execution_log')
        .select('*')
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: false });

      if (pollerFilter !== 'all') {
        query = query.eq('job_name', pollerFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching logs:', error);
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [pollerFilter, statusFilter, dateRange]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter(l => l.status === 'success').length;
    const failed = logs.filter(l => l.status === 'failed').length;
    const running = logs.filter(l => l.status === 'running').length;
    const totalRecords = logs.reduce((sum, l) => sum + (l.records_processed || 0), 0);
    const avgDuration = total > 0 
      ? logs.reduce((sum, l) => sum + (l.execution_time_ms || 0), 0) / total 
      : 0;
    const successRate = total > 0 ? (success / total) * 100 : 0;

    return { total, success, failed, running, totalRecords, avgDuration, successRate };
  }, [logs]);

  // Calculate daily stats for chart
  const dailyStats = useMemo((): DailyStats[] => {
    const days: Record<string, DailyStats> = {};
    
    logs.forEach(log => {
      const date = new Date(log.started_at).toLocaleDateString();
      if (!days[date]) {
        days[date] = { date, total: 0, success: 0, failed: 0, records: 0, avgDuration: 0 };
      }
      days[date].total++;
      if (log.status === 'success') days[date].success++;
      if (log.status === 'failed') days[date].failed++;
      days[date].records += log.records_processed || 0;
      days[date].avgDuration += log.execution_time_ms || 0;
    });

    return Object.values(days)
      .map(d => ({ ...d, avgDuration: d.total > 0 ? d.avgDuration / d.total : 0 }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs]);

  // Calculate per-poller stats
  const pollerStats = useMemo((): PollerStats[] => {
    const pollers: Record<string, PollerStats> = {};
    
    logs.forEach(log => {
      const name = log.job_name;
      if (!pollers[name]) {
        pollers[name] = { 
          name, 
          total: 0, 
          success: 0, 
          failed: 0, 
          records: 0, 
          avgDuration: 0,
          lastRun: null,
          lastStatus: 'unknown'
        };
      }
      pollers[name].total++;
      if (log.status === 'success') pollers[name].success++;
      if (log.status === 'failed') pollers[name].failed++;
      pollers[name].records += log.records_processed || 0;
      pollers[name].avgDuration += log.execution_time_ms || 0;
      
      if (!pollers[name].lastRun || new Date(log.started_at) > new Date(pollers[name].lastRun!)) {
        pollers[name].lastRun = log.started_at;
        pollers[name].lastStatus = log.status;
      }
    });

    return Object.values(pollers)
      .map(p => ({ ...p, avgDuration: p.total > 0 ? p.avgDuration / p.total : 0 }))
      .sort((a, b) => b.total - a.total);
  }, [logs]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const start = page * pageSize;
    return logs.slice(start, start + pageSize);
  }, [logs, page]);

  const totalPages = Math.ceil(logs.length / pageSize);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="secondary">
            <Activity className="w-3 h-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPollerDisplayName = (name: string) => {
    const poller = POLLER_TYPES.find(p => p.value === name);
    return poller?.label || name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get max values for chart scaling
  const maxDailyTotal = Math.max(...dailyStats.map(d => d.total), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Polling Execution History
          </h2>
          <p className="text-muted-foreground mt-1">
            View and analyze cron job executions over the past {dateRange} days
          </p>
        </div>
        <Button onClick={fetchLogs} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Poller Type</label>
              <Select value={pollerFilter} onValueChange={setPollerFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POLLER_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 Hours</SelectItem>
                  <SelectItem value="3">Last 3 Days</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="14">Last 14 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{summaryStats.total.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.successRate.toFixed(1)}%
                </p>
              </div>
              {summaryStats.successRate >= 90 ? (
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.success}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{summaryStats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Records Added</p>
                <p className="text-2xl font-bold">{summaryStats.totalRecords.toLocaleString()}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{formatDuration(summaryStats.avgDuration)}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Daily Execution Activity</CardTitle>
          <CardDescription>Executions per day over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyStats.length > 0 ? (
            <div className="space-y-2">
              {dailyStats.map((day, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-muted-foreground shrink-0">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 flex items-center gap-1 h-6">
                    <div 
                      className="bg-green-500 h-full rounded-l transition-all"
                      style={{ width: `${(day.success / maxDailyTotal) * 100}%` }}
                      title={`${day.success} successful`}
                    />
                    <div 
                      className="bg-red-500 h-full rounded-r transition-all"
                      style={{ width: `${(day.failed / maxDailyTotal) * 100}%` }}
                      title={`${day.failed} failed`}
                    />
                  </div>
                  <div className="w-20 text-xs text-right shrink-0">
                    <span className="text-green-600">{day.success}</span>
                    {day.failed > 0 && (
                      <span className="text-red-600 ml-1">/ {day.failed}</span>
                    )}
                  </div>
                  <div className="w-16 text-xs text-muted-foreground text-right shrink-0">
                    {day.records.toLocaleString()} rec
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No execution data for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-Poller Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Poller Performance Summary</CardTitle>
          <CardDescription>Statistics by poller type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pollerStats.map((poller) => (
              <div 
                key={poller.name} 
                className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">{getPollerDisplayName(poller.name)}</h4>
                  {getStatusBadge(poller.lastStatus)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Executions:</span>
                    <span className="ml-1 font-medium">{poller.total}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Success:</span>
                    <span className="ml-1 font-medium text-green-600">
                      {poller.total > 0 ? ((poller.success / poller.total) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Records:</span>
                    <span className="ml-1 font-medium">{poller.records.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Time:</span>
                    <span className="ml-1 font-medium">{formatDuration(poller.avgDuration)}</span>
                  </div>
                </div>
                {poller.lastRun && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last run: {formatTimeAgo(poller.lastRun)}
                  </div>
                )}
              </div>
            ))}
          </div>
          {pollerStats.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No poller data for the selected filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Execution Log</CardTitle>
          <CardDescription>
            Showing {paginatedLogs.length} of {logs.length} executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length > 0 ? (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Poller</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Records</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {getPollerDisplayName(log.job_name)}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell className="text-right">
                          {log.records_processed?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(log.execution_time_ms || 0)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(log.started_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.started_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.error_message ? (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="w-3 h-3" />
                              <span className="text-xs truncate max-w-[200px]" title={log.error_message}>
                                {log.error_message}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No executions found for the selected filters</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filter criteria or date range
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
