import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Calendar, ExternalLink, MessageSquare, AlertCircle } from 'lucide-react';
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
      const { data, error: queryError } = await supabase
        .from('instrument')
        .select('*')
        .eq('source', 'regulations_gov')
        .order('created_at', { ascending: false })
        .limit(100);

      if (queryError) throw queryError;

      // Filter in JavaScript for better compatibility
      const today = new Date();
      const filtered = (data || []).filter((reg: OpenComment) => {
        const commentEnd = reg.metadata?.commentEndDate;
        if (!commentEnd) return false;
        
        try {
          const endDate = new Date(commentEnd);
          return endDate >= today;
        } catch {
          return false;
        }
      }).sort((a, b) => {
        const dateA = new Date(a.metadata?.commentEndDate || 0);
        const dateB = new Date(b.metadata?.commentEndDate || 0);
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

  if (loading) {
    return <div className="text-center py-8">Loading open comment periods...</div>;
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
          <p className="text-muted-foreground">Federal regulations accepting public comments</p>
        </div>
        <Badge variant="secondary">{regulations.length} active</Badge>
      </div>

      {regulations.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Open Comment Periods</h3>
          <p className="text-muted-foreground">Check back later for new regulations accepting comments</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {regulations.map((reg) => {
            const commentEnd = reg.metadata?.commentEndDate;
            const daysLeft = commentEnd ? getDaysRemaining(commentEnd) : null;
            const agencyId = reg.metadata?.attributes?.agencyId || 'Federal';
            
            return (
              <Card key={reg.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{agencyId}</Badge>
                        {daysLeft !== null && (
                          <Badge variant={daysLeft <= 7 ? 'destructive' : daysLeft <= 30 ? 'default' : 'secondary'}>
                            {daysLeft} days left
                          </Badge>
                        )}
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