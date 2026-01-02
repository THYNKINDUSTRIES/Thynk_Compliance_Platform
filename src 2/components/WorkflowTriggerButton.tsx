import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Workflow, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface WorkflowTriggerButtonProps {
  instrumentId: string;
  instrumentTitle: string;
}

export function WorkflowTriggerButton({ instrumentId, instrumentTitle }: WorkflowTriggerButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateWorkflow = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-workflow-instance', {
        body: {
          instrumentId,
          workflowName: `Compliance: ${instrumentTitle}`,
          userId: 'anonymous'
        }
      });


      if (error) throw error;

      toast({
        title: 'Workflow Created',
        description: `Created workflow with ${data.tasksCreated} tasks`,
      });

      // Navigate to workflows page
      window.location.href = '/workflows';
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create workflow',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleCreateWorkflow} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Workflow className="mr-2 h-4 w-4" />
          Create Workflow
        </>
      )}
    </Button>
  );
}
