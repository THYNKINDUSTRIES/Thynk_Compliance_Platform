import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';

export function URLValidationMonitor() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentLogs();
  }, []);

  const loadRecentLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('url_validation_log')
        .select(`
          *,
          instrument:instrument_id (
            title,
            jurisdiction:jurisdiction_id (name)
          )
        `)
        .eq('is_valid', false)
        .order('checked_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerValidation = async () => {
    setIsValidating(true);
    setValidationResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('validate-regulation-urls');

      if (error) throw error;

      setValidationResults(data.results);
      await loadRecentLogs();
    } catch (error: any) {
      console.error('Validation error:', error);
      setValidationResults({
        error: error.message || 'Failed to validate URLs'
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>URL Validation System</CardTitle>
          <CardDescription>
            Automatically validates all regulation URLs weekly. Manually trigger validation or view recent results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={triggerValidation} 
            disabled={isValidating}
            className="w-full sm:w-auto"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating URLs...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Validate All URLs Now
              </>
            )}
          </Button>

          {validationResults && (
            <Alert className={validationResults.error ? 'border-red-500' : 'border-green-500'}>
              <AlertDescription>
                {validationResults.error ? (
                  <div className="text-red-600">{validationResults.error}</div>
                ) : (
                  <div className="space-y-2">
                    <div className="font-semibold">Validation Complete</div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total</div>
                        <div className="text-lg font-bold">{validationResults.total}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Valid</div>
                        <div className="text-lg font-bold text-green-600">{validationResults.valid}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Broken</div>
                        <div className="text-lg font-bold text-red-600">{validationResults.invalid}</div>
                      </div>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Broken Links</CardTitle>
          <CardDescription>
            URLs that failed validation in recent checks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No broken links found!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {log.instrument?.title || 'Unknown Regulation'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.instrument?.jurisdiction?.name || 'Unknown Jurisdiction'}
                      </div>
                    </div>
                    <Badge variant="destructive" className="shrink-0">
                      <XCircle className="h-3 w-3 mr-1" />
                      {log.status_code || 'Error'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm">
                    <a 
                      href={log.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 break-all"
                    >
                      {log.url}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>

                  {log.error_message && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {log.error_message}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Checked: {new Date(log.checked_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
