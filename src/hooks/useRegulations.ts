import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Regulation {
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
  nlp_analyzed?: boolean;
  nlp_analyzed_at?: string;
  searchRank?: number;
  headline?: string;
  tags?: Array<{ name: string; confidence?: number }>;
}


export interface RegulationFilters {
  search?: string;
  products?: string[];
  stages?: string[];
  types?: string[];
  jurisdiction?: string;
  jurisdictions?: string[];
  authorities?: string[];
  statuses?: string[];
  impactLevels?: string[];
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}


export const useRegulations = (filters?: RegulationFilters) => {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegulations = async () => {
      console.log('📊 useRegulations: Fetching with filters:', filters);
      try {
        setLoading(true);
        setError(null);

        if (filters?.search && filters.search.trim().length > 0) {
          console.log('🔍 Using full-text search for:', filters.search);
          
          const { data: searchResults, error: searchError } = await supabase
            .rpc('search_instruments', {
              search_query: filters.search,
              jurisdiction_filter: filters.jurisdiction || null,
              limit_count: 100
            });

          if (searchError) {
            console.error('❌ Search error:', searchError);
            throw searchError;
          }

          console.log('✅ Search returned', searchResults?.length || 0, 'results');

          supabase.rpc('increment_search_count', { search_query: filters.search }).then();

          // Fetch full details including URLs for search results
          const ids = (searchResults || []).map((r: any) => r.id);
          let detailedData: any[] = [];
          
          if (ids.length > 0) {
            const { data: fullData } = await supabase
              .from('instrument')
              .select('id, url')
              .in('id', ids);
            
            detailedData = fullData || [];
          }

          let transformedData: Regulation[] = (searchResults || []).map((item: any) => {
            const fullRecord = detailedData.find((d: any) => d.id === item.id);
            return {
              id: item.id,
              title: item.title,
              summary: item.summary || '',
              jurisdiction: item.jurisdiction || 'Unknown',
              authority: item.authority || 'Unknown',
              status: item.status || 'unknown',
              products: item.product ? [item.product] : [],
              stages: item.stage ? [item.stage] : [],
              instrumentType: item.type || 'Unknown',
              publishedAt: item.effective_date?.split('T')[0] || '',
              effectiveAt: item.effective_date?.split('T')[0],
              citation: item.citation,
              url: fullRecord?.url || '#',
              impact: item.impact || 'medium',
              searchRank: item.rank,
              headline: item.headline,
            };
          });


          transformedData = applyClientFilters(transformedData, filters);
          console.log('✅ After client filters:', transformedData.length, 'regulations');
          setRegulations(transformedData);
        } else {
          console.log('📋 Using standard query (no search)');
          
          let query = supabase
            .from('instrument')
            .select(`
              id, title, summary, status, products, stages,
              instrument_type, published_at, effective_at,
              citation, url, impact, nlp_analyzed, nlp_analyzed_at,
              jurisdiction:jurisdiction_id(name),
              authority:authority_id(acronym)
            `)
            .order('published_at', { ascending: false });

          if (filters?.dateFrom) {
            console.log('📅 Filtering from date:', filters.dateFrom);
            query = query.gte('published_at', filters.dateFrom);
          }
          if (filters?.dateTo) {
            console.log('📅 Filtering to date:', filters.dateTo);
            query = query.lte('published_at', filters.dateTo);
          }
          if (filters?.statuses?.length) {
            console.log('📊 Filtering by statuses:', filters.statuses);
            query = query.in('status', filters.statuses);
          }
          if (filters?.impactLevels?.length) {
            console.log('⚠️ Filtering by impact:', filters.impactLevels);
            query = query.in('impact', filters.impactLevels);
          }

          const { data, error: fetchError } = await query;
          if (fetchError) {
            console.error('❌ Fetch error:', fetchError);
            throw fetchError;
          }

          console.log('✅ Query returned', data?.length || 0, 'regulations');

          let transformedData: Regulation[] = (data || []).map((item: any) => ({
            id: item.id,
            title: item.title,
            summary: item.summary || '',
            jurisdiction: item.jurisdiction?.name || 'Unknown',
            authority: item.authority?.acronym || 'Unknown',
            status: item.status || 'unknown',
            products: item.products || [],
            stages: item.stages || [],
            instrumentType: item.instrument_type || 'Unknown',
            publishedAt: item.published_at?.split('T')[0] || '',
            effectiveAt: item.effective_at?.split('T')[0],
            citation: item.citation,
            url: item.url || '#',
            impact: item.impact || 'medium',
            nlp_analyzed: item.nlp_analyzed || false,
            nlp_analyzed_at: item.nlp_analyzed_at,
          }));

          transformedData = applyClientFilters(transformedData, filters);
          console.log('✅ After client filters:', transformedData.length, 'regulations');
          setRegulations(transformedData);
        }
      } catch (err: any) {
        console.error('❌ Fatal error fetching regulations:', err);
        setError(err.message || 'Failed to fetch regulations');
      } finally {
        setLoading(false);
      }
    };

    fetchRegulations();
  }, [
    filters?.search,
    filters?.products?.join(','),
    filters?.stages?.join(','),
    filters?.types?.join(','),
    filters?.jurisdiction,
    filters?.jurisdictions?.join(','),
    filters?.authorities?.join(','),
    filters?.statuses?.join(','),
    filters?.impactLevels?.join(','),
    filters?.dateFrom,
    filters?.dateTo,
    filters?.tags?.join(','),
  ]);

  return { regulations, loading, error };
};

function applyClientFilters(data: Regulation[], filters?: RegulationFilters): Regulation[] {
  let result = data;
  
  // First, deduplicate by ID to prevent duplicate display
  const seenIds = new Set<string>();
  result = result.filter((reg) => {
    if (seenIds.has(reg.id)) {
      console.log('🔧 Removing duplicate regulation:', reg.id, reg.title);
      return false;
    }
    seenIds.add(reg.id);
    return true;
  });
  
  // Filter out irrelevant topics (wildlife, oceans, etc.)
  const irrelevantKeywords = [
    'wildlife', 'ocean', 'marine', 'fishery', 'fisheries', 'hunting', 'fishing',
    'endangered species', 'conservation', 'forestry', 'timber', 'mining', 'coal',
    'petroleum', 'natural gas', 'oil and gas', 'endangered', 'migratory bird'
  ];
  
  result = result.filter((reg) => {
    const textToCheck = `${reg.title} ${reg.summary}`.toLowerCase();
    const hasIrrelevantKeyword = irrelevantKeywords.some(keyword => 
      textToCheck.includes(keyword.toLowerCase())
    );
    
    if (hasIrrelevantKeyword) {
      console.log('🔧 Filtering out irrelevant regulation:', reg.title);
      return false;
    }
    return true;
  });
  
  // Handle single jurisdiction filter (from StateDetail page)
  if (filters?.jurisdiction) {
    console.log('🔧 Client filter: jurisdiction (singular)', filters.jurisdiction);
    result = result.filter((reg) => reg.jurisdiction === filters.jurisdiction);
  }
  
  // Handle multiple jurisdictions filter
  if (filters?.jurisdictions?.length) {
    console.log('🔧 Client filter: jurisdictions (plural)', filters.jurisdictions);
    result = result.filter((reg) => filters.jurisdictions!.includes(reg.jurisdiction));
  }
  if (filters?.authorities?.length) {
    console.log('🔧 Client filter: authorities', filters.authorities);
    result = result.filter((reg) => filters.authorities!.includes(reg.authority));
  }
  if (filters?.products?.length) {
    console.log('🔧 Client filter: products', filters.products);
    result = result.filter((reg) => filters.products!.some((p) => reg.products.includes(p)));
  }
  if (filters?.stages?.length) {
    console.log('🔧 Client filter: stages', filters.stages);
    result = result.filter((reg) => filters.stages!.some((s) => reg.stages.includes(s)));
  }
  if (filters?.types?.length) {
    console.log('🔧 Client filter: types', filters.types);
    result = result.filter((reg) => filters.types!.includes(reg.instrumentType));
  }
  if (filters?.tags?.length) {
    console.log('🔧 Client filter: tags', filters.tags);
    result = result.filter((reg) => 
      reg.tags?.some((tag) => filters.tags!.includes(tag.name))
    );
  }
  
  return result;
}

