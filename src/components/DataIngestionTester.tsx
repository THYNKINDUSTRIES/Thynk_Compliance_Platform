import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Database, RefreshCw } from 'lucide-react';

export function DataIngestionTester() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const triggerPoller = async (name: string, displayName: string) => {
    setLoading(name);
    try {
      const { data, error } = await supabase.functions.invoke(name);
      if (error) throw error;
      
      toast({ 
        title: 'Success', 
        description: `${displayName} completed: ${data.recordsProcessed || 0} records processed` 
      });
      setResults({ ...results, [name]: data });
      await loadStats();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('instrument')
      .select('source, jurisdiction_id', { count: 'exact' });
    
    if (!error && data) {
      const bySource = data.reduce((acc: any, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      }, {});
      setStats({ total: data.length, bySource });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Ingestion Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={() => triggerPoller('federal-register-poller', 'Federal Register')}
            disabled={loading !== null}
            variant="outline"
          >
            {loading === 'federal-register-poller' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Trigger Federal Register
          </Button>

          <Button
            onClick={() => triggerPoller('regulations-gov-poller', 'Regulations.gov')}
            disabled={loading !== null}
            variant="outline"
          >
            {loading === 'regulations-gov-poller' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Trigger Regulations.gov
          </Button>
        </div>

        <Button onClick={loadStats} variant="secondary" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Statistics
        </Button>

        {stats && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Database Statistics</h4>
            <p className="text-sm mb-2">Total Regulations: <Badge>{stats.total}</Badge></p>
            <div className="space-y-1">
              {Object.entries(stats.bySource).map(([source, count]: [string, any]) => (
                <div key={source} className="flex justify-between text-sm">
                  <span className="capitalize">{source.replace('_', ' ')}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
