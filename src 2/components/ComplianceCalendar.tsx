import { ComplianceDeadline } from '@/data/stateDetails';
import { Badge } from './ui/badge';
import { Calendar, AlertCircle } from 'lucide-react';

interface ComplianceCalendarProps {
  deadlines: ComplianceDeadline[];
}

export const ComplianceCalendar = ({ deadlines }: ComplianceCalendarProps) => {
  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'bg-red-50 border-red-200 text-red-900',
      important: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      routine: 'bg-blue-50 border-blue-200 text-blue-900'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-50 border-gray-200';
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'critical') return <AlertCircle className="w-5 h-5 text-red-600" />;
    return <Calendar className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="space-y-3">
      {deadlines.map(deadline => (
        <div key={deadline.id} className={`border-2 rounded-lg p-4 ${getPriorityColor(deadline.priority)}`}>
          <div className="flex items-start gap-3">
            {getPriorityIcon(deadline.priority)}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{deadline.title}</h4>
                <Badge variant="outline" className="text-xs">{deadline.date}</Badge>
              </div>
              <p className="text-sm mb-2">{deadline.description}</p>
              <div className="flex flex-wrap gap-1">
                {deadline.products.map(p => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
