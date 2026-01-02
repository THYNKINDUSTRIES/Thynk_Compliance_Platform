import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { FileText, Calendar, Building2, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PublicCommentEditor } from './PublicCommentEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Comment {
  id: string;
  regulation_title: string;
  regulation_type: string;
  jurisdiction_code?: string;
  agency_name: string;
  agency_contact_email?: string;
  comment_period_end?: string;
  comment_title: string;
  comment_body: string;
  status: 'draft' | 'submitted';
  submission_date?: string;
  submission_method?: string;
  confirmation_number?: string;
  regulation_url?: string;
  submission_url?: string;
  created_at: string;
  updated_at: string;
}

export function CommentTracker() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('public_comments')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('public_comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Comment deleted');
      loadComments();
    } catch (error: any) {
      toast.error('Failed to delete comment');
    }
  };

  const getDaysUntilDeadline = (deadline?: string) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <div className="text-center py-8">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Public Comments</h2>
        <Badge variant="secondary">{comments.length} total</Badge>
      </div>

      {comments.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Comments Yet</h3>
          <p className="text-muted-foreground">
            Start drafting comments on regulations you're following
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {comments.map((comment) => {
            const daysUntil = getDaysUntilDeadline(comment.comment_period_end);
            return (
              <Card key={comment.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{comment.comment_title}</h3>
                        <Badge variant={comment.status === 'submitted' ? 'default' : 'secondary'}>
                          {comment.status}
                        </Badge>
                        {daysUntil !== null && comment.status === 'draft' && (
                          <Badge variant={daysUntil <= 3 ? 'destructive' : 'outline'}>
                            {daysUntil} days left
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {comment.regulation_title}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {comment.agency_name}
                        </div>
                        {comment.comment_period_end && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Deadline: {new Date(comment.comment_period_end).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {comment.status === 'submitted' && (
                        <div className="mt-3 text-sm text-muted-foreground">
                          Submitted: {new Date(comment.submission_date!).toLocaleDateString()}
                          {comment.confirmation_number && (
                            <span className="ml-2">• Confirmation: {comment.confirmation_number}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedComment(comment);
                          setEditDialogOpen(true);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {comment.submission_url && (
                    <a
                      href={comment.submission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Official Submission Portal
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Comment</DialogTitle>
          </DialogHeader>
          {selectedComment && (
            <PublicCommentEditor
              regulationId={selectedComment.id}
              regulationTitle={selectedComment.regulation_title}
              regulationType={selectedComment.regulation_type as 'federal' | 'state'}
              jurisdictionCode={selectedComment.jurisdiction_code}
              agencyName={selectedComment.agency_name}
              agencyContactEmail={selectedComment.agency_contact_email}
              commentPeriodEnd={selectedComment.comment_period_end}
              regulationUrl={selectedComment.regulation_url}
              submissionUrl={selectedComment.submission_url}
              existingCommentId={selectedComment.id}
              onSave={() => {
                loadComments();
                setEditDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}