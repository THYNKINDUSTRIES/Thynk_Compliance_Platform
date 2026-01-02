import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface SearchSuggestion {
  query: string;
  count: number;
}

export const useSearchSuggestions = (currentQuery?: string) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);

        let query = supabase
          .from('search_queries')
          .select('query, search_count')
          .order('search_count', { ascending: false })
          .limit(10);

        // If there's a current query, filter suggestions
        if (currentQuery && currentQuery.trim().length > 0) {
          query = query.ilike('query', `${currentQuery}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        setSuggestions(
          (data || []).map((item) => ({
            query: item.query,
            count: item.search_count,
          }))
        );
      } catch (err) {
        console.error('Error fetching search suggestions:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentQuery]);

  return { suggestions, loading };
};
