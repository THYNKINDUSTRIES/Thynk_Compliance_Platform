import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Calendar, ExternalLink, MessageSquare, AlertCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PublicCommentEditor } from './PublicCommentEditor';

interface OpenComment {
  id: string;
  title: string;
  description: string;
  url: string;
  metadata: any;
  effective_date: string;
}

// Keywords that indicate relevance to our industry
const RELEVANT_KEYWORDS = [
  'cannabis', 'marijuana', 'hemp', 'cbd', 'thc', 'cannabinoid', 'cannabidiol',
  'dispensary', 'cultivation', 'medical marijuana', 'recreational marijuana',
  'kratom', 'mitragyna', 'nicotine', 'tobacco', 'vaping', 'vape', 'e-cigarette',
  'psychedelic', 'psilocybin', 'ketamine', 'mdma', 'controlled substance',
  'schedule i', 'schedule ii', 'schedule iii', 'drug enforcement', 'dea',
  'fda', 'food and drug', 'dietary supplement', 'alternative wellness'
];

// Check if a regulation is relevant to our industry
function isRelevantRegulation(title: string, description: string, agencyId?: string): boolean {
  const text = `${title} ${description} ${agencyId || ''}`.toLowerCase();
  
  // Check for relevant keywords
  return RELEVANT_KEYWORDS.some(keyword => text.includes(keyword));
}

export function OpenCommentPeriods() {
  const [regulations, setRegulations] = useState<OpenComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReg, setSelectedReg] = useState<OpenComment | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

  useEffect(() => {
    loadOpenComments();
  }, []);

  const loadOpenComments = async () => {
    try {
      setError(null);
      // Try regulations_gov source first, fall back to any source with comment metadata
      const { data, error: queryError } = await supabase
        .from('instrument')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (queryError) throw queryError;

      // Filter for relevant regulations with open comment periods
      const today = new Date();
      const filtered = (data || []).filter((reg: OpenComment) => {
        // Check multiple places for comment end date
        const commentEnd = reg.metadata?.commentEndDate 
          || reg.metadata?.comment_end_date
          || reg.metadata?.attributes?.commentEndDate;
        if (!commentEnd) return false;
        
        try {
          const endDate = new Date(commentEnd);
          if (endDate < today) return false;
        } catch {
          return false;
        }

        // Filter for relevance to cannabis, hemp, kratom, etc.
        const agencyId = reg.metadata?.attributes?.agencyId || '';
        return isRelevantRegulation(reg.title || '', reg.description || '', agencyId);
      }).sort((a, b) => {
        const getCommentEnd = (r: OpenComment) => r.metadata?.commentEndDate || r.metadata?.comment_end_date || r.metadata?.attributes?.commentEndDate || 0;
        const dateA = new Date(getCommentEnd(a));
        const dateB = new Date(getCommentEnd(b));
        return dateA.getTime() - dateB.getTime();
      }).slice(0, 50);

      setRegulations(filtered);
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to load open comment periods';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Error loading comment periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  // Get a badge color based on the regulation type
  const getAgencyBadgeColor = (agencyId: string): string => {
    const agency = agencyId.toUpperCase();
    if (agency.includes('FDA')) return 'bg-blue-600';
    if (agency.includes('DEA')) return 'bg-red-600';
    if (agency.includes('USDA')) return 'bg-green-600';
    if (agency.includes('ATF')) return 'bg-orange-600';
    if (agency.includes('HHS')) return 'bg-purple-600';
    return 'bg-gray-600';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading open comment periods for cannabis, hemp, kratom & related regulations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <h3 className="text-lg font-semibold mb-2">Failed to Load</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadOpenComments}>Try Again</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Open Comment Periods</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Federal regulations for cannabis, hemp, kratom, nicotine & psychedelics accepting public comments
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-1">{regulations.length} active</Badge>
      </div>

      {regulations.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Open Comment Periods</h3>
          <p className="text-muted-foreground">
            No cannabis, hemp, kratom, nicotine, or psychedelics regulations are currently accepting comments.
            <br />
            Check back later for new opportunities to submit public comments.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {regulations.map((reg) => {
            const commentEnd = reg.metadata?.commentEndDate;
            const daysLeft = commentEnd ? getDaysRemaining(commentEnd) : null;
            const agencyId = reg.metadata?.attributes?.agencyId || 'Federal';
            
            return (
              <Card key={reg.id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={getAgencyBadgeColor(agencyId)}>{agencyId}</Badge>
                        {daysLeft !== null && (
                          <Badge variant={daysLeft <= 7 ? 'destructive' : daysLeft <= 30 ? 'default' : 'secondary'}>
                            {daysLeft} days left
                          </Badge>
                        )}
                        {/* Show relevant product tags */}
                        {RELEVANT_KEYWORDS.filter(kw => 
                          `${reg.title} ${reg.description}`.toLowerCase().includes(kw)
                        ).slice(0, 3).map(kw => (
                          <Badge key={kw} variant="outline" className="capitalize text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{reg.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {reg.description || 'No description available'}
                      </p>
                      {commentEnd && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>Comment deadline: {new Date(commentEnd).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedReg(reg);
                        setCommentDialogOpen(true);
                      }}
                      className="gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Draft Comment
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(reg.url, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Draft Public Comment</DialogTitle>
          </DialogHeader>
          {selectedReg && (
            <PublicCommentEditor
              regulationId={selectedReg.id}
              regulationTitle={selectedReg.title}
              regulationType="federal"
              agencyName={selectedReg.metadata?.attributes?.agencyId || 'Federal Agency'}
              commentPeriodEnd={selectedReg.metadata?.commentEndDate}
              regulationUrl={selectedReg.url}
              submissionUrl={selectedReg.metadata?.original_url}
              onSave={() => {
                setCommentDialogOpen(false);
                toast.success('Comment saved');
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
