import { useWorkflows } from '@/hooks/useWorkflows';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Workflow, Calendar, CheckCircle2, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function WorkflowList() {
  const { workflows, loading } = useWorkflows();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Workflow className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {workflows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Workflow className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workflows Yet</h3>
            <p className="text-gray-600 mb-4">
              Open any regulation and click <strong>"Generate Compliance Workflow"</strong> to create AI-powered compliance tasks.
            </p>
            <Link to="/dashboard">
              <Button variant="outline">Browse Regulations</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        workflows.map((workflow: any) => {
          const instrument = workflow.instrument;
          const aiAnalysis = workflow.ai_analysis;
          return (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Workflow className="h-5 w-5 text-blue-600" />
                      {workflow.name}
                    </CardTitle>
                    {workflow.description && (
                      <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                    )}
                    {instrument && (
                      <Link
                        to={`/regulations/${instrument.id}`}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                      >
                        <FileText className="h-3 w-3" />
                        {instrument.title}
                        {instrument.jurisdiction?.name && ` — ${instrument.jurisdiction.name}`}
                      </Link>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {aiAnalysis?.risk_level && (
                      <Badge className={
                        aiAnalysis.risk_level === 'critical' ? 'bg-red-500 text-white' :
                        aiAnalysis.risk_level === 'high' ? 'bg-orange-500 text-white' :
                        aiAnalysis.risk_level === 'medium' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                      }>
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {aiAnalysis.risk_level}
                      </Badge>
                    )}
                    <Badge className={`${getStatusColor(workflow.status)} text-white`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(workflow.status)}
                        {workflow.status}
                      </span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Started {new Date(workflow.started_at).toLocaleDateString()}
                    </span>
                    {aiAnalysis?.estimated_effort && (
                      <span className="text-xs text-purple-600">
                        Est. {aiAnalysis.estimated_effort}
                      </span>
                    )}
                  </div>
                  <Link to={`/workflows/${workflow.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
