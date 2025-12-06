import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface JurisdictionFreshness {
  jurisdiction_id: string;
  jurisdiction_name: string;
  jurisdiction_slug: string;
  last_updated: string | null;
  total_instruments: number;
}

export function useJurisdictionFreshness() {
  const [freshness, setFreshness] = useState<JurisdictionFreshness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFreshness();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('ingestion_log_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ingestion_log' },
        () => {
          fetchFreshness();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchFreshness() {
    try {
      const { data, error } = await supabase
        .from('jurisdiction_freshness')
        .select('*');

      if (error) throw error;
      setFreshness(data || []);
    } catch (err) {
      console.error('Error fetching freshness:', err);
    } finally {
      setLoading(false);
    }
  }

  return { freshness, loading };
}
