import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Star, FileText } from 'lucide-react';

interface TemplatePreviewModalProps {
  template: any;
  open: boolean;
  onClose: () => void;
  onGenerate: (template: any) => void;
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
};

export default function TemplatePreviewModal({ template, open, onClose, onGenerate }: TemplatePreviewModalProps) {
  if (!template) return null;

  // Ensure template_items is always an array
  const templateItems = Array.isArray(template.template_items) ? template.template_items : [];
  const averageRating = template.average_rating || 0;
  const ratingCount = template.rating_count || 0;
  const usageCount = template.usage_count || 0;

  // Group items by category
  const groupedItems = templateItems.reduce((acc: Record<string, any[]>, item: any) => {
    const category = item.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({ratingCount} ratings)</span>
            </div>
            <span className="text-sm text-muted-foreground">• {usageCount} uses</span>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {templateItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4" />
              <p>No checklist items defined for this template</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]: [string, any[]]) => (
                <div key={category}>
                  <h3 className="font-semibold mb-3 capitalize">{category}</h3>
                  <div className="space-y-2">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-3 p-3 border rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium">{item.title || 'Untitled Item'}</h4>
                            <Badge className={priorityColors[item.priority] || priorityColors.medium} variant="outline">
                              {item.priority || 'medium'}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => { onGenerate(template); onClose(); }} disabled={templateItems.length === 0}>
            Generate Checklist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
