import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TimelineEntry } from '@/data/stateDetails';
import { Calendar } from 'lucide-react';

interface ComparisonTimelineProps {
  state1Name: string;
  state2Name: string;
  state1Timeline: TimelineEntry[];
  state2Timeline: TimelineEntry[];
}

export default function ComparisonTimeline({ 
  state1Name, 
  state2Name, 
  state1Timeline, 
  state2Timeline 
}: ComparisonTimelineProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {state1Name} Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {state1Timeline.slice(0, 3).map((entry) => (
            <div key={entry.id} className="border-l-2 border-primary pl-4 pb-3">
              <div className="text-xs text-muted-foreground mb-1">{entry.date}</div>
              <div className="font-semibold text-sm mb-1">{entry.title}</div>
              <Badge variant="outline" className="text-xs">{entry.type}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {state2Name} Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {state2Timeline.slice(0, 3).map((entry) => (
            <div key={entry.id} className="border-l-2 border-primary pl-4 pb-3">
              <div className="text-xs text-muted-foreground mb-1">{entry.date}</div>
              <div className="font-semibold text-sm mb-1">{entry.title}</div>
              <Badge variant="outline" className="text-xs">{entry.type}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
