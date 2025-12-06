import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APIMetricsCard } from '@/components/APIMetricsCard';
import { APIAlertList } from '@/components/APIAlertList';
import SchedulerMonitoring from '@/components/SchedulerMonitoring';
import { useAPIMetrics } from '@/hooks/useAPIMetrics';
import { supabase } from '@/lib/supabase';
import { Activity, AlertTriangle, Clock, TrendingUp, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function APIMonitoring() {
  const [timeRange, setTimeRange] = useState(24);
  const { summary, functionMetrics, hourlyVolume, loading } = useAPIMetrics(timeRange);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchAlerts();
    const channel = supabase
      .channel('api-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'api_alerts' }, fetchAlerts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('api_alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setAlerts(data);
  };

  const handleResolveAlert = async (alertId: string) => {
    await supabase
      .from('api_alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId);
    fetchAlerts();
  };

  if (loading) {
    return <div className="p-8">Loading metrics...</div>;
  }

  const chartData = hourlyVolume.map(h => ({
    time: format(new Date(h.hour), 'HH:mm'),
    requests: h.request_count,
    success: h.success_count,
    errors: h.error_count
  })).reverse();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">API Monitoring & Scheduler</h1>
        <Tabs value={timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v))}>
          <TabsList>
            <TabsTrigger value="1">1h</TabsTrigger>
            <TabsTrigger value="24">24h</TabsTrigger>
            <TabsTrigger value="168">7d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs defaultValue="scheduler" className="space-y-6">
        <TabsList>
          <TabsTrigger value="scheduler">Automated Scheduler</TabsTrigger>
          <TabsTrigger value="metrics">API Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduler" className="space-y-6">
          <SchedulerMonitoring />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <APIMetricsCard
              title="Total Requests"
              value={summary?.total_requests || 0}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <APIMetricsCard
              title="Success Rate"
              value={`${summary?.success_rate || 0}%`}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
            <APIMetricsCard
              title="Avg Response Time"
              value={`${summary?.avg_response_time || 0}ms`}
              icon={<Zap className="h-4 w-4 text-muted-foreground" />}
            />
            <APIMetricsCard
              title="Errors"
              value={summary?.error_count || 0}
              icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
            />
            <APIMetricsCard
              title="Slow Queries"
              value={summary?.slow_query_count || 0}
              subtitle=">2s response"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="requests" stroke="#8884d8" name="Total" />
                    <Line type="monotone" dataKey="success" stroke="#82ca9d" name="Success" />
                    <Line type="monotone" dataKey="errors" stroke="#ff6b6b" name="Errors" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Function Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={functionMetrics.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="function_name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avg_response_time" fill="#8884d8" name="Avg Response (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <APIAlertList alerts={alerts} onResolve={handleResolveAlert} />
        </TabsContent>
      </Tabs>
    </div>
  );
}