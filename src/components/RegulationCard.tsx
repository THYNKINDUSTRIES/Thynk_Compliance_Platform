import React from 'react';
import { Calendar, MapPin, Building, AlertCircle, ExternalLink, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';
import { RegulationTags } from './RegulationTags';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface RegulationProps {
  regulation: {
    id: string;
    title: string;
    summary?: string;
    description?: string;
    jurisdiction: string;
    authority?: string;
    status?: string;
    products?: string[];
    stages?: string[];
    instrumentType?: string;
    type?: string;
    publishedAt?: string;
    publishedDate?: string;
    effectiveAt?: string;
    effectiveDate?: string;
    citation?: string;
    url?: string;
    sourceUrl?: string;
    impact?: 'high' | 'medium' | 'low';
    impactLevel?: string;
    searchRank?: number;
    headline?: string;
    tags?: Array<{ name: string; confidence?: number }> | string[];
  };
}

export const RegulationCard: React.FC<RegulationProps> = ({ regulation }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Normalize field names to handle different data formats
  const summary = regulation.summary || regulation.description || '';
  const instrumentType = regulation.instrumentType || regulation.type || 'Regulation';
  const publishedAt = regulation.publishedAt || regulation.publishedDate || '';
  const effectiveAt = regulation.effectiveAt || regulation.effectiveDate || '';
  const url = regulation.url || regulation.sourceUrl || '';
  const impact = (regulation.impact || regulation.impactLevel?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low';
  const authority = regulation.authority || 'State Agency';
  const status = regulation.status || 'effective';
  const products = regulation.products || [];

  // Normalize tags
  const tags = regulation.tags?.map(t => 
    typeof t === 'string' ? { name: t } : t
  ) || [];

  const handleCardClick = () => {
    console.log('📄 Regulation card clicked:', regulation.id, regulation.title);
    navigate(`/regulations/${regulation.id}`);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('❤️ Favorite clicked for:', regulation.id);
    
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save favorites',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_favorites')
        .upsert({
          user_id: user.id,
          instrument_id: regulation.id,
        }, { onConflict: 'user_id,instrument_id' });

      if (error) throw error;

      toast({
        title: 'Added to Favorites',
        description: 'Regulation saved to your dashboard'
      });
    } catch (err: any) {
      console.error('Error saving favorite:', err);
      toast({
        title: 'Error',
        description: 'Failed to save favorite',
        variant: 'destructive'
      });
    }
  };

  const handleViewSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔗 View source clicked:', url);
    if (url && url !== '#') {
      window.open(url, '_blank');
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

  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800',
    pending: 'bg-orange-100 text-orange-800',
    effective: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    unknown: 'bg-gray-100 text-gray-800'
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
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
          <p className="text-gray-600 text-sm line-clamp-3">{summary}</p>
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
          {url && (
            <Button
              onClick={handleViewSource}
              variant="ghost"
              size="sm"
              className="hover:text-blue-500"
            >
              <ExternalLink className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge className={impactColors[impact]}>
          <AlertCircle className="w-3 h-3 mr-1" />
          {impact} impact
        </Badge>
        <Badge className={statusColors[status.toLowerCase()] || statusColors.unknown}>
          {status}
        </Badge>
        <Badge variant="outline">{instrumentType}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#794108]" />
          <span>{regulation.jurisdiction}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-[#794108]" />
          <span>{authority}</span>
        </div>

        {/* Date Section */}
        <div className="col-span-2 space-y-1">
          {publishedAt ? (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#794108]" />
              <span>Published: {formatDate(publishedAt)}</span>
            </div>
          ) : null}
          {effectiveAt ? (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#794108]" />
              <span>Effective: {formatDate(effectiveAt)}</span>
            </div>
          ) : null}
          {!publishedAt && !effectiveAt && (
            <div className="flex items-center gap-2 text-gray-400 italic">
              <Calendar className="w-4 h-4 text-[#794108]" />
              <span>Date not available</span>
            </div>
          )}
        </div>

        {regulation.citation && (
          <div className="col-span-2 text-xs text-gray-500">
            Citation: {regulation.citation}
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-4">
          <RegulationTags tags={tags} maxDisplay={5} />
        </div>
      )}

      {products.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {products.map((product, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {product}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
