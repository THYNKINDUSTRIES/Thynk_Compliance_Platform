import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSiteHealth, HealthCheck } from '@/hooks/useSiteHealth';
import {
  Activity,
  Shield,
  Database,
  Globe,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Zap,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pass':
      return <Badge className="bg-green-500/15 text-green-600 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Pass</Badge>;
    case 'warn':
      return <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-200"><AlertTriangle className="w-3 h-3 mr-1" /> Warning</Badge>;
    case 'fail':
      return <Badge className="bg-red-500/15 text-red-600 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Fail</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function OverallStatusBanner({ overall, score }: { overall: string; score: number }) {
  const config: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    healthy: { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', icon: <CheckCircle className="w-8 h-8" /> },
    warning: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400', icon: <AlertTriangle className="w-8 h-8" /> },
    degraded: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', icon: <XCircle className="w-8 h-8" /> },
    unknown: { bg: 'bg-gray-50 dark:bg-gray-950/30', border: 'border-gray-200 dark:border-gray-800', text: 'text-gray-700 dark:text-gray-400', icon: <Activity className="w-8 h-8" /> },
  };
  const c = config[overall] || config.unknown;

  return (
    <div className={`rounded-lg border-2 p-6 ${c.bg} ${c.border} ${c.text} flex items-center gap-4`}>
      {c.icon}
      <div>
        <h2 className="text-2xl font-bold capitalize">{overall}</h2>
        <p className="text-sm opacity-80">Health Score: {score}%</p>
      </div>
    </div>
  );
}

function CheckCard({ check }: { check: HealthCheck }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <StatusBadge status={check.status} />
        <span className="font-medium text-sm truncate">{check.check_name}</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
        <span className="tabular-nums">{check.response_time_ms}ms</span>
        {check.details?.http_status && (
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
            HTTP {String(check.details.http_status)}
          </span>
        )}
      </div>
    </div>
  );
}

function CheckGroup({ title, icon, checks }: { title: string; icon: React.ReactNode; checks: HealthCheck[] }) {
  if (checks.length === 0) return null;
  const passed = checks.filter(c => c.status === 'pass').length;
  const avgTime = Math.round(checks.reduce((sum, c) => sum + c.response_time_ms, 0) / checks.length);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
            <span>{passed}/{checks.length} passing</span>
            <span>·</span>
            <span>avg {avgTime}ms</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.map((check) => (
          <CheckCard key={`${check.check_type}-${check.check_name}`} check={check} />
        ))}
      </CardContent>
    </Card>
  );
}

function HistoryTimeline({ history }: { history: HealthCheck[] }) {
  // Group by checked_at timestamp (each batch = one monitor run)
  const batches = new Map<string, HealthCheck[]>();
  for (const check of history) {
    const key = check.checked_at;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key)!.push(check);
  }

  const batchEntries = Array.from(batches.entries()).slice(0, 20);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4" /> Check History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {batchEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history data available. Run the site monitor to populate.</p>
        ) : (
          <div className="space-y-3">
            {batchEntries.map(([timestamp, checks]) => {
              const passed = checks.filter(c => c.status === 'pass').length;
              const failed = checks.filter(c => c.status === 'fail').length;
              const warned = checks.filter(c => c.status === 'warn').length;
              const score = Math.round((passed / checks.length) * 100);
              const statusColor = failed > 0 ? 'text-red-500' : warned > 0 ? 'text-yellow-500' : 'text-green-500';

              return (
                <div key={timestamp} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${failed > 0 ? 'bg-red-500' : warned > 0 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div>
                      <span className="text-sm font-medium">
                        {format(new Date(timestamp), 'MMM d, h:mm a')}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={statusColor}>{score}%</span>
                    <span className="text-muted-foreground">
                      {checks.length} checks
                    </span>
                    {failed > 0 && <span className="text-red-500">{failed} failed</span>}
                    {warned > 0 && <span className="text-yellow-500">{warned} warnings</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SiteHealth() {
  const { checksByType, history, summary, loading, error, triggerCheck, refresh } = useSiteHealth();
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCheck = async () => {
    setIsRunning(true);
    try {
      await triggerCheck();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Site Health Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Automated health checks for pages, APIs, database, and security
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleRunCheck} disabled={isRunning}>
            <Zap className={`w-4 h-4 mr-2 ${isRunning ? 'animate-pulse' : ''}`} />
            {isRunning ? 'Running...' : 'Run Health Check'}
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Overall status */}
      <OverallStatusBanner overall={summary.overall} score={summary.score} />

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Checks</p>
                <p className="text-2xl font-bold">{summary.totalChecks}</p>
              </div>
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Passing</p>
                <p className="text-2xl font-bold text-green-600">{summary.passed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.warnings}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failures</p>
                <p className="text-2xl font-bold text-red-600">{summary.failures}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last checked */}
      {summary.lastChecked && (
        <p className="text-xs text-muted-foreground">
          Last checked: {format(new Date(summary.lastChecked), 'PPpp')} ({formatDistanceToNow(new Date(summary.lastChecked), { addSuffix: true })})
        </p>
      )}

      {/* Detailed checks by category */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Checks</TabsTrigger>
          <TabsTrigger value="pages">Pages ({checksByType.page.length})</TabsTrigger>
          <TabsTrigger value="functions">Edge Functions ({checksByType.edge_function.length})</TabsTrigger>
          <TabsTrigger value="database">Database ({checksByType.database.length})</TabsTrigger>
          <TabsTrigger value="security">Security ({checksByType.ssl.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <CheckGroup title="Frontend Pages" icon={<Globe className="w-4 h-4" />} checks={checksByType.page} />
          <CheckGroup title="Edge Functions" icon={<Server className="w-4 h-4" />} checks={checksByType.edge_function} />
          <CheckGroup title="Database" icon={<Database className="w-4 h-4" />} checks={checksByType.database} />
          <CheckGroup title="Security" icon={<Shield className="w-4 h-4" />} checks={checksByType.ssl} />

          {summary.totalChecks === 0 && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Health Data Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Run the site monitor edge function to perform the first health check.
                </p>
                <Button onClick={handleRunCheck} disabled={isRunning}>
                  <Zap className="w-4 h-4 mr-2" />
                  Run First Check
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pages">
          <CheckGroup title="Frontend Pages" icon={<Globe className="w-4 h-4" />} checks={checksByType.page} />
        </TabsContent>

        <TabsContent value="functions">
          <CheckGroup title="Edge Functions" icon={<Server className="w-4 h-4" />} checks={checksByType.edge_function} />
        </TabsContent>

        <TabsContent value="database">
          <CheckGroup title="Database" icon={<Database className="w-4 h-4" />} checks={checksByType.database} />
        </TabsContent>

        <TabsContent value="security">
          <CheckGroup title="Security" icon={<Shield className="w-4 h-4" />} checks={checksByType.ssl} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTimeline history={history} />
        </TabsContent>
      </Tabs>

      {/* CI/CD info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" /> Automated Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Health checks run automatically via GitHub Actions every 6 hours and on every PR to main.
            The site-monitor edge function can also be triggered manually from this dashboard.
          </p>
          <div className="flex gap-4 mt-3">
            <a
              href="https://github.com/chriscultiva/Thynk_compliance_platform/actions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View GitHub Actions →
            </a>
            <a
              href="https://github.com/chriscultiva/Thynk_compliance_platform/actions/workflows/site-health-monitor.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Monitor Workflow →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
