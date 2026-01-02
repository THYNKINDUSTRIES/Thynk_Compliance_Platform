import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface TeamMemberStats {
  user_id: string;
  user_name: string;
  user_email: string;
  tasks_completed: number;
  tasks_in_progress: number;
  tasks_pending: number;
  avg_completion_time_hours: number;
  overdue_tasks: number;
}

export interface WorkflowMetrics {
  total_workflows: number;
  active_workflows: number;
  completed_workflows: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  avg_completion_time_hours: number;
  compliance_rate: number;
}

export interface TaskVelocity {
  date: string;
  completed: number;
  created: number;
}

export interface ComplianceByType {
  regulation_type: string;
  total_tasks: number;
  completed_tasks: number;
  compliance_rate: number;
}

export function useWorkflowAnalytics() {
  const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([]);
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [velocity, setVelocity] = useState<TaskVelocity[]>([]);
  const [complianceByType, setComplianceByType] = useState<ComplianceByType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch team member stats
      const { data: teamData } = await supabase.rpc('get_team_member_stats');
      if (teamData) setTeamStats(teamData);

      // Fetch overall metrics
      const { data: metricsData } = await supabase.rpc('get_workflow_metrics');
      if (metricsData && metricsData.length > 0) setMetrics(metricsData[0]);

      // Fetch task velocity (last 30 days)
      const { data: velocityData } = await supabase.rpc('get_task_velocity');
      if (velocityData) setVelocity(velocityData);

      // Fetch compliance by regulation type
      const { data: complianceData } = await supabase.rpc('get_compliance_by_type');
      if (complianceData) setComplianceByType(complianceData);

    } catch (error) {
      console.error('Error fetching workflow analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return { teamStats, metrics, velocity, complianceByType, loading, refresh: fetchAnalytics };
}
