import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Database, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DatabaseOptimization() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('optimization_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-database-performance');
      
      if (error) throw error;

      toast({
        title: 'Analysis Complete',
        description: 'Database performance analysis completed successfully.',
      });

      loadReports();
    } catch (error: any) {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const latestReport = reports[0];

  if (loading) {
    return <div className="p-8">Loading optimization data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Database Optimization</h2>
        <Button onClick={runAnalysis} disabled={analyzing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {latestReport && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Indexes</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{latestReport.summary?.total_indexes || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unused Indexes</CardTitle>
                <Trash2 className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {latestReport.summary?.unused_indexes || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {latestReport.summary?.new_recommendations || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {latestReport.recommendations?.new_indexes?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Recommended New Indexes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestReport.recommendations.new_indexes.map((rec: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-yellow-500 pl-4 py-2">
                    <div className="font-semibold">{rec.table_name}</div>
                    <div className="text-sm text-muted-foreground">{rec.reason}</div>
                    <Badge variant="outline" className="mt-1">
                      Benefit: {rec.estimated_benefit}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {latestReport.recommendations?.unused_indexes?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Unused Indexes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestReport.recommendations.unused_indexes.map((idx: any, i: number) => (
                  <div key={i} className="border-l-4 border-red-500 pl-4 py-2">
                    <div className="font-semibold">{idx.index_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Table: {idx.table_name} | Size: {idx.size_mb} MB
                    </div>
                    <code className="text-xs bg-gray-100 p-2 block mt-2 rounded">
                      {idx.recommendation}
                    </code>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
