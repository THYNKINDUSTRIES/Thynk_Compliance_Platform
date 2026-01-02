import { useWorkflowAnalytics } from '@/hooks/useWorkflowAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CheckCircle, Clock, AlertTriangle, TrendingUp, Target } from 'lucide-react';
import { exportToCSV, exportToExcel } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function TeamAnalyticsDashboard() {
  const { teamStats, metrics, velocity, complianceByType, loading } = useWorkflowAnalytics();

  const handleExportTeamStats = () => {
    const csvData = teamStats.map(stat => ({
      'Team Member': stat.user_name,
      'Email': stat.user_email,
      'Completed': stat.tasks_completed,
      'In Progress': stat.tasks_in_progress,
      'Pending': stat.tasks_pending,
      'Avg Hours': stat.avg_completion_time_hours.toFixed(2),
      'Overdue': stat.overdue_tasks,
    }));
    exportToCSV(csvData, `team-stats-${new Date().toISOString().split('T')[0]}`);
    toast.success('Team stats exported!');
  };

  const handleExportCompliance = () => {
    const csvData = complianceByType.map(c => ({
      'Type': c.regulation_type,
      'Total': c.total_tasks,
      'Completed': c.completed_tasks,
      'Rate': `${c.compliance_rate.toFixed(1)}%`,
    }));
    exportToCSV(csvData, `compliance-by-type-${new Date().toISOString().split('T')[0]}`);
    toast.success('Compliance data exported!');
  };

  if (loading) {
    return <div className="text-center py-12">Loading team analytics...</div>;
  }

  const workloadData = teamStats.map(stat => ({
    name: stat.user_name.split(' ')[0],
    completed: stat.tasks_completed,
    inProgress: stat.tasks_in_progress,
    pending: stat.tasks_pending,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{metrics?.total_workflows || 0}</div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Total Workflows</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{metrics?.completed_tasks || 0}</div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Tasks Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600">
                {metrics?.avg_completion_time_hours.toFixed(1) || 0}h
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Avg Completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div className="text-2xl font-bold text-red-600">{metrics?.overdue_tasks || 0}</div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Overdue Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">
                {metrics?.compliance_rate.toFixed(1) || 0}%
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Compliance Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <div className="text-2xl font-bold text-indigo-600">{teamStats.length}</div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Team Members</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Task Velocity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Task Velocity (30 Days)
            </CardTitle>
            <CardDescription>Tasks created vs completed over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <LineChart data={velocity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Compliance by Type */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Compliance by Type
              </CardTitle>
              <CardDescription>Task completion rate per regulation type</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCompliance}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px]">
              <BarChart data={complianceByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="regulation_type" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="compliance_rate" fill="#10b981" name="Compliance %" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Workload Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Workload Distribution
          </CardTitle>
          <CardDescription>Task distribution across team members</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[350px]">
            <BarChart data={workloadData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" stackId="a" />
              <Bar dataKey="inProgress" fill="#3b82f6" name="In Progress" stackId="a" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" stackId="a" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Team Member Performance Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Member Performance</CardTitle>
            <CardDescription>Detailed statistics per team member</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportTeamStats}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Team Member</th>
                  <th className="text-right p-2">Completed</th>
                  <th className="text-right p-2">In Progress</th>
                  <th className="text-right p-2">Pending</th>
                  <th className="text-right p-2">Avg Time (hrs)</th>
                  <th className="text-right p-2">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {teamStats.map((stat) => (
                  <tr key={stat.user_id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{stat.user_name}</div>
                        <div className="text-sm text-gray-500">{stat.user_email}</div>
                      </div>
                    </td>
                    <td className="text-right p-2 text-green-600 font-semibold">{stat.tasks_completed}</td>
                    <td className="text-right p-2 text-blue-600">{stat.tasks_in_progress}</td>
                    <td className="text-right p-2 text-orange-600">{stat.tasks_pending}</td>
                    <td className="text-right p-2">{stat.avg_completion_time_hours.toFixed(1)}</td>
                    <td className="text-right p-2 text-red-600 font-semibold">{stat.overdue_tasks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
