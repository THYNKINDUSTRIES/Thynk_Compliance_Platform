import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HealthCheck {
  function_name: string;
  status: string;
  response_time_ms: number;
  last_checked_at: string;
  error_message?: string;
}

export default function FunctionHealthMonitor() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealthChecks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('function_health_checks')
      .select('*')
      .order('last_checked_at', { ascending: false });
    
    if (data) {
      const uniqueFunctions = data.reduce((acc: HealthCheck[], curr) => {
        if (!acc.find(h => h.function_name === curr.function_name)) {
          acc.push(curr as HealthCheck);
        }
        return acc;
      }, []);
      setHealthChecks(uniqueFunctions);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHealthChecks();
    const interval = setInterval(fetchHealthChecks, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'unhealthy': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Function Health Status
        </h3>
        <Button size="sm" variant="outline" onClick={fetchHealthChecks} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-3">
        {healthChecks.map((check) => (
          <div key={check.function_name} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(check.status)}
              <div>
                <p className="font-medium">{check.function_name}</p>
                <p className="text-xs text-gray-500">
                  Last checked: {new Date(check.last_checked_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={check.status === 'healthy' ? 'default' : 'destructive'}>
                {check.status}
              </Badge>
              {check.response_time_ms && (
                <p className="text-xs text-gray-500 mt-1">{check.response_time_ms}ms</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
