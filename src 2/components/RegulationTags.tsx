import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';

interface RegulationTagsProps {
  tags: Array<{
    name: string;
    confidence?: number;
  }>;
  maxDisplay?: number;
}

const tagColors: Record<string, string> = {
  'licensing': 'bg-blue-100 text-blue-800 border-blue-300',
  'testing': 'bg-purple-100 text-purple-800 border-purple-300',
  'packaging': 'bg-green-100 text-green-800 border-green-300',
  'labeling': 'bg-green-100 text-green-800 border-green-300',
  'cultivation': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'manufacturing': 'bg-orange-100 text-orange-800 border-orange-300',
  'retail': 'bg-pink-100 text-pink-800 border-pink-300',
  'distribution': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'medical': 'bg-red-100 text-red-800 border-red-300',
  'recreational': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'compliance': 'bg-slate-100 text-slate-800 border-slate-300',
  'safety': 'bg-red-100 text-red-800 border-red-300',
};

export function RegulationTags({ tags, maxDisplay = 4 }: RegulationTagsProps) {
  if (!tags || tags.length === 0) return null;

  const displayTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <Tag className="h-3 w-3 text-gray-400" />
      {displayTags.map((tag, index) => (
        <Badge
          key={index}
          variant="outline"
          className={`text-xs ${tagColors[tag.name] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
        >
          {tag.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
