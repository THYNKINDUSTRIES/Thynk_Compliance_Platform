import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, XCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  function_name: string;
  message: string;
  created_at: string;
  resolved: boolean;
}

interface APIAlertListProps {
  alerts: Alert[];
  onResolve: (alertId: string) => void;
}

export function APIAlertList({ alerts, onResolve }: APIAlertListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'slow_query': return <Clock className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No active alerts</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="mt-1">{getAlertIcon(alert.alert_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="text-sm font-medium">{alert.function_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!alert.resolved && (
                  <Button size="sm" variant="outline" onClick={() => onResolve(alert.id)}>
                    Resolve
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
