import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Star, MapPin, Phone, Mail, ExternalLink, Shield, Award, CheckCircle } from 'lucide-react';

export interface Provider {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  categories: string[];
  tier: 'VIP' | 'Vetted' | 'Standard';
  website_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  services: string[];
  states_covered: string[];
  pricing_tier: 'Budget' | 'Mid-Range' | 'Premium' | 'Enterprise' | null;
  rating: number | null;
  review_count: number;
  verified: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

interface ProviderCardProps {
  provider: Provider;
  variant?: 'compact' | 'full';
  onContact?: (provider: Provider) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, variant = 'compact', onContact }) => {
  const handleClick = () => {
    if (provider.website_url) {
      window.open(provider.website_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onContact) {
      onContact(provider);
    } else if (provider.contact_email) {
      window.location.href = `mailto:${provider.contact_email}`;
    }
  };

  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'VIP':
        return 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300';
      case 'Vetted':
        return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getPricingBadge = (pricing: string | null) => {
    if (!pricing) return null;
    const colors: Record<string, string> = {
      'Budget': 'bg-green-100 text-green-700',
      'Mid-Range': 'bg-blue-100 text-blue-700',
      'Premium': 'bg-purple-100 text-purple-700',
      'Enterprise': 'bg-indigo-100 text-indigo-700'
    };
    return colors[pricing] || 'bg-gray-100 text-gray-700';
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.floor(rating)
                ? 'fill-amber-400 text-amber-400'
                : star - 0.5 <= rating
                ? 'fill-amber-400/50 text-amber-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm font-medium text-gray-700 ml-1">{rating.toFixed(1)}</span>
        {provider.review_count > 0 && (
          <span className="text-sm text-gray-500">({provider.review_count})</span>
        )}
      </div>
    );
  };

  if (variant === 'full') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Header */}
        <div className={`p-4 ${provider.featured ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200' : 'border-b border-gray-100'}`}>
          <div className="flex items-start gap-4">
            {provider.logo_url ? (
              <img 
                src={provider.logo_url} 
                alt={provider.name} 
                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-400">
                  {provider.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-bold text-lg text-gray-900 truncate">{provider.name}</h3>
                {provider.verified && (
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )}
                {provider.featured && (
                  <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getTierStyles(provider.tier)}`}>
                  {provider.tier === 'VIP' && <Shield className="w-3 h-3 inline mr-1" />}
                  {provider.tier}
                </span>
                {provider.pricing_tier && (
                  <span className={`text-xs px-2 py-1 rounded-full ${getPricingBadge(provider.pricing_tier)}`}>
                    {provider.pricing_tier}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <p className="text-gray-600 text-sm line-clamp-3">{provider.description}</p>

          {/* Rating */}
          {renderStars(provider.rating)}

          {/* Services */}
          {provider.services && provider.services.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {provider.services.slice(0, 4).map((service) => (
                  <span key={service} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {service}
                  </span>
                ))}
                {provider.services.length > 4 && (
                  <span className="text-xs text-gray-500">+{provider.services.length - 4} more</span>
                )}
              </div>
            </div>
          )}

          {/* States Covered */}
          {provider.states_covered && provider.states_covered.length > 0 && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                <span className="font-medium">{provider.states_covered.length} states:</span>{' '}
                {provider.states_covered.slice(0, 6).join(', ')}
                {provider.states_covered.length > 6 && ` +${provider.states_covered.length - 6} more`}
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {provider.categories.map((cat) => (
              <span key={cat} className="text-xs bg-[#794108]/10 text-[#794108] px-2 py-1 rounded-full">
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {provider.contact_phone && (
              <a href={`tel:${provider.contact_phone}`} className="flex items-center gap-1 hover:text-[#794108]">
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">{provider.contact_phone}</span>
              </a>
            )}
            {provider.contact_email && (
              <a href={`mailto:${provider.contact_email}`} className="flex items-center gap-1 hover:text-[#794108]">
                <Mail className="w-4 h-4" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleContactClick}
              className="px-3 py-1.5 text-sm font-medium text-[#794108] border border-[#794108] rounded-lg hover:bg-[#794108]/10 transition-colors"
            >
              Contact
            </button>
            {provider.website_url && (
              <button
                onClick={handleClick}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#794108] rounded-lg hover:bg-[#5a3006] transition-colors flex items-center gap-1"
              >
                Visit <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <div 
      onClick={handleClick}
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-[#E89C5C] transition-all duration-200 ${provider.website_url ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start gap-3 mb-3">
        {provider.logo_url ? (
          <img 
            src={provider.logo_url} 
            alt={provider.name} 
            className="w-12 h-12 object-cover rounded-lg border border-gray-100"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-gray-400">{provider.name.charAt(0)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{provider.name}</h3>
            {provider.verified && <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />}
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTierStyles(provider.tier)}`}>
            {provider.tier}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{provider.description}</p>
      {provider.rating && (
        <div className="mb-3">{renderStars(provider.rating)}</div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {provider.categories.slice(0, 3).map((cat) => (
          <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
};

// Hook to fetch providers from Supabase
export const useProviders = (options?: {
  tier?: 'VIP' | 'Vetted' | 'Standard';
  featured?: boolean;
  category?: string;
  state?: string;
  limit?: number;
}) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, [options?.tier, options?.featured, options?.category, options?.state, options?.limit]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('providers')
        .select('*');

      // Apply filters
      if (options?.tier) {
        query = query.eq('tier', options.tier);
      }
      if (options?.featured !== undefined) {
        query = query.eq('featured', options.featured);
      }
      if (options?.category) {
        query = query.contains('categories', [options.category]);
      }
      if (options?.state) {
        query = query.contains('states_covered', [options.state]);
      }

      // Order by tier priority, then by rating
      query = query
        .order('featured', { ascending: false })
        .order('rating', { ascending: false, nullsFirst: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        // Handle various error cases for missing/inaccessible table
        const errorCode = fetchError.code;
        const errorMessage = fetchError.message || '';
        
        // Table doesn't exist (42P01) or relation not found (404-like errors)
        if (
          errorCode === '42P01' || 
          errorCode === 'PGRST116' ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('relation') ||
          errorMessage.includes('404')
        ) {
          console.log('[useProviders] Providers table not available');
          setProviders([]);
          setError(null); // Don't show error for missing table
          return;
        }
        console.error('[useProviders] Fetch error:', fetchError);
        throw fetchError;
      }

      setProviders((data || []) as Provider[]);
    } catch (err: any) {
      console.error('[useProviders] Error:', err);
      // Only show error if it's not a missing table error
      const errMsg = err?.message || '';
      if (!errMsg.includes('does not exist') && !errMsg.includes('404')) {
        setError('Unable to load providers.');
      }
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };




  return { providers, loading, error, refetch: fetchProviders };
};

// Provider list component with filtering
interface ProviderListProps {
  variant?: 'compact' | 'full';
  showFilters?: boolean;
  initialTier?: 'VIP' | 'Vetted' | 'Standard' | 'all';
  limit?: number;
}

export const ProviderList: React.FC<ProviderListProps> = ({ 
  variant = 'compact', 
  showFilters = true,
  initialTier = 'all',
  limit
}) => {
  const [selectedTier, setSelectedTier] = useState<'VIP' | 'Vetted' | 'Standard' | 'all'>(initialTier);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { providers, loading, error, refetch } = useProviders({
    tier: selectedTier === 'all' ? undefined : selectedTier,
    limit
  });

  // Get unique categories from providers
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    providers.forEach(p => p.categories.forEach(c => cats.add(c)));
    return Array.from(cats).sort();
  }, [providers]);

  // Filter by category
  const filteredProviders = React.useMemo(() => {
    if (selectedCategory === 'all') return providers;
    return providers.filter(p => p.categories.includes(selectedCategory));
  }, [providers, selectedCategory]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#794108]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">No providers available</p>
        <p className="text-sm text-gray-500">Check back later for verified compliance service providers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="flex flex-wrap gap-4 items-center">
          {/* Tier Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Tier:</span>
            <div className="flex gap-1">
              {['all', 'VIP', 'Vetted', 'Standard'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier as typeof selectedTier)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    selectedTier === tier
                      ? 'bg-[#794108] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tier === 'all' ? 'All' : tier}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#794108]/20"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          <span className="text-sm text-gray-500 ml-auto">
            {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className={`grid gap-6 ${
        variant === 'full' 
          ? 'grid-cols-1 lg:grid-cols-2' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {filteredProviders.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} variant={variant} />
        ))}
      </div>
    </div>
  );
};

export default ProviderCard;
