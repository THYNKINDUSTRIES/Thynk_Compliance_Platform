import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  cacheManager, 
  generateCacheKey, 
  CACHE_TTL, 
  getCacheStats,
  invalidateCacheByPrefix 
} from '@/lib/cache';

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

export interface Regulation {
  id: string;
  title: string;
  summary: string;
  citation: string;
  jurisdiction: string;
  jurisdiction_id?: string;
  authority: string;
  status: string;
  type: string;
  impactLevel: string;
  effectiveDate: string;
  publishedDate: string;
  products: string[];
  tags: string[];
  sourceUrl?: string;
  documentNumber?: string;
}

// Cache key prefix for regulations
const CACHE_PREFIX = 'regulations';

// Product keyword map — used to infer products from title/description when metadata is missing
const PRODUCT_KEYWORDS: Record<string, string[]> = {
  'Hemp': ['hemp', 'cbd', 'cannabidiol', 'industrial hemp'],
  'Cannabis': ['cannabis', 'marijuana', 'marihuana', 'weed'],
  'Delta-8': ['delta-8', 'delta 8', 'd8', 'delta-8-thc', 'delta-8 thc'],
  'Kratom': ['kratom', 'mitragynine', 'mitragyna speciosa'],
  'Psychedelics': ['psychedelic', 'psilocybin', 'psilocin', 'ketamine', 'mdma', 'mescaline', 'lsd', 'ayahuasca', 'ibogaine', 'dmt'],
  'Nicotine': ['nicotine', 'vape', 'vaping', 'e-cigarette', 'tobacco', 'cigarette', 'cigar', 'smokeless'],
  'Edibles': ['edible', 'edibles', 'infused food', 'cannabis-infused', 'thc gummies', 'thc beverage'],
  'Kava': ['kava', 'kava kava', 'kavalactone', 'piper methysticum'],
};

// Infer products from text content
const inferProducts = (title: string, description: string): string[] => {
  const text = `${title} ${description}`.toLowerCase();
  const matched: string[] = [];
  for (const [product, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      matched.push(product);
    }
  }
  return matched;
};

// Transform raw data to Regulation format
const transformData = (data: any[]): Regulation[] => {
  return data.map(item => {
    // Handle jurisdiction - could be from a join or just the ID
    let jurisdictionName = 'Federal';
    if (item.jurisdiction && typeof item.jurisdiction === 'object' && item.jurisdiction.name) {
      jurisdictionName = item.jurisdiction.name;
    } else if (item.jurisdiction_name) {
      jurisdictionName = item.jurisdiction_name;
    } else if (typeof item.jurisdiction === 'string') {
      jurisdictionName = item.jurisdiction;
    }

    // Extract products from metadata if available
    let products: string[] = [];
    if (item.products && Array.isArray(item.products)) {
      products = item.products;
    } else if (item.metadata?.category) {
      products = [item.metadata.category];
    } else if (item.metadata?.products && Array.isArray(item.metadata.products)) {
      products = item.metadata.products;
    }

    // Fallback: infer products from title/description when metadata is missing
    if (products.length === 0) {
      const desc = item.summary || item.abstract || item.description || item.content || '';
      products = inferProducts(item.title || '', desc);
    }

    // Extract tags from metadata if available
    let tags: string[] = [];
    if (item.tags && Array.isArray(item.tags)) {
      tags = item.tags;
    } else if (item.metadata?.topic) {
      tags = [item.metadata.topic];
    } else if (item.metadata?.tags && Array.isArray(item.metadata.tags)) {
      tags = item.metadata.tags;
    }

    // Get effective date - handle both effective_date and effective_at
    const effectiveDate = item.effective_date || item.effective_at || item.publication_date || new Date().toISOString().split('T')[0];
    
    // Get published date - check published_at (DB column), published_date, publication_date, then created_at
    const publishedDate = item.published_at || item.published_date || item.publication_date || item.created_at || new Date().toISOString().split('T')[0];

    return {
      id: item.id || item.document_number || item.external_id || String(Math.random()),
      title: item.title || 'Untitled',
      summary: item.summary || item.abstract || item.description || '',
      citation: item.citation || item.document_number || item.external_id || '',
      jurisdiction: jurisdictionName,
      jurisdiction_id: item.jurisdiction_id,
      authority: item.authority || item.agency || item.source || item.metadata?.agency_name || 'Unknown',
      status: item.status || 'Active',
      type: item.type || item.document_type || item.instrument_type || item.metadata?.document_type || 'Rule',
      impactLevel: item.impact_level || item.metadata?.impact || item.metadata?.cannabis_status || 'Medium',
      effectiveDate: effectiveDate,
      publishedDate: publishedDate,
      products: products,
      tags: tags,
      sourceUrl: item.source_url || item.html_url || item.url || '',
      documentNumber: item.document_number || item.external_id || '',
    };
  });
};


// Apply client-side filters to regulations
const applyClientFilters = (data: Regulation[], filters: RegulationFilters): Regulation[] => {
  let result = [...data];

  if (filters.products?.length) {
    result = result.filter(reg => 
      reg.products.some(p => filters.products!.some(fp => 
        p.toLowerCase().includes(fp.toLowerCase()) || fp.toLowerCase().includes(p.toLowerCase())
      ))
    );
  }
  if (filters.stages?.length) {
    result = result.filter(reg => filters.stages!.includes(reg.status));
  }
  if (filters.types?.length) {
    result = result.filter(reg => filters.types!.includes(reg.type));
  }
  if (filters.jurisdiction) {
    result = result.filter(reg => reg.jurisdiction === filters.jurisdiction);
  }
  if (filters.jurisdictions?.length) {
    result = result.filter(reg => filters.jurisdictions!.includes(reg.jurisdiction));
  }
  if (filters.authorities?.length) {
    result = result.filter(reg => filters.authorities!.includes(reg.authority));
  }
  if (filters.statuses?.length) {
    result = result.filter(reg => 
      filters.statuses!.some(s => reg.status.toLowerCase() === s.toLowerCase())
    );
  }
  if (filters.impactLevels?.length) {
    result = result.filter(reg => 
      filters.impactLevels!.some(i => reg.impactLevel.toLowerCase() === i.toLowerCase())
    );
  }
  if (filters.dateFrom) {
    result = result.filter(reg => reg.effectiveDate >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    result = result.filter(reg => reg.effectiveDate <= filters.dateTo!);
  }
  if (filters.tags?.length) {
    result = result.filter(reg => reg.tags.some(t => filters.tags!.includes(t)));
  }

  return result;
};

export const useRegulations = (filters?: RegulationFilters) => {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const safeFilters: RegulationFilters = {
    search: filters?.search || '',
    products: filters?.products || [],
    stages: filters?.stages || [],
    types: filters?.types || [],
    jurisdiction: filters?.jurisdiction || '',
    jurisdictions: filters?.jurisdictions || [],
    authorities: filters?.authorities || [],
    statuses: filters?.statuses || [],
    impactLevels: filters?.impactLevels || [],
    dateFrom: filters?.dateFrom || '',
    dateTo: filters?.dateTo || '',
    tags: filters?.tags || [],
  };

  const prevFiltersRef = useRef<RegulationFilters>(safeFilters);

  // Function to invalidate cache (useful for manual refresh)
  const invalidateCache = useCallback(async () => {
    await invalidateCacheByPrefix(CACHE_PREFIX);
    console.log('🔄 Regulations cache invalidated');
  }, []);

  // Function to force refresh data
  const refresh = useCallback(async () => {
    await invalidateCache();
    // Trigger re-fetch by updating a dependency
    setFromCache(false);
  }, [invalidateCache]);

  useEffect(() => {
    const currentStr = JSON.stringify(safeFilters);
    const prevStr = JSON.stringify(prevFiltersRef.current);

    if (currentStr === prevStr && regulations.length > 0) {
      return;
    }

    prevFiltersRef.current = safeFilters;

    const fetchRegulations = async () => {
      setLoading(true);
      setError(null);
      setFromCache(false);

      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Regulations fetch timed out after 30s');
        setLoading(false);
        setError('Request timed out. Please try refreshing.');
      }, 30000);

      try {
        // Generate cache key based on filters that affect the API query
        // Include jurisdiction in cache key since it affects the server query
        const apiFilters = {
          search: safeFilters.search,
          jurisdiction: safeFilters.jurisdiction,
        };
        const cacheKey = generateCacheKey(CACHE_PREFIX, apiFilters);

        // Try to get from cache first
        const cachedData = await cacheManager.get<Regulation[]>(cacheKey);
        
        if (cachedData) {
          console.log('✅ Using cached regulations data');
          setFromCache(true);
          const filteredData = applyClientFilters(cachedData, safeFilters);
          console.log(`📊 After client filters: ${filteredData.length} regulations`);
          setRegulations(filteredData);
          setLoading(false);
          return;
        }

        // Cache miss - fetch from API
        console.log('🌐 Fetching regulations from API...');
        let transformedData: Regulation[] = [];

        if (safeFilters.search?.trim().length) {
          console.log('🔍 Using full-text search for:', safeFilters.search);

          const { data: searchResults, error: searchError } = await supabase.rpc('search_instruments', {
            search_query: safeFilters.search,
            result_limit: 500,
          });

          if (searchError) {
            console.warn('Full-text search failed, falling back to ILIKE:', searchError);
            // Fallback query with jurisdiction join
            const { data, error: fallbackError } = await supabase
              .from('instrument')
              .select(`
                *,
                jurisdiction:jurisdiction_id(id, name, code)
              `)
              .or(`title.ilike.%${safeFilters.search}%,description.ilike.%${safeFilters.search}%`)
              .order('effective_date', { ascending: false })
              .limit(500);

            if (fallbackError) throw fallbackError;
            transformedData = transformData(data || []);
          } else {
            // Search results may not have jurisdiction joined, need to fetch separately
            if (searchResults && searchResults.length > 0) {
              const jurisdictionIds = [...new Set(searchResults.map((r: any) => r.jurisdiction_id).filter(Boolean))];
              
              if (jurisdictionIds.length > 0) {
                const { data: jurisdictions } = await supabase
                  .from('jurisdiction')
                  .select('id, name, code')
                  .in('id', jurisdictionIds);
                
                const jurisdictionMap = new Map(jurisdictions?.map(j => [j.id, j.name]) || []);
                
                const enrichedResults = searchResults.map((r: any) => ({
                  ...r,
                  jurisdiction_name: jurisdictionMap.get(r.jurisdiction_id) || 'Federal'
                }));
                
                transformedData = transformData(enrichedResults);
              } else {
                transformedData = transformData(searchResults);
              }
            }
          }
        } else {
          // Regular query with jurisdiction join
          console.log('📋 Fetching regulations with jurisdiction join...');
          
          // If a specific jurisdiction is requested, resolve its ID first for server-side filtering
          let jurisdictionId: string | null = null;
          if (safeFilters.jurisdiction) {
            const { data: jData } = await supabase
              .from('jurisdiction')
              .select('id')
              .ilike('name', safeFilters.jurisdiction)
              .limit(1);
            
            if (jData && jData.length > 0) {
              jurisdictionId = jData[0].id;
            }
          }
          
          let query = supabase
            .from('instrument')
            .select(`
              *,
              jurisdiction:jurisdiction_id(id, name, code)
            `)
            .order('effective_date', { ascending: false })
            .limit(500);
          
          // Apply server-side jurisdiction filter
          if (jurisdictionId) {
            query = query.eq('jurisdiction_id', jurisdictionId);
          }
          
          // Default to last 90 days if no date filter specified (prevents loading stale data)
          if (safeFilters.dateFrom) {
            query = query.gte('created_at', safeFilters.dateFrom);
          } else {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            query = query.gte('created_at', ninetyDaysAgo.toISOString());
          }

          const { data, error: queryError } = await query;

          if (queryError) {
            if (queryError.message !== 'AbortError: signal is aborted without reason') {
              console.error('❌ Query error:', queryError);
            }
            throw queryError;
          }
          
          console.log(`✅ Fetched ${data?.length || 0} instruments from database`);
          transformedData = transformData(data || []);
        }

        // Store in cache with appropriate TTL
        // Use longer TTL for empty searches (browsing), shorter for specific searches
        const ttl = safeFilters.search?.trim() ? CACHE_TTL.MEDIUM : CACHE_TTL.LONG;
        await cacheManager.set(cacheKey, transformedData, ttl);

        // Apply client-side filters
        const filteredData = applyClientFilters(transformedData, safeFilters);
        console.log(`✅ After client filters: ${filteredData.length} regulations`);

        setRegulations(filteredData);
      } catch (err: any) {
        if (err?.message !== 'AbortError: signal is aborted without reason' && err?.name !== 'AbortError') {
          console.error('❌ Error fetching regulations:', err);
        }
        setError(err.message || 'Failed to fetch regulations');
        setRegulations([]);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchRegulations();
  }, [
    safeFilters.search,
    safeFilters.products?.join(',') || '',
    safeFilters.stages?.join(',') || '',
    safeFilters.types?.join(',') || '',
    safeFilters.jurisdiction,
    safeFilters.jurisdictions?.join(',') || '',
    safeFilters.authorities?.join(',') || '',
    safeFilters.statuses?.join(',') || '',
    safeFilters.impactLevels?.join(',') || '',
    safeFilters.dateFrom,
    safeFilters.dateTo,
    safeFilters.tags?.join(',') || '',
  ]);

  return { 
    regulations, 
    loading, 
    error, 
    fromCache,
    refresh,
    invalidateCache,
  };
};

// Hook to get cache statistics
export const useCacheStats = () => {
  const [stats, setStats] = useState<{
    hits: number;
    misses: number;
    totalEntries: number;
    totalSize: number;
    lastCleanup: number;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const cacheStats = await getCacheStats();
      setStats(cacheStats);
    };

    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return stats;
};

export default useRegulations;
