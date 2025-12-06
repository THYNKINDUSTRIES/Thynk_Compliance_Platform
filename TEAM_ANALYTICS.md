# Team Analytics Dashboard

## Overview
The Team Analytics Dashboard provides comprehensive insights into workflow performance, team productivity, and compliance metrics. It integrates with the workflow system to track task completion, identify bottlenecks, and measure team effectiveness.

## Features

### Key Metrics
- **Total Workflows**: Count of all workflow instances
- **Tasks Completed**: Number of completed tasks across all workflows
- **Average Completion Time**: Mean time to complete tasks (in hours)
- **Overdue Tasks**: Count of tasks past their due date
- **Compliance Rate**: Percentage of tasks completed on time
- **Active Team Members**: Number of users with assigned tasks

### Analytics Views

#### 1. Task Velocity Chart
- Line chart showing tasks created vs completed over the last 30 days
- Helps identify workload trends and capacity planning needs
- Green line = completed tasks, Blue line = created tasks

#### 2. Compliance by Regulation Type
- Bar chart showing compliance rate by regulation type
- Identifies which regulation types are being handled most effectively
- Useful for resource allocation and training needs

#### 3. Workload Distribution
- Stacked bar chart showing task distribution per team member
- Breaks down by status: Completed (green), In Progress (blue), Pending (orange)
- Helps balance workload across team

#### 4. Team Member Performance Table
- Detailed statistics per team member including:
  - Tasks completed, in progress, and pending
  - Average completion time
  - Number of overdue tasks
- Sortable and exportable to CSV

## Database Functions

### get_team_member_stats()
Returns aggregated statistics per team member including task counts by status, average completion time, and overdue task count.

### get_workflow_metrics()
Returns overall workflow metrics including total workflows, task counts, completion rates, and compliance percentage.

### get_task_velocity()
Returns daily task creation and completion counts for the last 30 days.

### get_compliance_by_type()
Returns compliance rate grouped by regulation type, showing which types of regulations are being handled most effectively.

## Export Capabilities
- **CSV Export**: Export team statistics and compliance data
- All charts can be exported individually
- Data includes team member names, emails, and performance metrics

## Usage

### Accessing the Dashboard
1. Navigate to Analytics page
2. Click on "Team Analytics" tab
3. View real-time metrics and charts

### Interpreting Metrics

**High Compliance Rate (>80%)**: Team is effectively managing regulatory requirements
**Low Compliance Rate (<60%)**: May indicate resource constraints or process issues

**Balanced Workload**: Similar task counts across team members
**Unbalanced Workload**: Large variance may indicate need for redistribution

**Positive Velocity**: More tasks completed than created = reducing backlog
**Negative Velocity**: More tasks created than completed = growing backlog

### Best Practices
1. Review analytics weekly to identify trends
2. Use workload distribution to balance assignments
3. Monitor overdue tasks and address bottlenecks promptly
4. Track compliance rate by regulation type to allocate resources
5. Export data regularly for historical tracking

## Integration with Workflows
- Analytics automatically update as tasks are created, assigned, and completed
- Real-time data from workflow_tasks, task_assignments, and workflow_instances tables
- Tied to extracted entities from NLP analysis for automatic task generation

## Technical Details
- Built with Recharts for data visualization
- Uses Supabase RPC functions for efficient data aggregation
- Custom React hook (useWorkflowAnalytics) for data fetching
- Responsive design works on desktop and mobile
