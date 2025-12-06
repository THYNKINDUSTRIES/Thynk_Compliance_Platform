import { useState } from 'react';
import { WorkflowTask } from '@/types/workflow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare } from 'lucide-react';

interface TaskDetailModalProps {
  task: WorkflowTask | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function TaskDetailModal({ task, open, onClose }: TaskDetailModalProps) {
  const [comment, setComment] = useState('');
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments"><MessageSquare className="h-4 w-4 mr-1" />Comments</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4">
            <p className="text-sm text-gray-600">{task.description}</p>
            <div className="flex gap-2">
              <Badge>{task.priority}</Badge>
              <Badge>{task.status}</Badge>
            </div>
          </TabsContent>
          <TabsContent value="comments" className="space-y-4">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." />
            <Button>Post</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
