import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Save, Send, FileText, Calendar, Building2, ExternalLink, Sparkles } from 'lucide-react';
import AICommentAssistant from './AICommentAssistant';


interface PublicCommentEditorProps {
  regulationId?: string;
  regulationTitle: string;
  regulationType: 'federal' | 'state';
  jurisdictionCode?: string;
  agencyName: string;
  agencyContactEmail?: string;
  commentPeriodEnd?: string;
  regulationUrl?: string;
  submissionUrl?: string;
  existingCommentId?: string;
  regulationText?: string;
  onSave?: () => void;
}


export function PublicCommentEditor({
  regulationId,
  regulationTitle,
  regulationType,
  jurisdictionCode,
  agencyName,
  agencyContactEmail,
  commentPeriodEnd,
  regulationUrl,
  submissionUrl,
  existingCommentId,
  regulationText = '',
  onSave
}: PublicCommentEditorProps) {

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');
  const [submissionMethod, setSubmissionMethod] = useState('');
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingCommentId) {
      loadComment();
    }
  }, [existingCommentId]);

  const loadComment = async () => {
    const { data, error } = await supabase
      .from('public_comments')
      .select('*')
      .eq('id', existingCommentId)
      .single();

    if (data) {
      setTitle(data.comment_title);
      setBody(data.comment_body);
      setStatus(data.status);
      setSubmissionMethod(data.submission_method || '');
      setConfirmationNumber(data.confirmation_number || '');
    }
  };

  const handleSave = async (newStatus: 'draft' | 'submitted') => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in title and comment body');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to save comments');
        return;
      }

      const { data, error } = await supabase.functions.invoke('save-public-comment', {
        body: {
          commentId: existingCommentId,
          regulationId,
          regulationTitle,
          regulationType,
          jurisdictionCode,
          agencyName,
          agencyContactEmail,
          commentPeriodEnd,
          commentTitle: title,
          commentBody: body,
          status: newStatus,
          submissionMethod: newStatus === 'submitted' ? submissionMethod : null,
          confirmationNumber: newStatus === 'submitted' ? confirmationNumber : null,
          regulationUrl,
          submissionUrl
        }
      });

      if (error) throw error;

      toast.success(newStatus === 'draft' ? 'Comment saved as draft' : 'Comment marked as submitted');
      setStatus(newStatus);
      onSave?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const daysUntilDeadline = commentPeriodEnd 
    ? Math.ceil((new Date(commentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="p-6">
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">
            <FileText className="h-4 w-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="ai-assistant" disabled={!body || status === 'submitted'}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Public Comment</h3>
              <p className="text-sm text-muted-foreground">{regulationTitle}</p>
            </div>
            {status === 'submitted' && (
              <Badge variant="default">Submitted</Badge>
            )}
          </div>

          <div className="grid gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">Agency:</span>
              <span>{agencyName}</span>
            </div>
            {commentPeriodEnd && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Deadline:</span>
                <span>{new Date(commentPeriodEnd).toLocaleDateString()}</span>
                {daysUntilDeadline !== null && (
                  <Badge variant={daysUntilDeadline <= 3 ? 'destructive' : 'secondary'}>
                    {daysUntilDeadline} days left
                  </Badge>
                )}
              </div>
            )}
            {submissionUrl && (
              <a href={submissionUrl} target="_blank" rel="noopener noreferrer" 
                 className="flex items-center gap-2 text-sm text-primary hover:underline">
                <ExternalLink className="h-4 w-4" />
                Official Submission Portal
              </a>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Comment Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief title for your comment"
                disabled={status === 'submitted'}
              />
            </div>

            <div>
              <Label htmlFor="body">Comment Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your detailed comment here..."
                rows={12}
                disabled={status === 'submitted'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {body.length} characters • {body.split(/\s+/).filter(w => w).length} words
              </p>
            </div>

            {status === 'draft' && (
              <>
                <div>
                  <Label htmlFor="method">Submission Method (optional)</Label>
                  <Select value={submissionMethod} onValueChange={setSubmissionMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="How will you submit?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regulations_gov">Regulations.gov</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="state_portal">State Portal</SelectItem>
                      <SelectItem value="mail">US Mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="confirmation">Confirmation Number (optional)</Label>
                  <Input
                    id="confirmation"
                    value={confirmationNumber}
                    onChange={(e) => setConfirmationNumber(e.target.value)}
                    placeholder="Enter confirmation number after submission"
                  />
                </div>
              </>
            )}
          </div>

          {status === 'draft' && (
            <div className="flex gap-3">
              <Button onClick={() => handleSave('draft')} disabled={saving} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={() => handleSave('submitted')} disabled={saving}>
                <Send className="h-4 w-4 mr-2" />
                Mark as Submitted
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai-assistant" className="mt-6">
          <AICommentAssistant
            regulationTitle={regulationTitle}
            regulationText={regulationText}
            agencyName={agencyName}
            commentDraft={body}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
