import React, { useState } from 'react';
import { Regulation } from '@/hooks/useRegulations';
import { ExtractedEntities } from './ExtractedEntities';
import { WorkflowTriggerButton } from './WorkflowTriggerButton';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';


interface Props {
  regulation: Regulation | null;
  onClose: () => void;
  onAnalyzed?: () => void;
}

export const RegulationModalNew: React.FC<Props> = ({ regulation, onClose, onAnalyzed }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  if (!regulation) return null;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('nlp-analyzer', {
        body: {
          instrumentId: regulation.id,
          title: regulation.title,
          description: regulation.summary,
          fullText: regulation.summary
        }
      });

      if (error) throw error;

      toast({
        title: "Analysis Complete",
        description: `Extracted ${data.entitiesExtracted} entities from the document.`
      });

      if (onAnalyzed) onAnalyzed();
    } catch (err: any) {
      toast({
        title: "Analysis Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{regulation.title}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{regulation.jurisdiction}</span>
                <span>•</span>
                <span>{regulation.authority}</span>
                <span>•</span>
                <Badge variant="outline">{regulation.instrument_type}</Badge>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-gray-700">{regulation.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Key Dates</h3>
              <div className="space-y-1 text-sm">
                <div><span className="text-gray-600">Published:</span> {new Date(regulation.published_at).toLocaleDateString()}</div>
                {regulation.effective_at && (
                  <div><span className="text-gray-600">Effective:</span> {new Date(regulation.effective_at).toLocaleDateString()}</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {regulation.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>

          {regulation.nlp_analyzed && regulation.extracted_entities && regulation.extracted_entities.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">AI-Extracted Information</h3>
                <Badge variant="outline" className="text-xs">
                  Analyzed {new Date(regulation.nlp_analyzed_at!).toLocaleDateString()}
                </Badge>
              </div>
              <ExtractedEntities entities={regulation.extracted_entities} />
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button asChild>
              <a href={regulation.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Source
              </a>
            </Button>
            <WorkflowTriggerButton 
              instrumentId={regulation.id} 
              instrumentTitle={regulation.title}
            />
            {!regulation.nlp_analyzed && (
              <Button onClick={handleAnalyze} disabled={analyzing} variant="outline">
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
