export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'manual' | 'auto_on_new_regulation' | 'scheduled';
  is_template: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInstance {
  id: string;
  workflow_id?: string;
  instrument_id?: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTask {
  id: string;
  workflow_instance_id: string;
  title: string;
  description?: string;
  task_type: 'review' | 'approval' | 'implementation' | 'documentation';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  completed_at?: string;
  order_index: number;
  depends_on?: string;
  entity_id?: string;
  created_at: string;
  updated_at: string;
  assignments?: TaskAssignment[];
  approvals?: WorkflowApproval[];
  comments?: TaskComment[];
  attachments?: WorkflowAttachment[];
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  assigned_by?: string;
  role: 'assignee' | 'reviewer' | 'approver';
  assigned_at: string;
  user_email?: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_email?: string;
}

export interface WorkflowApproval {
  id: string;
  task_id: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  created_at: string;
  approver_email?: string;
}

export interface WorkflowAttachment {
  id: string;
  task_id?: string;
  workflow_instance_id?: string;
  filename: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface AuditLog {
  id: string;
  workflow_instance_id: string;
  task_id?: string;
  user_id?: string;
  action: string;
  details?: any;
  created_at: string;
  user_email?: string;
}
