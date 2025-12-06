# API Monitoring Dashboard

## Overview
Real-time API monitoring dashboard that tracks edge function performance, error rates, response times, and usage statistics with automated alerting.

## Features

### 1. Real-Time Metrics
- **Total Requests**: Count of all API calls in selected time range
- **Success Rate**: Percentage of successful requests (status < 400)
- **Average Response Time**: Mean response time across all requests
- **Error Count**: Total failed requests (status >= 400)
- **Slow Query Count**: Requests taking >2 seconds

### 2. Visualizations
- **Request Volume Chart**: Line chart showing hourly request trends
  - Total requests per hour
  - Success vs error breakdown
  - Time-series view of API usage

- **Function Performance Chart**: Bar chart showing performance by function
  - Average response time per edge function
  - Top 8 most-called functions
  - Comparative performance analysis

### 3. Alert System
Automated alerts for:
- **Slow Queries**: Response time >2s (medium), >5s (high)
- **Errors**: HTTP 4xx (medium), 5xx (critical)
- **Quota Warnings**: Configurable thresholds

Alert features:
- Real-time notifications
- Severity levels (low, medium, high, critical)
- One-click resolution
- Timestamp tracking

### 4. Time Range Filters
- 1 hour view
- 24 hour view (default)
- 7 day view

## Database Schema

### api_metrics Table
```sql
- id: UUID (primary key)
- function_name: TEXT (edge function name)
- status_code: INTEGER (HTTP status)
- response_time_ms: INTEGER (response time)
- error_message: TEXT (error details)
- request_path: TEXT (endpoint path)
- user_id: UUID (authenticated user)
- created_at: TIMESTAMPTZ
```

### api_alerts Table
```sql
- id: UUID (primary key)
- alert_type: TEXT (slow_query, error, quota_warning)
- severity: TEXT (low, medium, high, critical)
- function_name: TEXT
- message: TEXT
- metadata: JSONB
- resolved: BOOLEAN
- created_at: TIMESTAMPTZ
- resolved_at: TIMESTAMPTZ
```

## RPC Functions

### get_api_metrics_summary(time_range_hours)
Returns aggregate metrics for the dashboard overview cards.

### get_metrics_by_function(time_range_hours)
Returns per-function performance metrics for the bar chart.

### get_hourly_request_volume(hours_back)
Returns hourly request counts for the line chart visualization.

## Edge Function: log-api-metrics

### Purpose
Logs API metrics and creates alerts for performance issues.

### Usage
```javascript
const startTime = Date.now();
try {
  // Your API logic here
  const response = await someOperation();
  
  await supabase.functions.invoke('log-api-metrics', {
    body: {
      function_name: 'my-function',
      status_code: 200,
      response_time_ms: Date.now() - startTime,
      request_path: '/api/endpoint',
      user_id: userId
    }
  });
} catch (error) {
  await supabase.functions.invoke('log-api-metrics', {
    body: {
      function_name: 'my-function',
      status_code: 500,
      response_time_ms: Date.now() - startTime,
      error_message: error.message,
      request_path: '/api/endpoint',
      user_id: userId
    }
  });
}
```

## Components

### APIMetricsCard
Reusable metric display card with:
- Title and value
- Optional icon
- Trend indicators (up/down/neutral)
- Subtitle text

### APIAlertList
Alert management component with:
- Alert type icons
- Severity badges
- Timestamp display
- Resolution actions

### useAPIMetrics Hook
Custom React hook providing:
- Metrics summary
- Function performance data
- Hourly volume data
- Auto-refresh every 30 seconds
- Manual refetch function

## Access
Navigate to `/api-monitoring` or use the "API Monitor" link in the header navigation.

## Performance Considerations
- Metrics auto-refresh every 30 seconds
- Real-time subscriptions for alerts
- Indexed queries for fast retrieval
- RLS policies for security
- Optimized aggregation functions

## Alert Thresholds
- **Slow Query**: >2000ms (medium), >5000ms (high)
- **Error**: 4xx status (medium), 5xx status (critical)
- **Quota**: Configurable per deployment

## Future Enhancements
- Custom alert thresholds
- Email notifications for critical alerts
- Detailed request logs
- API usage quotas and billing
- Comparative analysis (day-over-day, week-over-week)
- Export metrics to CSV/JSON
