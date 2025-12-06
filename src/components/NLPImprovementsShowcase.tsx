import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export const NLPImprovementsShowcase: React.FC = () => {
  const improvements = [
    {
      category: 'AI Model',
      before: 'GPT-4o-mini',
      after: 'GPT-4o',
      impact: 'Higher accuracy'
    },
    {
      category: 'Entity Types',
      before: '6 types',
      after: '10 types',
      impact: '+67% coverage'
    },
    {
      category: 'Context Window',
      before: '8,000 chars',
      after: '12,000 chars',
      impact: '+50% capacity'
    },
    {
      category: 'Confidence Scoring',
      before: 'Basic',
      after: 'Advanced with filtering',
      impact: 'More reliable'
    }
  ];

  const newFeatures = [
    'Agencies & Departments',
    'Legal Citations',
    'Term Definitions',
    'Exemptions & Exceptions',
    'Enhanced Metadata',
    'Batch Processing'
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Key Improvements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {improvements.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="font-medium text-sm text-gray-700">{item.category}</div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-gray-100">
                  {item.before}
                </Badge>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  {item.after}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">{item.impact}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            New Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {newFeatures.map((feature, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 text-sm p-2 bg-green-50 border border-green-200 rounded"
              >
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
