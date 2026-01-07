import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Circle, Calendar, AlertCircle, Workflow } from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  jurisdiction: string;
  agency: string;
  priority: string;
  regulation_reference: string;
  is_completed: boolean;
  workflow_id?: string;
  notes?: string;
}

export function ChecklistView({ checklistId }: { checklistId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [checklistId]);

  const loadData = async () => {
    try {
      const [itemsRes, workflowsRes] = await Promise.all([
        supabase.from('checklist_items').select('*').eq('checklist_id', checklistId).order('order_index'),
        supabase.from('workflows').select('id, name')
      ]);

      if (itemsRes.data) {
        setItems(itemsRes.data);
        const completed = itemsRes.data.filter(i => i.is_completed).length;
        setProgress((completed / itemsRes.data.length) * 100);
      }
      if (workflowsRes.data) setWorkflows(workflowsRes.data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (itemId: string, completed: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('checklist_items')
      .update({ 
        is_completed: completed, 
        completed_at: completed ? new Date().toISOString() : null,
        completed_by: completed ? user?.id : null
      })
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      loadData();
      // Update checklist completed count
      const { data: checklist } = await supabase
        .from('compliance_checklists')
        .select('completed_items')
        .eq('id', checklistId)
        .limit(1);
      
      if (checklist) {
        await supabase
          .from('compliance_checklists')
          .update({ 
            completed_items: (checklist.completed_items || 0) + (completed ? 1 : -1),
            updated_at: new Date().toISOString()
          })
          .eq('id', checklistId);
      }
    }
  };


  const assignWorkflow = async (itemId: string, workflowId: string) => {
    const { error } = await supabase
      .from('checklist_items')
      .update({ workflow_id: workflowId })
      .eq('id', itemId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      loadData();
      toast({ title: 'Success', description: 'Assigned to workflow' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>{Math.round(progress)}% Complete</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} />
        </CardContent>
      </Card>

      {items.map(item => (
        <Card key={item.id} className={item.is_completed ? 'opacity-60' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Checkbox
                checked={item.is_completed}
                onCheckedChange={(checked) => toggleComplete(item.id, !!checked)}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  <Badge variant={getPriorityColor(item.priority)}>{item.priority}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline">{item.category}</Badge>
                  <Badge variant="outline">{item.jurisdiction}</Badge>
                  <Badge variant="outline">{item.agency}</Badge>
                </div>
                {item.regulation_reference && (
                  <p className="text-xs text-muted-foreground">Ref: {item.regulation_reference}</p>
                )}
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-muted-foreground" />
                  <Select value={item.workflow_id || ''} onValueChange={(val) => assignWorkflow(item.id, val)}>
                    <SelectTrigger className="w-[200px] h-8">
                      <SelectValue placeholder="Assign to workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows.map(wf => (
                        <SelectItem key={wf.id} value={wf.id}>{wf.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}