import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Database, RefreshCw, Zap, CheckCircle, XCircle } from 'lucide-react';

const POLLERS = [
  { name: 'federal-register-poller', label: 'Federal Register', category: 'Federal' },
  { name: 'congress-poller', label: 'Congress Bills', category: 'Federal' },
  { name: 'caselaw-poller', label: 'Case Law', category: 'Federal' },
  { name: 'state-legislature-poller', label: 'State Legislature', category: 'State' },
  { name: 'state-regulations-poller', label: 'State Regulations', category: 'State' },
  { name: 'cannabis-hemp-poller', label: 'Cannabis/Hemp (All States)', category: 'State' },
  { name: 'kratom-poller', label: 'Kratom', category: 'Substance' },
  { name: 'kava-poller', label: 'Kava', category: 'Substance' },
];

export function DataIngestionTester() {
  const [loading, setLoading] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [stats, setStats] = useState<any>(null);
  const { toast } = useToast();

  const triggerPoller = async (name: string, displayName: string) => {
    setLoading(name);
    try {
      const { data, error } = await supabase.functions.invoke(name, {
        body: { triggered: true, timestamp: new Date().toISOString() }
      });
      if (error) throw error;
      
      const msg = `${data?.recordsProcessed || data?.records_created || 0} records processed`;
      setResults(prev => ({ ...prev, [name]: { success: true, message: msg } }));
      toast({ title: 'Success', description: `${displayName}: ${msg}` });
    } catch (error: any) {
      setResults(prev => ({ ...prev, [name]: { success: false, message: error.message } }));
      toast({ title: 'Error', description: `${displayName}: ${error.message}`, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const runAllPollers = async () => {
    setRunningAll(true);
    setResults({});
    for (const poller of POLLERS) {
      await triggerPoller(poller.name, poller.label);
    }
    setRunningAll(false);
    await loadStats();
    toast({ title: 'Complete', description: 'All pollers have been triggered' });
  };

  const loadStats = async () => {
    const { data, error } = await supabase
      .from('instrument')
      .select('source, jurisdiction_id', { count: 'exact' });
    
    if (!error && data) {
      const bySource = data.reduce((acc: any, item) => {
        acc[item.source || 'unknown'] = (acc[item.source || 'unknown'] || 0) + 1;
        return acc;
      }, {});
      setStats({ total: data.length, bySource });
    }
  };

  const categories = ['Federal', 'State', 'Substance'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Comprehensive Data Poller
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={loadStats} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Stats
            </Button>
            <Button 
              onClick={runAllPollers} 
              disabled={runningAll || loading !== null}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              {runningAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Run All Pollers
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map(cat => (
          <div key={cat}>
            <h4 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-3">{cat} Pollers</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {POLLERS.filter(p => p.category === cat).map(poller => (
                <div key={poller.name} className="flex items-center gap-2">
                  <Button
                    onClick={() => triggerPoller(poller.name, poller.label)}
                    disabled={loading !== null || runningAll}
                    variant="outline"
                    className="flex-1 justify-start"
                    size="sm"
                  >
                    {loading === poller.name ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    {poller.label}
                  </Button>
                  {results[poller.name] && (
                    results[poller.name].success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Results log */}
        {Object.keys(results).length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <h4 className="font-semibold mb-2">Results</h4>
            {Object.entries(results).map(([name, r]) => (
              <div key={name} className="flex justify-between items-center text-sm">
                <span className={r.success ? 'text-green-700' : 'text-red-700'}>
                  {POLLERS.find(p => p.name === name)?.label || name}
                </span>
                <Badge variant={r.success ? 'default' : 'destructive'}>{r.message}</Badge>
              </div>
            ))}
          </div>
        )}

        {stats && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Database Statistics</h4>
            <p className="text-sm mb-2">Total Regulations: <Badge>{stats.total}</Badge></p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(stats.bySource)
                .sort(([, a]: any, [, b]: any) => b - a)
                .map(([source, count]: [string, any]) => (
                  <div key={source} className="flex justify-between text-sm">
                    <span className="capitalize">{source.replace(/_/g, ' ')}</span>
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
