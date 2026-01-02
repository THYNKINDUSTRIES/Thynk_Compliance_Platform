import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, AlertTriangle, Play, Trash2 } from 'lucide-react';

export function DataValidationMonitor() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('check_data_quality');
      if (error) throw error;
      setResults(data || []);
    } catch (err: any) {
      console.error('Validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('cleanup_old_data');
      if (error) throw error;
      alert('Cleanup completed successfully');
    } catch (err: any) {
      console.error('Cleanup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Validation & Quality</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runValidation} disabled={loading}>
            <Play className="w-4 h-4 mr-2" />
            Run Validation
          </Button>
          <Button onClick={runCleanup} variant="outline" disabled={loading}>
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup Old Data
          </Button>
        </div>
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  {r.status === 'PASS' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {r.status === 'FAIL' && <XCircle className="w-5 h-5 text-red-600" />}
                  {r.status === 'WARN' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                  <span className="font-medium">{r.check_name}</span>
                </div>
                <Badge variant={r.status === 'PASS' ? 'default' : 'destructive'}>{r.details}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
