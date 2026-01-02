import { WorkflowTask } from '@/types/workflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface TaskCardProps {
  task: WorkflowTask;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onViewDetails: (task: WorkflowTask) => void;
}

export function TaskCard({ task, onStatusChange, onViewDetails }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'blocked': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-300' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base flex-1">{task.title}</CardTitle>
          <div className="flex gap-2">
            <Badge className={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <Badge className={getStatusColor(task.status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(task.status)}
                {task.status.replace('_', ' ')}
              </span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {task.description && (
          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          {task.due_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
              <Calendar className="h-4 w-4" />
              Due {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
          {task.assignments && task.assignments.length > 0 && (
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {task.assignments.length} assigned
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {task.status === 'pending' && (
            <Button size="sm" onClick={() => onStatusChange(task.id, 'in_progress')}>
              Start Task
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button size="sm" onClick={() => onStatusChange(task.id, 'completed')}>
              Complete
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onViewDetails(task)}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
