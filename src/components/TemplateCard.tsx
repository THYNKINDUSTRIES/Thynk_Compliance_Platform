import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Users, Eye } from 'lucide-react';

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description: string;
    business_type: string;
    category: string;
    usage_count: number;
    average_rating: number;
    rating_count: number;
    template_items: any[];
  };
  onPreview: (template: any) => void;
  onGenerate: (template: any) => void;
}

const businessTypeLabels: Record<string, string> = {
  cultivator: 'Cultivator',
  manufacturer: 'Manufacturer',
  retailer: 'Retailer',
  testing_lab: 'Testing Lab',
  all: 'All Types'
};

const categoryLabels: Record<string, string> = {
  new_license: 'New License',
  annual_renewal: 'Annual Renewal',
  inspection_prep: 'Inspection Prep',
  product_launch: 'Product Launch',
  general: 'General'
};

export default function TemplateCard({ template, onPreview, onGenerate }: TemplateCardProps) {
  // Ensure template_items is always an array
  const templateItems = Array.isArray(template.template_items) ? template.template_items : [];
  const averageRating = template.average_rating || 0;
  const ratingCount = template.rating_count || 0;
  const usageCount = template.usage_count || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline">{categoryLabels[template.category] || template.category}</Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{averageRating.toFixed(1)}</span>
            <span>({ratingCount})</span>
          </div>
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{businessTypeLabels[template.business_type] || template.business_type}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{usageCount} uses</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {templateItems.length} checklist items
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPreview(template)} className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" onClick={() => onGenerate(template)} className="flex-1">
              Generate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
