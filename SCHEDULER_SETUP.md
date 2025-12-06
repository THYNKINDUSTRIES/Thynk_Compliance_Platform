# Automated Scheduler Setup

## Overview
The Thynk.guru platform now has fully automated scheduled jobs that run every 15 minutes to keep the database up-to-date with the latest federal regulations. Additionally, digest emails are sent daily and weekly.

## Scheduled Jobs

### Data Polling Jobs

#### 1. Federal Register Poller
- **Schedule**: Every 15 minutes (`:00, :15, :30, :45`)
- **Function**: `federal-register-poller`
- **Purpose**: Fetches latest documents from Federal Register API
- **Cron Expression**: `*/15 * * * *`

#### 2. Regulations.gov Poller
- **Schedule**: Every 15 minutes (`:05, :20, :35, :50`)
- **Function**: `regulations-gov-poller`
- **Purpose**: Fetches latest regulations from Regulations.gov API
- **Cron Expression**: `5,20,35,50 * * * *`

#### 3. RSS Feed Poller
- **Schedule**: Every 15 minutes (`:10, :25, :40, :55`)
- **Function**: `rss-feed-poller`
- **Purpose**: Fetches updates from RSS feeds
- **Cron Expression**: `10,25,40,55 * * * *`

### Email Digest Jobs

#### 4. Daily Digest
- **Schedule**: Every day at 8:00 AM UTC
- **Function**: `send-digest-emails`
- **Purpose**: Sends daily summary emails to subscribed users
- **Cron Expression**: `0 8 * * *`
- **Parameters**: `{"frequency": "daily"}`

#### 5. Weekly Digest
- **Schedule**: Every Monday at 8:00 AM UTC
- **Function**: `send-digest-emails`
- **Purpose**: Sends weekly summary emails to subscribed users
- **Cron Expression**: `0 8 * * 1`
- **Parameters**: `{"frequency": "weekly"}`

## Monitoring Dashboard

Access the scheduler monitoring dashboard at:
**API Monitoring > Automated Scheduler Tab**

The dashboard displays:
- **Job Status**: Current status of each scheduled job (Success/Failed/Running)
- **Last Run Time**: When each job last executed
- **Success Rate**: Percentage of successful executions
- **Average Execution Time**: How long jobs typically take
- **Total Runs**: Number of times each job has executed
- **Records Processed**: Total number of records ingested
- **Recent Execution Log**: Detailed log of recent job runs

## Database Tables

### job_execution_log
Tracks all job executions with the following fields:
- `id`: Unique identifier
- `job_name`: Name of the scheduled job
- `started_at`: When the job started
- `completed_at`: When the job finished
- `status`: Job status (running, success, failed)
- `records_processed`: Number of records processed
- `error_message`: Error details if job failed
- `execution_time_ms`: How long the job took in milliseconds

## How It Works

1. **pg_cron Extension**: Supabase's built-in cron scheduler triggers jobs
2. **HTTP Invocation**: Jobs are triggered via HTTP POST to edge functions
3. **Logging**: Each job logs its execution to `job_execution_log` table
4. **Monitoring**: Dashboard queries the log table for real-time status
5. **Auto-refresh**: Dashboard updates every 30 seconds

## Manual Trigger

You can still manually trigger all pollers using the "Trigger Data Population" button on the main dashboard.

## Troubleshooting

### Jobs Not Running
1. Check the Automated Scheduler tab for error messages
2. Verify pg_cron is enabled in your Supabase project
3. Check that edge functions are deployed and active

### No Data Appearing
1. Check job execution logs for errors
2. Verify API keys are set correctly in Supabase secrets
3. Check that the `instrument` and `jurisdiction` tables exist

### High Failure Rate
1. Review error messages in the execution log
2. Check API rate limits
3. Verify network connectivity to external APIs

## Benefits

- **Automatic Updates**: Database stays current without manual intervention
- **Staggered Execution**: Jobs run at different times to avoid overload
- **Complete Visibility**: Full monitoring of all scheduled tasks
- **Error Tracking**: Immediate visibility into failures
- **Performance Metrics**: Track execution times and success rates