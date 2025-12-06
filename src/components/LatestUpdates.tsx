import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export const LatestUpdates: React.FC = () => {
  const navigate = useNavigate();
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestUpdates();
  }, []);

  const fetchLatestUpdates = async () => {
    try {
      const { data, error } = await supabase
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
        .limit(3);

      if (error) throw error;

      const formattedUpdates = (data || []).map(item => ({
        id: item.id,
        title: item.title || 'New Regulation',
        jurisdiction: item.jurisdiction?.name || 'Unknown',
        type: item.status === 'open' ? 'urgent' : item.impact === 'high' ? 'important' : 'info',
        time: item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Recently'
      }));

      setUpdates(formattedUpdates);
    } catch (err) {
      console.error('Error fetching updates:', err);
      // Fallback to mock data if error
      setUpdates([
        { id: '1', title: 'New Hemp Testing Requirements', jurisdiction: 'California', type: 'urgent', time: 'Today' },
        { id: '2', title: 'Delta-8 THC Ban Update', jurisdiction: 'New York', type: 'important', time: 'Yesterday' },
        { id: '3', title: 'CBD Labeling Guidelines', jurisdiction: 'Federal', type: 'info', time: '2 days ago' }
      ]);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="bg-gradient-to-r from-[#794108] to-[#E89C5C] text-white py-3 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold whitespace-nowrap">Latest Updates:</span>
          <div className="flex items-center gap-6 animate-scroll">
            {updates.map((update) => {
              const Icon = typeIcons[update.type as keyof typeof typeIcons];
              return (
                <button
                  key={update.id}
                  onClick={() => navigate(`/regulation/${update.id}`)}
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
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
        >
          View All <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};