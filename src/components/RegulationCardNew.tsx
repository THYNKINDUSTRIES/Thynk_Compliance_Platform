import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Regulation } from '@/hooks/useRegulations';
import { Badge } from './ui/badge';

interface Props {
  regulation: Regulation;
}

export const RegulationCardNew: React.FC<Props> = ({ regulation }) => {
  const navigate = useNavigate();
  const tags = [...(regulation.products || []), ...(regulation.stages || [])];
  
  return (
    <div 
      onClick={() => navigate(`/regulations/${regulation.id}`)}
      className="bg-white rounded-lg p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer border border-[#E5DFD6] hover:border-[#E89C5C]"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-[#794108] text-lg mb-1">{regulation.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="font-medium">{regulation.jurisdiction}</span>
            <span>•</span>
            <span>{regulation.authority}</span>
            <span>•</span>
            <Badge variant="outline" className="text-xs">{regulation.instrumentType}</Badge>
          </div>
        </div>
      </div>
      <p className="text-gray-700 text-sm mb-3 line-clamp-2">{regulation.summary}</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.slice(0, 5).map((tag, idx) => (
            <Badge key={`${tag}-${idx}`} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 5 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 5} more
            </Badge>
          )}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Published: {regulation.publishedAt}</span>
        {regulation.effectiveAt && (
          <span className="font-medium text-amber-600">
            Effective: {regulation.effectiveAt}
          </span>
        )}
      </div>
    </div>
  );
};
