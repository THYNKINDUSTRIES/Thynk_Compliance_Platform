import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';

interface ProgressRecord {
  id: string;
  source_name: string;
  status: string;
  records_fetched: number;
  total_estimated: number;
  current_page: number;
  total_pages: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

interface Props {
  sessionId: string;
  onComplete?: () => void;
}

export function DataPopulationProgress({ sessionId, onComplete }: Props) {
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchProgress();
    const interval = setInterval(fetchProgress, 2000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchProgress = async () => {
    const { data } = await supabase
      .from('data_population_progress')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at');

    if (data) {
      setProgress(data);

      const allComplete = data.every(r => r.status === 'completed' || r.status === 'error');

      // Call onComplete only on transition to complete
      if (allComplete && onComplete) {
        if (progress.length === 0 || !progress.every(r => r.status === 'completed' || r.status === 'error')) {
          onComplete();
        }
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'running': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  // ← NEW: Safe totals + overall progress (using current progress state)
  const totalFetched = progress.reduce((sum, p) => sum + (p.records_fetched || 0), 0);
  const totalEstimated = progress.reduce((sum, p) => sum + (p.total_estimated || 1), 0); // || 1 avoids divide-by-zero
  const overallProgress = totalEstimated > 0 ? Math.round((totalFetched / totalEstimated) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Population Progress</CardTitle>
        <div className="text-lg font-medium mt-3">
          {totalFetched} / {totalEstimated} regulations fetched ({overallProgress}%)
        </div>
        <Progress value={overallProgress} className="mt-3 h-4" />
        <div className="text-sm text-muted-foreground mt-2">
          Across all sources
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress.map((record) => (
          <div key={record.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(record.status)}
                <span className="font-medium">{record.source_name}</span>
                <Badge variant={record.status === 'completed' ? 'default' : 'secondary'}>
                  {record.status}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {record.records_fetched} / {record.total_estimated}
              </span>
            </div>
            <Progress 
              value={record.total_estimated > 0 
                ? (record.records_fetched / record.total_estimated) * 100 
                : 0} 
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}