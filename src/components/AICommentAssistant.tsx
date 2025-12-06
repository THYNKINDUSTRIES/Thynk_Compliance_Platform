import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, TrendingUp, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AICommentAssistantProps {
  regulationTitle: string;
  regulationText: string;
  agencyName: string;
  commentDraft: string;
  onApplySuggestion?: (suggestion: string) => void;
}

export default function AICommentAssistant({
  regulationTitle,
  regulationText,
  agencyName,
  commentDraft,
  onApplySuggestion
}: AICommentAssistantProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const analyzeComment = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-comment-draft', {
        body: {
          regulationText,
          commentDraft,
          regulationTitle,
          agencyName
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setAnalysis(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "AI has analyzed your comment and provided suggestions."
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getToneBadgeColor = (tone: string) => {
    const colors: Record<string, string> = {
      professional: 'bg-blue-100 text-blue-800',
      technical: 'bg-purple-100 text-purple-800',
      advocacy: 'bg-orange-100 text-orange-800'
    };
    return colors[tone] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={analyzeComment}
        disabled={analyzing || !commentDraft}
        className="w-full"
      >
        {analyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Get AI Suggestions
          </>
        )}
      </Button>

      {analysis && (
        <div className="space-y-4">
          {/* Quality Scores */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Quality Assessment
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(analysis.qualityScore)}`}>
                  {analysis.qualityScore}/100
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Persuasiveness</p>
                <p className={`text-2xl font-bold ${getScoreColor(analysis.persuasivenessScore)}`}>
                  {analysis.persuasivenessScore}/100
                </p>
              </div>
            </div>
          </Card>

          {/* Tone Analysis */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Tone Analysis</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={getToneBadgeColor(analysis.toneAnalysis.detectedTone)}>
                  {analysis.toneAnalysis.detectedTone}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Score: {analysis.toneAnalysis.toneScore}/100
                </span>
              </div>
              <p className="text-sm">{analysis.toneAnalysis.recommendation}</p>
            </div>
          </Card>

          {/* Length Recommendation */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Length Guidance</h3>
            <p className="text-sm mb-1">
              Current: <strong>{analysis.lengthRecommendation.currentLength} words</strong>
            </p>
            <p className="text-sm mb-1">
              Recommended: <strong>{analysis.lengthRecommendation.recommendedRange} words</strong>
            </p>
            <p className="text-sm text-muted-foreground">{analysis.lengthRecommendation.guidance}</p>
          </Card>

          {/* Strengths */}
          {analysis.strengths?.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                Strengths
              </h3>
              <ul className="space-y-1">
                {analysis.strengths.map((strength: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <CheckCircle className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Improvements */}
          {analysis.improvements?.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-4 w-4" />
                Suggested Improvements
              </h3>
              <div className="space-y-3">
                {analysis.improvements.map((improvement: any, idx: number) => (
                  <div key={idx} className="border-l-2 border-orange-300 pl-3">
                    <p className="text-sm font-medium">{improvement.issue}</p>
                    <p className="text-sm text-muted-foreground">{improvement.suggestion}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Talking Points */}
          {analysis.talkingPoints?.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Suggested Talking Points
              </h3>
              <ul className="space-y-2">
                {analysis.talkingPoints.map((point: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="font-semibold text-primary flex-shrink-0">{idx + 1}.</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Key Issues */}
          {analysis.keyIssues?.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Key Issues to Address</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.keyIssues.map((issue: string, idx: number) => (
                  <Badge key={idx} variant="outline">{issue}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Overall Feedback */}
          {analysis.overallFeedback && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-2">Overall Feedback</h3>
              <p className="text-sm">{analysis.overallFeedback}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}