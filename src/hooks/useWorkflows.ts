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
        .select(`
          *,
          instrument:instrument_id(id, title, jurisdiction:jurisdiction_id(name))
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST204') {
          setWorkflows([]);
          return;
        }
        throw error;
      }
      setWorkflows(data || []);
    } catch (error: any) {
      if (error?.code !== '42P01') {
        console.warn('Workflows not available:', error?.message || error);
      }
    } finally {
      setLoading(false);
    }
  };

  return { workflows, loading, refetch: fetchWorkflows };
}

export function useWorkflowDetail(workflowId: string) {
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workflowId) fetchDetail();
  }, [workflowId]);

  const fetchDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_instances')
        .select(`
          *,
          instrument:instrument_id(id, title, jurisdiction:jurisdiction_id(name))
        `)
        .eq('id', workflowId)
        .single();

      if (error) throw error;
      setWorkflow(data);
    } catch (error: any) {
      console.warn('Workflow detail error:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  return { workflow, loading, refetch: fetchDetail };
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

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST204') {
          setTasks([]);
          return;
        }
        throw error;
      }
      setTasks(data || []);
    } catch (error: any) {
      if (error?.code !== '42P01') {
        console.warn('Workflow tasks not available:', error?.message || error);
      }
    } finally {
      setLoading(false);
    }
  };

  return { tasks, loading, refetch: fetchTasks };
}
