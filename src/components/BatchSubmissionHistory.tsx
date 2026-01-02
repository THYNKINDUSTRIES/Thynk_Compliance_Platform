import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Clock, FileText, Download } from 'lucide-react';

export function BatchSubmissionHistory() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    const { data } = await supabase
      .from('batch_comment_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setBatches(data);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const exportReport = (batch: any) => {
    const report = `
Batch Submission Report
Name: ${batch.batch_name}
Date: ${new Date(batch.created_at).toLocaleString()}
Status: ${batch.status}
Total Regulations: ${batch.total_regulations}
Successful: ${batch.successful_submissions}
Failed: ${batch.failed_submissions}
Success Rate: ${((batch.successful_submissions / batch.total_regulations) * 100).toFixed(1)}%
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-report-${batch.id}.txt`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Submission History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {batches.map(batch => (
            <div key={batch.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{batch.batch_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(batch.created_at).toLocaleDateString()}
                  </p>
                </div>
                {getStatusBadge(batch.status)}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{batch.total_regulations} total</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{batch.successful_submissions} success</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span>{batch.failed_submissions} failed</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport(batch)}
                className="mt-3"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
