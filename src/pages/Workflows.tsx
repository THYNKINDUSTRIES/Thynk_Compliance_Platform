import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WorkflowList } from '@/components/WorkflowList';
import { TaskCard } from '@/components/TaskCard';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { useWorkflowTasks } from '@/hooks/useWorkflows';
import { WorkflowTask } from '@/types/workflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Workflow, ListTodo, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function Workflows() {
  const { id } = useParams();
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const { toast } = useToast();

  if (id) {
    return <WorkflowDetail workflowId={id} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Workflow className="h-10 w-10 text-blue-600" />
            Compliance Workflows
          </h1>
          <p className="text-gray-600">
            Manage compliance tasks, track progress, and ensure regulatory adherence
          </p>
        </div>

        <WorkflowList />
      </main>
      <Footer />
    </div>
  );
}

function WorkflowDetail({ workflowId }: { workflowId: string }) {
  const { tasks, loading, refetch } = useWorkflowTasks(workflowId);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const { toast } = useToast();

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('workflow_tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({ title: 'Task updated' });
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const blockedTasks = tasks.filter(t => t.status === 'blocked');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Workflow Details</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="text-2xl font-bold">{pendingTasks.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{inProgressTasks.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{completedTasks.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Blocked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold">{blockedTasks.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({inProgressTasks.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onViewDetails={setSelectedTask}
              />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onViewDetails={setSelectedTask}
              />
            ))}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4">
            {inProgressTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onViewDetails={setSelectedTask}
              />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onViewDetails={setSelectedTask}
              />
            ))}
          </TabsContent>
        </Tabs>
      </main>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onRefresh={refetch}
      />

      <Footer />
    </div>
  );
}
