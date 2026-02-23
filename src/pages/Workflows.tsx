import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WorkflowList } from '@/components/WorkflowList';
import { TaskCard } from '@/components/TaskCard';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { useWorkflowTasks, useWorkflowDetail } from '@/hooks/useWorkflows';
import { WorkflowTask } from '@/types/workflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Workflow, ListTodo, CheckCircle2, Clock, AlertCircle,
  ArrowLeft, Sparkles, FileText, Calendar, AlertTriangle, XCircle
} from 'lucide-react';

export default function Workflows() {
  const { id } = useParams();

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
            AI-powered compliance task management — generate workflows from any regulation
          </p>
        </div>

        <WorkflowList />
      </main>
      <Footer />
    </div>
  );
}

function WorkflowDetail({ workflowId }: { workflowId: string }) {
  const { workflow, loading: wfLoading, refetch: refetchWorkflow } = useWorkflowDetail(workflowId);
  const { tasks, loading: tasksLoading, refetch } = useWorkflowTasks(workflowId);
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('workflow_tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) throw error;
      toast({ title: 'Task updated' });
      refetch();

      // Check if all tasks are completed → mark workflow as completed
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      const allDone = updatedTasks.every(t => t.status === 'completed');
      if (allDone && updatedTasks.length > 0) {
        await supabase
          .from('workflow_instances')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', workflowId);
        toast({ title: 'Workflow Complete!', description: 'All compliance tasks have been completed.' });
        refetchWorkflow();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCancelWorkflow = async () => {
    try {
      await supabase
        .from('workflow_instances')
        .update({ status: 'cancelled' })
        .eq('id', workflowId);
      toast({ title: 'Workflow cancelled' });
      refetchWorkflow();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  const completionPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const loading = wfLoading || tasksLoading;
  const aiAnalysis = workflow?.ai_analysis;
  const instrument = workflow?.instrument as any;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Workflow className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Loading workflow...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm">
          <Link to="/" className="text-blue-600 hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/workflows" className="text-blue-600 hover:underline">Workflows</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-600">{workflow?.name || 'Detail'}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/workflows')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold">{workflow?.name || 'Workflow'}</h1>
              <Badge className={
                workflow?.status === 'completed' ? 'bg-green-500' :
                workflow?.status === 'cancelled' ? 'bg-gray-500' : 'bg-blue-500'
              }>
                {workflow?.status}
              </Badge>
            </div>
            {workflow?.description && (
              <p className="text-gray-600 ml-12">{workflow.description}</p>
            )}
            {instrument && (
              <div className="ml-12 mt-2">
                <Link
                  to={`/regulations/${instrument.id}`}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  {instrument.title}
                  {instrument.jurisdiction?.name && ` — ${instrument.jurisdiction.name}`}
                </Link>
              </div>
            )}
          </div>
          {workflow?.status === 'active' && (
            <Button variant="outline" size="sm" onClick={handleCancelWorkflow} className="text-red-600 hover:bg-red-50">
              <XCircle className="mr-1 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>

        {/* AI Analysis Panel */}
        {aiAnalysis && (
          <Card className="mb-6 border-purple-200 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-800 text-base">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Compliance Analysis
                {aiAnalysis.risk_level && (
                  <Badge className={
                    aiAnalysis.risk_level === 'critical' ? 'bg-red-500' :
                    aiAnalysis.risk_level === 'high' ? 'bg-orange-500' :
                    aiAnalysis.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }>
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {aiAnalysis.risk_level} risk
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiAnalysis.compliance_summary && (
                <p className="text-sm text-gray-700 leading-relaxed">{aiAnalysis.compliance_summary}</p>
              )}
              {aiAnalysis.key_requirements?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Key Requirements</h4>
                  <ul className="space-y-1">
                    {aiAnalysis.key_requirements.map((req: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiAnalysis.estimated_effort && (
                <p className="text-xs text-purple-700">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  Estimated effort: <strong>{aiAnalysis.estimated_effort}</strong>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Progress + Stats */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress — {completionPct}%
            </span>
            <span className="text-xs text-gray-500">
              {completedTasks.length} of {tasks.length} tasks complete
            </span>
          </div>
          <Progress value={completionPct} className="h-2" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-50">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-2xl font-bold">{pendingTasks.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-blue-600 uppercase tracking-wide">In Progress</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold text-blue-700">{inProgressTasks.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-green-600 uppercase tracking-wide">Completed</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-green-700">{completedTasks.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-red-600 uppercase tracking-wide">Blocked</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold text-red-700">{blockedTasks.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({inProgressTasks.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No tasks found for this workflow.
                </CardContent>
              </Card>
            ) : (
              tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onViewDetails={setSelectedTask}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingTasks.map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onViewDetails={setSelectedTask} />
            ))}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4">
            {inProgressTasks.map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onViewDetails={setSelectedTask} />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onViewDetails={setSelectedTask} />
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
