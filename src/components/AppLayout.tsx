import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { SearchBar } from './SearchBar';
import { Footer } from './Footer';
import { LatestUpdates } from './LatestUpdates';
import { useAppContext } from '@/contexts/AppContext';
import { useRegulations } from '@/hooks/useRegulations';
import { supabase } from '@/lib/supabase';
import { clearCache } from '@/lib/cache';
import { Loader2, AlertCircle, ArrowUpDown, Check, RefreshCw, AlertTriangle, Database, MapPin, Play } from 'lucide-react';

import { RegulationCard } from './RegulationCard';
import { FilterPanel } from './FilterPanel';
import { ProductCategories } from './ProductCategories';
import { Newsletter } from './Newsletter';
import { StateMap } from './StateMap';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { DataPopulationTrigger } from './DataPopulationTrigger';
import { StateRegulationsPoller } from './StateRegulationsPoller';
import { StateInfo } from '@/data/states';
import { EnhancedStatsSection } from './EnhancedStatsSection';
import { OpenCommentPeriods } from './OpenCommentPeriods';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CacheStatusIndicator } from './CacheStatusIndicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';




const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const { filters, updateFilter, clearFilters } = useAppContext();
  const { regulations, loading, error, fromCache, refresh } = useRegulations(filters);
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [secondarySortBy, setSecondarySortBy] = useState<string>('none');
  const [isClearing, setIsClearing] = useState(false);
  const [showCacheBanner, setShowCacheBanner] = useState(false);

  // Handle clear cache and refresh
  const handleClearCacheAndRefresh = async () => {
    setIsClearing(true);
    try {
      await clearCache();
      console.log('Cache cleared successfully');
      await refresh();
      setShowCacheBanner(false);
    } catch (err) {
      console.error('Error clearing cache:', err);
    } finally {
      setIsClearing(false);
    }
  };

  // Show cache banner when regulations are 0 and not loading
  useEffect(() => {
    if (!loading && regulations.length === 0 && !error) {
      setShowCacheBanner(true);
    } else if (regulations.length > 0) {
      setShowCacheBanner(false);
    }
  }, [loading, regulations.length, error]);



  const [stateData, setStateData] = useState<(StateInfo & { lastUpdated?: string; totalInstruments?: number })[]>([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRegulations: 0,
    activeJurisdictions: 0,
    openComments: 0,
    upcomingDeadlines: 0,
    federalAgencies: 0,
    productCategories: 0,
    vettedProviders: 0,
    dailyUpdates: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Helper function to apply a single sort criterion
  const applySortCriterion = (data: any[], criterion: string) => {
    const sorted = [...data];
    
    switch (criterion) {
      case 'date-desc':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.publishedAt || '').getTime();
          const dateB = new Date(b.publishedAt || '').getTime();
          return dateB - dateA;
        });
      case 'date-asc':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.publishedAt || '').getTime();
          const dateB = new Date(b.publishedAt || '').getTime();
          return dateA - dateB;
        });
      case 'effective-desc':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.effectiveAt || '9999-12-31').getTime();
          const dateB = new Date(b.effectiveAt || '9999-12-31').getTime();
          return dateB - dateA;
        });
      case 'effective-asc':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.effectiveAt || '9999-12-31').getTime();
          const dateB = new Date(b.effectiveAt || '9999-12-31').getTime();
          return dateA - dateB;
        });
      case 'type':
        return sorted.sort((a, b) => 
          (a.instrumentType || '').localeCompare(b.instrumentType || '')
        );
      case 'jurisdiction':
        return sorted.sort((a, b) => 
          (a.jurisdiction || '').localeCompare(b.jurisdiction || '')
        );
      case 'authority':
        return sorted.sort((a, b) => 
          (a.authority || '').localeCompare(b.authority || '')
        );
      case 'status':
        return sorted.sort((a, b) => 
          (a.status || '').localeCompare(b.status || '')
        );
      case 'impact-high':
        return sorted.sort((a, b) => {
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return (impactOrder[b.impact] || 0) - (impactOrder[a.impact] || 0);
        });
      case 'impact-low':
        return sorted.sort((a, b) => {
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return (impactOrder[a.impact] || 0) - (impactOrder[b.impact] || 0);
        });
      default:
        return sorted;
    }
  };

  // Sort regulations with primary and secondary sort
  const sortedRegulations = useMemo(() => {
    let result = [...regulations];
    
    // Apply primary sort
    result = applySortCriterion(result, sortBy);
    
    // Apply secondary sort if selected
    if (secondarySortBy !== 'none') {
      // Group by primary sort value, then sort within groups
      const grouped = new Map();
      result.forEach(reg => {
        const key = getPrimarySortValue(reg, sortBy);
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key).push(reg);
      });
      
      // Sort within each group
      grouped.forEach((group, key) => {
        grouped.set(key, applySortCriterion(group, secondarySortBy));
      });
      
      // Flatten back to array
      result = Array.from(grouped.values()).flat();
    }
    
    return result;
  }, [regulations, sortBy, secondarySortBy]);

  // Helper to get the value used for primary sort grouping
  const getPrimarySortValue = (reg: any, criterion: string): string => {
    switch (criterion) {
      case 'date-desc':
      case 'date-asc':
        return reg.publishedAt || '';
      case 'effective-desc':
      case 'effective-asc':
        return reg.effectiveAt || '';
      case 'type':
        return reg.instrumentType || '';
      case 'jurisdiction':
        return reg.jurisdiction || '';
      case 'authority':
        return reg.authority || '';
      case 'status':
        return reg.status || '';
      case 'impact-high':
      case 'impact-low':
        return reg.impact || '';
      default:
        return '';
    }
  };

  // Get sort label for display
  const getSortLabel = (value: string): string => {
    const labels: Record<string, string> = {
      'date-desc': 'Date (Newest)',
      'date-asc': 'Date (Oldest)',
      'effective-desc': 'Effective Date (Newest)',
      'effective-asc': 'Effective Date (Oldest)',
      'type': 'Type (A-Z)',
      'jurisdiction': 'Jurisdiction (A-Z)',
      'authority': 'Authority (A-Z)',
      'status': 'Status',
      'impact-high': 'Impact (High to Low)',
      'impact-low': 'Impact (Low to High)',
      'none': 'None'
    };
    return labels[value] || value;
  };





  useEffect(() => {
    const fetchStats = async () => {
      console.log('🔍 Fetching platform statistics...');
      try {
        setStatsLoading(true);
        setStatsError(null);

        const { count: regCount, error: regError } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true });
        
        if (regError) {
          console.error('❌ Error fetching regulations count:', regError);
          throw regError;
        }
        console.log('✅ Total regulations:', regCount);
        
        const { data: jurisdictions, error: jurError } = await supabase
          .from('jurisdiction')
          .select('id');
        
        if (jurError) {
          console.error('❌ Error fetching jurisdictions:', jurError);
        }
        console.log('✅ Active jurisdictions:', jurisdictions?.length || 0);
        
        const { count: openCount, error: openError } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');
        
        if (openError) {
          console.error('❌ Error fetching open comments:', openError);
        }
        console.log('✅ Open comments:', openCount || 0);
        
        const { count: deadlineCount, error: deadlineError } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true })
          .gte('effective_at', new Date().toISOString());

        if (deadlineError) {
          console.error('❌ Error fetching deadlines:', deadlineError);
        }
        console.log('✅ Upcoming deadlines:', deadlineCount || 0);

        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount, error: todayError } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);

        if (todayError) {
          console.error('❌ Error fetching today updates:', todayError);
        }
        // Fetch provider count from Supabase - handle missing table gracefully
        let providerCount = 0;
        try {
          // First check if table exists by doing a simple query
          const { data, error: providerError } = await supabase
            .from('providers')
            .select('id', { count: 'exact', head: true })
            .limit(1);
          
          if (!providerError) {
            // Table exists, now try to get vetted count
            const { count } = await supabase
              .from('providers')
              .select('*', { count: 'exact', head: true })
              .in('tier', ['VIP', 'Vetted']);
            providerCount = count || 0;
            console.log('✅ Vetted providers:', providerCount);
          } else {
            // Table doesn't exist or other error - use default silently
            console.log('ℹ️ Providers table not available:', providerError.code);
          }
        } catch (e) {
          // Silently handle - providers table is optional
          console.log('ℹ️ Providers query skipped');
        }


        setStats({
          totalRegulations: regCount || 0,
          activeJurisdictions: jurisdictions?.length || 0,
          openComments: openCount || 0,
          upcomingDeadlines: deadlineCount || 0,
          federalAgencies: 12,
          productCategories: 8,
          vettedProviders: providerCount,
          dailyUpdates: todayCount || 0
        });

        console.log('✅ All statistics fetched successfully');
      } catch (err: any) {
        console.error('❌ Fatal error fetching stats:', err);
        setStatsError(err.message);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);


  useEffect(() => {
    const fetchStateData = async () => {
      console.log('🗺️ Fetching state data...');
      setStatesLoading(true);
      try {
        const { data: jurisdictions, error } = await supabase
          .from('jurisdiction')
          .select(`
            id,
            name,
            slug,
            type
          `)
          .eq('type', 'state')
          .order('name');

        if (error) throw error;

        // Get instrument counts for each jurisdiction
        const statesWithData = await Promise.all(
          (jurisdictions || []).map(async (j) => {
            const { count } = await supabase
              .from('instrument')
              .select('*', { count: 'exact', head: true })
              .eq('jurisdiction_id', j.id);

            // Get latest instrument - handle empty results gracefully
            let lastUpdated = null;
            try {
              const { data: latestInstruments } = await supabase
                .from('instrument')
                .select('created_at')
                .eq('jurisdiction_id', j.id)
                .order('created_at', { ascending: false })
                .limit(1);
              
              if (latestInstruments && latestInstruments.length > 0) {
                lastUpdated = latestInstruments[0].created_at;
              }
            } catch (e) {
              // Ignore errors for individual state lookups
            }

            // Map to StateInfo format
            const stateAbbr = getStateAbbreviation(j.name);
            return {
              id: stateAbbr,
              name: j.name,
              slug: j.slug,
              status: count && count > 5 ? 'permissive' : count && count > 2 ? 'moderate' : 'restrictive',
              recentUpdates: count || 0,
              activeDeadlines: 0,
              totalInstruments: count || 0,
              lastUpdated
            } as StateInfo & { lastUpdated?: string; totalInstruments?: number };
          })
        );

        console.log('✅ State data fetched:', statesWithData.length);
        setStateData(statesWithData);
      } catch (err) {
        console.error('❌ Error fetching state data:', err);
      } finally {
        setStatesLoading(false);
      }
    };

    fetchStateData();
  }, []);

  const getStateAbbreviation = (name: string): string => {
    const stateMap: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    return stateMap[name] || name.substring(0, 2).toUpperCase();
  };



  const handleSearch = (query: string) => {
    console.log('🔍 Search triggered:', query);
    updateFilter('search', query);
  };

  const handleCategoryClick = (productId: string) => {
    console.log('🏷️ Category clicked:', productId);
    updateFilter('products', [productId]);
    window.scrollTo({ top: 800, behavior: 'smooth' });
  };

  const handleStateClick = (state: any) => {
    console.log('🗺️ State clicked:', state);
    navigate(`/states/${state.slug}`);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#FDF8F3] to-[#F5EDE3]">
      <LatestUpdates />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <SearchBar 
          onSearch={handleSearch} 
          placeholder="Search regulations by keyword, citation, or topic..."
        />
        {filters.search && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              🔍 Searching for: <strong>{filters.search}</strong>
              <Button 
                variant="link" 
                onClick={() => updateFilter('search', '')}
                className="ml-2 text-blue-600"
              >
                Clear search
              </Button>
            </p>
          </div>
        )}
      </div>

      <ProductCategories onCategoryClick={handleCategoryClick} />
      <EnhancedStatsSection />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <OpenCommentPeriods />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Data Population Section with Tabs */}
        <div className="mb-8">
          <Card className="border-[#E5DFD6] shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#FDF8F3] to-[#F5EDE3] border-b border-[#E5DFD6]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#794108] rounded-lg">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-[#794108]">Data Population & State Polling</CardTitle>
                  <CardDescription>
                    Fetch regulations from federal sources and poll all 47 state cannabis regulatory agencies
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="states" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="comprehensive" className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Comprehensive Data
                  </TabsTrigger>
                  <TabsTrigger value="states" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    State Regulations Poller
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="comprehensive">
                  <DataPopulationTrigger />
                </TabsContent>
                
                <TabsContent value="states">
                  <StateRegulationsPoller />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6 text-center">
          <Button 
            onClick={() => navigate('/federal')} 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            View Federal Regulations (DEA, FDA, USDA, TTB)
          </Button>
        </div>
        
        {statesLoading ? (
          <div className="text-center py-12">
            <Loader2 className="inline-block animate-spin h-8 w-8 text-[#794108]" />
            <p className="mt-2 text-gray-600">Loading state data...</p>
          </div>
        ) : (
          <StateMap states={stateData} onStateClick={handleStateClick} />
        )}
      </div>




      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <FilterPanel />
          </div>

          <div className="lg:col-span-3">

            <div className="mb-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Regulatory Feed</h2>
                    <p className="text-gray-600">
                      {loading ? 'Loading...' : `${sortedRegulations.length} regulation${sortedRegulations.length !== 1 ? 's' : ''} found`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CacheStatusIndicator fromCache={fromCache} onRefresh={refresh} />
                    {sortedRegulations.length > 0 && !fromCache && (
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Live data</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sort Controls */}
                {!loading && sortedRegulations.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Primary Sort:</span>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Sort by..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                            <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                            <SelectItem value="effective-desc">Effective Date (Newest)</SelectItem>
                            <SelectItem value="effective-asc">Effective Date (Oldest)</SelectItem>
                            <SelectItem value="type">Type (A-Z)</SelectItem>
                            <SelectItem value="jurisdiction">Jurisdiction (A-Z)</SelectItem>
                            <SelectItem value="authority">Authority (A-Z)</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="impact-high">Impact (High to Low)</SelectItem>
                            <SelectItem value="impact-low">Impact (Low to High)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Then by:</span>
                        <Select value={secondarySortBy} onValueChange={setSecondarySortBy}>
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Secondary sort..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                            <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                            <SelectItem value="effective-desc">Effective Date (Newest)</SelectItem>
                            <SelectItem value="effective-asc">Effective Date (Oldest)</SelectItem>
                            <SelectItem value="type">Type (A-Z)</SelectItem>
                            <SelectItem value="jurisdiction">Jurisdiction (A-Z)</SelectItem>
                            <SelectItem value="authority">Authority (A-Z)</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="impact-high">Impact (High to Low)</SelectItem>
                            <SelectItem value="impact-low">Impact (Low to High)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Active Sort Indicators */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs font-medium text-gray-500 uppercase">Active Sorts:</span>
                      <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        <Check className="h-3 w-3" />
                        <span>{getSortLabel(sortBy)}</span>
                      </div>
                      {secondarySortBy !== 'none' && (
                        <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          <Check className="h-3 w-3" />
                          <span>{getSortLabel(secondarySortBy)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>



            {/* Cache Clear Banner - Shows when 0 regulations */}
            {showCacheBanner && !loading && (
              <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 bg-amber-100 rounded-full p-3">
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">
                      No Regulations Displaying?
                    </h3>
                    <p className="text-amber-800 mb-4">
                      If you're seeing 0 regulations, your browser cache may contain outdated data. 
                      Click the button below to clear your local cache and reload fresh data from the server.
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <Button
                        onClick={handleClearCacheAndRefresh}
                        disabled={isClearing}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all hover:shadow-lg"
                      >
                        {isClearing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Clearing Cache...
                          </>
                        ) : (
                          <>
                            <Database className="mr-2 h-5 w-5" />
                            Clear Cache & Refresh
                          </>
                        )}
                      </Button>
                      <button
                        onClick={() => setShowCacheBanner(false)}
                        className="text-amber-700 hover:text-amber-900 text-sm underline"
                      >
                        Dismiss
                      </button>
                    </div>
                    <p className="text-xs text-amber-600 mt-3">
                      This clears the IndexedDB cache stored in your browser and fetches the latest regulations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                Error loading regulations: {error}
              </div>
            )}

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="inline-block animate-spin h-8 w-8 text-[#794108]" />
                  <p className="mt-2 text-gray-600">Loading regulations...</p>
                </div>
              ) : regulations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">No regulations found.</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Try adjusting your filters, clearing your search, or refreshing the cache.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button 
                      onClick={clearFilters}
                      variant="outline"
                      className="border-gray-300"
                    >
                      Clear All Filters
                    </Button>
                    <Button 
                      onClick={handleClearCacheAndRefresh}
                      disabled={isClearing}
                      className="bg-[#794108] hover:bg-[#5a3006]"
                    >
                      {isClearing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Clear Cache & Refresh
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                sortedRegulations.map((reg) => (
                  <RegulationCard key={reg.id} regulation={reg} />
                ))
              )}

            </div>

          </div>
        </div>
      </div>

      <Newsletter />
      <Footer />
      </div>
    </>
  );
};

export default AppLayout;
