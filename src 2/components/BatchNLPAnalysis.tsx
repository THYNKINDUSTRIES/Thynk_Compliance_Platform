import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Regulation } from '@/hooks/useRegulations';

interface Props {
  regulations: Regulation[];
  onComplete?: () => void;
}

interface AnalysisResult {
  id: string;
  title: string;
  status: 'pending' | 'analyzing' | 'success' | 'error';
  entitiesExtracted?: number;
  error?: string;
}

export const BatchNLPAnalysis: React.FC<Props> = ({ regulations, onComplete }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  const unanalyzedDocs = regulations.filter(r => !r.nlp_analyzed);

  const runBatchAnalysis = async () => {
    if (unanalyzedDocs.length === 0) {
      toast({
        title: 'No Documents to Analyze',
        description: 'All documents have already been analyzed',
      });
      return;
    }

    setAnalyzing(true);
    const initialResults: AnalysisResult[] = unanalyzedDocs.map(r => ({
      id: r.id,
      title: r.title,
      status: 'pending'
    }));
    setResults(initialResults);

    for (let i = 0; i < unanalyzedDocs.length; i++) {
      const doc = unanalyzedDocs[i];
      setCurrentIndex(i);

      // Update status to analyzing
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'analyzing' } : r
      ));

      try {
        const { data, error } = await supabase.functions.invoke('nlp-analyzer', {
          body: {
            instrumentId: doc.id,
            title: doc.title,
            description: doc.summary,
            fullText: doc.summary
          }
        });

        if (error) {
          console.error('NLP Error for', doc.title, ':', error);
          throw error;
        }

        if (!data || !data.success) {
          throw new Error(data?.error || 'Analysis failed');
        }

        setResults(prev => prev.map((r, idx) => 
          idx === i ? { 
            ...r, 
            status: 'success',
            entitiesExtracted: data.entitiesExtracted || 0
          } : r
        ));

      } catch (error: any) {
        setResults(prev => prev.map((r, idx) => 
          idx === i ? { 
            ...r, 
            status: 'error',
            error: error.message 
          } : r
        ));
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }


    setAnalyzing(false);
    setCurrentIndex(0);
    
    // Count successes after all processing is complete
    const finalResults = await new Promise<AnalysisResult[]>(resolve => {
      setResults(prev => {
        resolve(prev);
        return prev;
      });
    });
    
    const successCount = finalResults.filter(r => r.status === 'success').length;
    toast({
      title: 'Batch Analysis Complete',
      description: `Successfully analyzed ${successCount} of ${unanalyzedDocs.length} documents`,
    });

    if (onComplete) onComplete();
  };


  const progress = unanalyzedDocs.length > 0 
    ? ((currentIndex + 1) / unanalyzedDocs.length) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Batch NLP Analysis
        </CardTitle>
        <CardDescription>
          Analyze multiple documents at once to extract entities and compliance information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {unanalyzedDocs.length} documents pending analysis
          </span>
          {analyzing && (
            <Badge variant="secondary">
              Processing {currentIndex + 1} of {unanalyzedDocs.length}
            </Badge>
          )}
        </div>

        {analyzing && (
          <Progress value={progress} className="h-2" />
        )}

        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
            {results.map((result) => (
              <div key={result.id} className="flex items-center gap-2 text-sm">
                {result.status === 'pending' && (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                {result.status === 'analyzing' && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                )}
                {result.status === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                {result.status === 'error' && (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="flex-1 truncate">{result.title}</span>
                {result.entitiesExtracted && (
                  <Badge variant="outline" className="text-xs">
                    {result.entitiesExtracted} entities
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        <Button 
          onClick={runBatchAnalysis} 
          disabled={analyzing || unanalyzedDocs.length === 0}
          className="w-full"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing {currentIndex + 1} of {unanalyzedDocs.length}...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze {unanalyzedDocs.length} Documents
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
