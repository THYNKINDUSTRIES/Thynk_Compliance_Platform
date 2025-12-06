import React from 'react';
import { Calendar, MapPin, Building, AlertCircle, ExternalLink, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';
import { RegulationTags } from './RegulationTags';

interface RegulationProps {
  regulation: {
    id: string;
    title: string;
    summary: string;
    jurisdiction: string;
    authority: string;
    status: string;
    products: string[];
    stages: string[];
    instrumentType: string;
    publishedAt: string;
    effectiveAt?: string;
    citation?: string;
    url: string;
    impact: 'high' | 'medium' | 'low';
    searchRank?: number;
    headline?: string;
    tags?: Array<{ name: string; confidence?: number }>;
  };
}


export const RegulationCard: React.FC<RegulationProps> = ({ regulation }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    console.log('📄 Regulation card clicked:', regulation.id, regulation.title);
    navigate(`/regulations/${regulation.id}`);
  };


  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('❤️ Favorite clicked for:', regulation.id);
    toast({
      title: 'Added to Favorites',
      description: 'Regulation saved to your dashboard'
    });
  };

  const handleViewSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔗 View source clicked:', regulation.url);
    if (regulation.url && regulation.url !== '#') {
      window.open(regulation.url, '_blank');
    } else {
      toast({
        title: 'Source Unavailable',
        description: 'No external source available for this regulation'
      });
    }
  };

  const impactColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300'
  };

  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800',
    pending: 'bg-orange-100 text-orange-800',
    effective: 'bg-green-100 text-green-800',
    unknown: 'bg-gray-100 text-gray-800'
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6 border border-[#E5DFD6] cursor-pointer"
    >
      {regulation.searchRank && (
        <div className="mb-2">
          <Badge variant="secondary" className="text-xs">
            Search Relevance: {Math.round(regulation.searchRank * 100)}%
          </Badge>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-[#794108] mb-2 hover:text-[#E89C5C] transition-colors">
            {regulation.headline || regulation.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3">{regulation.summary}</p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            onClick={handleFavorite}
            variant="ghost"
            size="sm"
            className="hover:text-red-500"
          >
            <Heart className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleViewSource}
            variant="ghost"
            size="sm"
            className="hover:text-blue-500"
          >
            <ExternalLink className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge className={impactColors[regulation.impact]}>
          <AlertCircle className="w-3 h-3 mr-1" />
          {regulation.impact} impact
        </Badge>
        <Badge className={statusColors[regulation.status] || statusColors.unknown}>
          {regulation.status}
        </Badge>
        <Badge variant="outline">{regulation.instrumentType}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#794108]" />
          <span>{regulation.jurisdiction}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-[#794108]" />
          <span>{regulation.authority}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#794108]" />
          <span>{regulation.publishedAt || 'Not specified'}</span>
        </div>
        {regulation.citation && (
          <div className="text-xs text-gray-500">
            Citation: {regulation.citation}
          </div>
        )}
      </div>

      {regulation.tags && regulation.tags.length > 0 && (
        <div className="mt-4">
          <RegulationTags tags={regulation.tags} maxDisplay={5} />
        </div>
      )}

      {regulation.products.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {regulation.products.map((product, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {product}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
