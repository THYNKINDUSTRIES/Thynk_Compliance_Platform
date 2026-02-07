import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Loader2, Database, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataPopulationProgress } from './DataPopulationProgress';

export function DataPopulationTrigger() {
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTrigger = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-all-pollers', {
        body: {}
      });
      if (error) throw error;
      if (data?.sessionId) {
        setSessionId(data.sessionId);
        toast({
          title: 'Data Population Started',
          description: 'Fetching regulations from all sources. This may take several minutes.',
        });
      }
    } catch (error: any) {
      console.error('Error triggering pollers:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start data population',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toastFiredRef = useRef(false);

  const handleComplete = () => {
    if (toastFiredRef.current) return;
    toastFiredRef.current = true;

    toast({
      title: 'Data Population Complete',
      description: 'All regulations have been successfully imported.',
      duration: 5000,
    });
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Comprehensive Data Population
          </CardTitle>
          <CardDescription>
            Fetch regulations from Federal Register, Regulations.gov, and State sources (2019-present)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will fetch approximately 8,000+ regulations. The process may take 10-15 minutes.
            </AlertDescription>
          </Alert>
          <Button onClick={handleTrigger} disabled={loading || !!sessionId} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              'Start Comprehensive Data Population'
            )}
          </Button>
        </CardContent>
      </Card>
      {sessionId && (
        <DataPopulationProgress sessionId={sessionId} onComplete={handleComplete} />
      )}
    </div>
  );
}