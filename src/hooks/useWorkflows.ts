import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { WorkflowInstance, WorkflowTask } from '@/types/workflow';

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  return { workflows, loading, refetch: fetchWorkflows };
}

export function useWorkflowTasks(workflowInstanceId: string) {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workflowInstanceId) {
      fetchTasks();
    }
  }, [workflowInstanceId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_tasks')
        .select(`
          *,
          assignments:task_assignments(*),
          approvals:workflow_approvals(*),
          comments:task_comments(*),
          attachments:workflow_attachments(*)
        `)
        .eq('workflow_instance_id', workflowInstanceId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  return { tasks, loading, refetch: fetchTasks };
}
