import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';

interface Props {
  instrumentId: string;
  title: string;
  description?: string;
  fullText?: string;
  onAnalysisComplete?: () => void;
}

export const NLPAnalysisPanel: React.FC<Props> = ({ 
  instrumentId, 
  title, 
  description, 
  fullText,
  onAnalysisComplete 
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const runAnalysis = async () => {
    setAnalyzing(true);
    setProgress(10);
    setResult(null);

    try {
      setProgress(30);
      
      const { data, error } = await supabase.functions.invoke('nlp-analyzer', {
        body: {
          instrumentId,
          title,
          description,
          fullText
        }
      });

      setProgress(90);

      if (error) throw error;

      setProgress(100);
      setResult(data);
      
      toast({
        title: 'Analysis Complete',
        description: `Extracted ${data.entitiesExtracted} entities with ${data.avgConfidence}% avg confidence`,
      });

      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze document',
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI-Powered Entity Extraction
        </CardTitle>
        <CardDescription>
          Extract key entities, dates, requirements, and compliance information using advanced NLP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {analyzing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing document with GPT-4o...
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {result && (
          <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 font-medium">
              <CheckCircle2 className="w-5 h-5" />
              Analysis Successful
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Entities Extracted:</span>
                <span className="ml-2 font-semibold">{result.entitiesExtracted}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg Confidence:</span>
                <span className="ml-2 font-semibold">{result.avgConfidence}%</span>
              </div>
            </div>
            {result.entityBreakdown && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {Object.entries(result.entityBreakdown).map(([type, count]: [string, any]) => 
                  count > 0 && (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}: {count}
                    </Badge>
                  )
                )}
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={runAnalysis} 
          disabled={analyzing}
          className="w-full"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Run NLP Analysis
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Uses GPT-4o to extract products, dates, requirements, penalties, agencies, citations, definitions, and exemptions
        </p>
      </CardContent>
    </Card>
  );
};
