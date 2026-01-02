import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function TagManagement() {
  const [pendingTags, setPendingTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingTags();
  }, []);

  const fetchPendingTags = async () => {
    try {
      const { data, error } = await supabase
        .from('instrument_tags')
        .select(`
          id, confidence, auto_generated, reviewed,
          instrument:instrument_id(id, title),
          tag:tag_id(id, name)
        `)
        .eq('reviewed', false)
        .order('confidence', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPendingTags(data || []);
    } catch (error: any) {
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('instrument_tags')
        .update({ reviewed: true })
        .eq('id', tagId);

      if (error) throw error;
      toast.success('Tag approved');
      fetchPendingTags();
    } catch (error: any) {
      toast.error('Failed to approve tag');
    }
  };

  const handleReject = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('instrument_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
      toast.success('Tag rejected');
      fetchPendingTags();
    } catch (error: any) {
      toast.error('Failed to reject tag');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h2 className="text-xl font-semibold">AI-Generated Tags Review</h2>
        <Badge>{pendingTags.length} pending</Badge>
      </div>

      <div className="grid gap-4">
        {pendingTags.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-1">{item.instrument?.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.tag?.name}</Badge>
                  <span className="text-xs text-gray-500">
                    Confidence: {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove(item.id)}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleReject(item.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
