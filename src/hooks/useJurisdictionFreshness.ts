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
      // First get all jurisdictions
      const { data: jurisdictions, error: jError } = await supabase
        .from('jurisdiction')
        .select('id, name, slug')
        .order('name');

      if (jError) {
        console.error('Error fetching jurisdictions:', jError);
        setFreshness([]);
        return;
      }

      // For each jurisdiction, get instrument count and latest date
      const processedData: JurisdictionFreshness[] = await Promise.all(
        (jurisdictions || []).map(async (j) => {
          // Get count
          const { count } = await supabase
            .from('instrument')
            .select('*', { count: 'exact', head: true })
            .eq('jurisdiction_id', j.id);

          // Get latest instrument date
          let lastUpdated: string | null = null;
          try {
            const { data: latest } = await supabase
              .from('instrument')
              .select('created_at, updated_at, effective_date')
              .eq('jurisdiction_id', j.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (latest && latest.length > 0) {
              lastUpdated = latest[0].updated_at || latest[0].created_at || latest[0].effective_date || null;
            }
          } catch {
            // Ignore individual lookup errors
          }

          return {
            jurisdiction_id: j.id,
            jurisdiction_name: j.name,
            jurisdiction_slug: j.slug,
            last_updated: lastUpdated,
            total_instruments: count || 0
          };
        })
      );

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
