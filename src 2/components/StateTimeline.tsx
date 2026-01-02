import { TimelineEntry } from '@/data/stateDetails';
import { Badge } from './ui/badge';
import { ExternalLink } from 'lucide-react';

interface StateTimelineProps {
  timeline: TimelineEntry[];
}

export const StateTimeline = ({ timeline }: StateTimelineProps) => {
  const getTypeColor = (type: string) => {
    const colors = { rule: 'bg-blue-100 text-blue-800', bill: 'bg-purple-100 text-purple-800', enforcement: 'bg-red-100 text-red-800', guidance: 'bg-green-100 text-green-800' };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getImpactColor = (impact: string) => {
    const colors = { high: 'border-red-500', medium: 'border-yellow-500', low: 'border-green-500' };
    return colors[impact as keyof typeof colors] || 'border-gray-300';
  };

  return (
    <div className="space-y-4">
      {timeline.map((entry, idx) => (
        <div key={entry.id} className={`border-l-4 ${getImpactColor(entry.impact)} pl-4 py-3 bg-white rounded-r-lg shadow-sm hover:shadow-md transition-shadow`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-500">{entry.date}</span>
                <Badge className={getTypeColor(entry.type)}>{entry.type}</Badge>
                <Badge variant="outline">{entry.status}</Badge>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{entry.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{entry.summary}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {entry.products.map(p => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{entry.citation}</span>
                <a href={entry.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                  View Source <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
