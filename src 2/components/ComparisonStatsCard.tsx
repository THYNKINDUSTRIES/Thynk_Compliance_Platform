import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ComparisonStatsCardProps {
  title: string;
  state1Value: string | number;
  state2Value: string | number;
  state1Name: string;
  state2Name: string;
  icon: LucideIcon;
}

export default function ComparisonStatsCard({ 
  title, 
  state1Value, 
  state2Value, 
  state1Name, 
  state2Name, 
  icon: Icon 
}: ComparisonStatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">{state1Name}</div>
            <div className="text-2xl font-bold">{state1Value}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">{state2Name}</div>
            <div className="text-2xl font-bold">{state2Value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
