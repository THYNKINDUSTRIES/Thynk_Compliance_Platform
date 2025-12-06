# Compliance Workflow System Documentation

## Overview
The Thynk Compliance Platform now includes a comprehensive workflow management system that allows organizations to create, manage, and track compliance tasks related to regulatory changes.

## Features

### 1. **Workflow Creation**
- Create workflows directly from regulation detail pages
- Click "Create Workflow" button on any regulation
- Automatically generates tasks based on AI-extracted entities

### 2. **Task Management**
- **Task Types**: Review, Approval, Implementation, Documentation
- **Priority Levels**: Low, Medium, High, Critical
- **Status Tracking**: Pending, In Progress, Completed, Blocked
- **Due Dates**: Automatic deadline tracking with overdue indicators

### 3. **Task Assignment**
- Assign tasks to team members by email
- Multiple assignment roles: Assignee, Reviewer, Approver
- Email notifications sent automatically via Resend

### 4. **Collaboration Features**
- **Comments**: Team discussion on tasks
- **Attachments**: Upload documents to tasks
- **Approval Chains**: Multi-level approval workflows
- **Audit Trail**: Complete history of all workflow actions

### 5. **Document Management**
- Upload files to tasks or workflows
- Secure storage in Supabase Storage
- Download attachments anytime
- Track who uploaded what and when

### 6. **Email Notifications**
- Automatic notifications on task assignment
- Beautiful HTML email templates
- Includes task details, due dates, and action links

## How to Use

### Creating a Workflow
1. Navigate to any regulation detail page
2. Click the "Create Workflow" button
3. System automatically:
   - Creates workflow instance
   - Extracts deadlines and requirements from NLP analysis
   - Generates appropriate tasks
   - Sets up approval chains

### Managing Tasks
1. Go to Workflows page from the navigation menu
2. View all active workflows
3. Click on a workflow to see task details
4. Update task status: Pending → In Progress → Completed
5. View tasks by status using tabs

### Task Details
Click "View Details" on any task to:
- Add comments
- Assign team members
- Upload attachments
- View approval status
- Check audit history

### Assigning Tasks
1. Open task details modal
2. Go to "Assignments" tab
3. Enter team member's email
4. Click "Assign"
5. They receive an email notification

### Adding Comments
1. Open task details
2. Go to "Comments" tab
3. Type your comment
4. Click "Post"

### Uploading Documents
1. Open task details
2. Go to "Attachments" tab
3. Choose file
4. File uploads to secure storage

## Database Schema

### Tables
- `workflows` - Workflow templates
- `workflow_instances` - Active workflow executions
- `workflow_tasks` - Individual tasks
- `task_assignments` - User assignments
- `task_comments` - Discussion threads
- `workflow_approvals` - Approval tracking
- `workflow_attachments` - Document storage
- `audit_logs` - Complete audit trail

## Edge Functions

### create-workflow-instance
Creates a new workflow from a regulation, automatically generating tasks from extracted entities.

**Endpoint**: `/functions/v1/create-workflow-instance`

**Body**:
```json
{
  "instrumentId": "uuid",
  "workflowName": "string",
  "userId": "uuid"
}
```

### send-workflow-notification
Sends email notifications for task assignments and updates.

**Endpoint**: `/functions/v1/send-workflow-notification`

**Body**:
```json
{
  "to": "email@example.com",
  "subject": "string",
  "taskTitle": "string",
  "taskDescription": "string",
  "dueDate": "ISO date",
  "workflowName": "string",
  "actionUrl": "string"
}
```

## Integration with NLP

The workflow system integrates with the NLP analysis feature:

1. **Automatic Task Generation**: When a regulation is analyzed with AI, extracted entities (deadlines, requirements) are used to create tasks
2. **Smart Deadlines**: Deadline entities become tasks with appropriate due dates
3. **Requirement Tasks**: Each requirement gets its own implementation task
4. **Entity Linking**: Tasks link back to extracted entities for traceability

## Best Practices

### Workflow Creation
- Run NLP analysis on regulations before creating workflows
- Review auto-generated tasks and adjust as needed
- Set realistic due dates for your team

### Task Management
- Update task status regularly
- Add comments to document progress
- Upload supporting documents
- Assign tasks to appropriate team members

### Team Collaboration
- Use comments for discussions
- Tag team members in comments
- Keep attachments organized
- Review approval chains regularly

### Compliance Tracking
- Monitor overdue tasks
- Review completed workflows
- Export audit logs for compliance reports
- Track team workload

## Permissions

All authenticated users can:
- View workflows and tasks
- Create workflows from regulations
- Update task status
- Add comments
- Upload attachments
- Assign tasks

## Storage

Workflow attachments are stored in the `workflow-attachments` Supabase Storage bucket with:
- Secure access control
- File size tracking
- MIME type validation
- Upload history

## Future Enhancements

Potential additions:
- Workflow templates
- Recurring workflows
- Advanced filtering and search
- Gantt chart view
- Team workload analytics
- Integration with calendar apps
- Slack/Teams notifications
- Custom workflow stages
- SLA tracking
- Compliance reporting dashboard
