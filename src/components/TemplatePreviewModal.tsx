import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Star } from 'lucide-react';

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

  const groupedItems = template.template_items.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
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
              <span className="text-sm font-medium">{template.average_rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({template.rating_count} ratings)</span>
            </div>
            <span className="text-sm text-muted-foreground">• {template.usage_count} uses</span>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]: [string, any]) => (
              <div key={category}>
                <h3 className="font-semibold mb-3">{category}</h3>
                <div className="space-y-2">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-3 p-3 border rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge className={priorityColors[item.priority]} variant="outline">
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => { onGenerate(template); onClose(); }}>
            Generate Checklist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
