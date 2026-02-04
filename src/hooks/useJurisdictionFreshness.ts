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
      // Query directly from tables instead of the problematic view
      const { data, error } = await supabase
        .from('jurisdiction')
        .select(`
          id as jurisdiction_id,
          name as jurisdiction_name,
          slug as jurisdiction_slug,
          instrument!left (
            id,
            published_at,
            created_at
          )
        `);

      if (error) {
        console.error('Error fetching freshness:', error);
        setFreshness([]);
        return;
      }

      // Process the data to match the interface
      const processedData = (data || []).map(jurisdiction => {
        const instruments = jurisdiction.instrument || [];
        const lastUpdated = instruments.length > 0 
          ? instruments.reduce((latest, inst) => {
              const instDate = inst.published_at || inst.created_at;
              return instDate && (!latest || new Date(instDate) > new Date(latest)) 
                ? instDate 
                : latest;
            }, null)
          : null;

        return {
          jurisdiction_id: jurisdiction.jurisdiction_id,
          jurisdiction_name: jurisdiction.jurisdiction_name,
          jurisdiction_slug: jurisdiction.jurisdiction_slug,
          last_updated: lastUpdated,
          total_instruments: instruments.length
        };
      });

      setFreshness(processedData);
    } catch (err) {
      console.error('Error fetching freshness:', err);
      setFreshness([]);
    } finally {
      setLoading(false);
    }
  }


  return { freshness, loading };
}
