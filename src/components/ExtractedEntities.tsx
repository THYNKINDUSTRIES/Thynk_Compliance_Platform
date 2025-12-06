import React from 'react';
import { ExtractedEntity } from '@/hooks/useRegulations';
import { Badge } from './ui/badge';
import { Calendar, Tag, AlertCircle, DollarSign, FileText, MapPin, Building2, BookOpen, Info, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface Props {
  entities: ExtractedEntity[];
}

const entityIcons: Record<string, any> = {
  product: Tag,
  stage: FileText,
  date: Calendar,
  jurisdiction: MapPin,
  requirement: AlertCircle,
  penalty: DollarSign,
  agency: Building2,
  citation: BookOpen,
  definition: Info,
  exemption: Shield
};

const entityColors: Record<string, string> = {
  product: 'bg-blue-100 text-blue-800 border-blue-300',
  stage: 'bg-purple-100 text-purple-800 border-purple-300',
  date: 'bg-green-100 text-green-800 border-green-300',
  jurisdiction: 'bg-orange-100 text-orange-800 border-orange-300',
  requirement: 'bg-red-100 text-red-800 border-red-300',
  penalty: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  agency: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  citation: 'bg-teal-100 text-teal-800 border-teal-300',
  definition: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  exemption: 'bg-emerald-100 text-emerald-800 border-emerald-300'
};

const entityLabels: Record<string, string> = {
  product: 'Products & Substances',
  stage: 'Regulatory Stage',
  date: 'Important Dates',
  jurisdiction: 'Jurisdiction',
  requirement: 'Requirements',
  penalty: 'Penalties',
  agency: 'Agencies',
  citation: 'Legal Citations',
  definition: 'Definitions',
  exemption: 'Exemptions'
};

export const ExtractedEntities: React.FC<Props> = ({ entities }) => {
  if (!entities || entities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No entities extracted yet. Run NLP analysis on documents to see results.
        </CardContent>
      </Card>
    );
  }

  const groupedEntities = entities.reduce((acc, entity) => {
    if (!acc[entity.entity_type]) {
      acc[entity.entity_type] = [];
    }
    acc[entity.entity_type].push(entity);
    return acc;
  }, {} as Record<string, ExtractedEntity[]>);

  const avgConfidence = entities.reduce((sum, e) => sum + e.confidence_score, 0) / entities.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Extracted Entities</h3>
          <p className="text-sm text-muted-foreground">
            {entities.length} entities extracted • Avg confidence: {Math.round(avgConfidence * 100)}%
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {Object.entries(groupedEntities).map(([type, items]) => {
          const Icon = entityIcons[type];
          const sortedItems = items.sort((a, b) => b.confidence_score - a.confidence_score);
          
          return (
            <Card key={type}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4" />}
                  {entityLabels[type] || type}
                  <Badge variant="secondary" className="ml-auto">
                    {items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {sortedItems.map((entity) => {
                    const metadata = entity.metadata || {};
                    const tooltipContent = Object.entries(metadata)
                      .filter(([_, v]) => v)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('\n');

                    return (
                      <TooltipProvider key={entity.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline"
                              className={`${entityColors[type]} cursor-help`}
                            >
                              <span className="mr-1.5 max-w-[200px] truncate">
                                {entity.entity_value}
                              </span>
                              <span className="text-xs opacity-70 font-mono">
                                {Math.round(entity.confidence_score * 100)}%
                              </span>
                            </Badge>
                          </TooltipTrigger>
                          {tooltipContent && (
                            <TooltipContent className="max-w-xs">
                              <div className="text-xs whitespace-pre-line">
                                {tooltipContent}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
