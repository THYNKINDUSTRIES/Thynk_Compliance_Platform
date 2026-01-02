import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Clock, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Update {
  id: string;
  title: string;
  jurisdiction: string;
  type: 'urgent' | 'important' | 'info';
  time: string;
}

export const LatestUpdates: React.FC = () => {
  const navigate = useNavigate();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestUpdates();
  }, []);

  const fetchLatestUpdates = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('instrument')
        .select(`
          id,
          title,
          jurisdiction:jurisdiction_id(name),
          published_at,
          status,
          impact
        `)
        .order('published_at', { ascending: false })
        .limit(5);

      if (fetchError) {
        console.error('[LatestUpdates] Fetch error:', fetchError);
        throw fetchError;
      }

      if (!data || data.length === 0) {
        setUpdates([]);
        return;
      }

      const formattedUpdates: Update[] = data.map(item => ({
        id: item.id,
        title: item.title || 'New Regulation',
        jurisdiction: (item.jurisdiction as { name?: string })?.name || 'Unknown',
        type: item.status === 'open' ? 'urgent' : item.impact === 'high' ? 'important' : 'info',
        time: item.published_at ? formatRelativeTime(item.published_at) : 'Recently'
      }));

      setUpdates(formattedUpdates);
    } catch (err) {
      console.error('[LatestUpdates] Error:', err);
      setError('Unable to load updates');
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const typeColors = {
    urgent: 'bg-red-500',
    important: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const typeIcons = {
    urgent: AlertCircle,
    important: TrendingUp,
    info: Clock
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-[#794108] to-[#E89C5C] text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="ml-2">Loading updates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-[#794108] to-[#E89C5C] text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
          <button 
            onClick={fetchLatestUpdates}
            className="ml-4 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="bg-gradient-to-r from-[#794108] to-[#E89C5C] text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Clock className="w-5 h-5 mr-2" />
          <span>No recent updates available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#794108] to-[#E89C5C] text-white py-3 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold whitespace-nowrap">Latest Updates:</span>
          <div className="flex items-center gap-6 animate-scroll">
            {updates.map((update) => {
              const Icon = typeIcons[update.type];
              return (
                <button
                  key={update.id}
                  onClick={() => navigate(`/regulations/${update.id}`)}
                  className="flex items-center gap-2 whitespace-nowrap hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{update.title}</span>
                  <span className="text-xs opacity-75">({update.jurisdiction})</span>
                  <span className="text-xs opacity-60">• {update.time}</span>
                </button>
              );
            })}
          </div>
        </div>
        <button 
          onClick={() => navigate('/app')}
          className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
        >
          View All <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
