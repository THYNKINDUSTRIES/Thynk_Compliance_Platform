import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Loader2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PopulateURLsButton() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handlePopulateURLs = async () => {
    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('populate-regulation-urls');

      if (error) throw error;

      setResults(data);
      toast({
        title: 'URL Population Complete',
        description: `Updated ${data.updated} regulations out of ${data.total} processed.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to populate URLs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Populate Missing URLs
        </CardTitle>
        <CardDescription>
          Fetch official document links from Federal Register and Regulations.gov APIs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handlePopulateURLs} 
          disabled={loading}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Populating URLs...' : 'Populate Missing URLs'}
        </Button>

        {results && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Processed:</span>
              <span className="text-sm">{results.total}</span>
            </div>
            <div className="flex items-center justify-between text-green-600">
              <span className="text-sm font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> Updated:
              </span>
              <span className="text-sm font-semibold">{results.updated}</span>
            </div>
            <div className="flex items-center justify-between text-red-600">
              <span className="text-sm font-medium flex items-center gap-1">
                <XCircle className="h-4 w-4" /> Failed:
              </span>
              <span className="text-sm font-semibold">{results.failed}</span>
            </div>
            {results.errors?.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto">
                <p className="text-xs font-medium mb-1">Errors:</p>
                {results.errors.slice(0, 5).map((err: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}