import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';

export const FilterPanel: React.FC = () => {
  const { filters, updateFilter, clearFilters } = useAppContext();
  const [expandedSections, setExpandedSections] = useState<string[]>(['jurisdiction', 'status']);
  const [availableFilters, setAvailableFilters] = useState({
    jurisdictions: [] as string[],
    authorities: [] as string[],
    statuses: ['open', 'closed', 'pending', 'effective'],
    impacts: ['high', 'medium', 'low'],
    products: ['Hemp', 'Delta-8', 'Delta-9', 'Kratom', 'CBD', 'THC', 'Edibles', 'Vapes'],
    stages: ['Retail', 'Manufacturing', 'Distribution', 'Testing', 'Cultivation'],
    types: ['Regulation', 'Guidance', 'Notice', 'Rule', 'Order', 'Policy'],
    tags: ['licensing', 'testing', 'packaging', 'cultivation', 'retail', 'medical', 'recreational', 'compliance']
  });


  useEffect(() => {
    const fetchFilterOptions = async () => {
      console.log('🔧 FilterPanel: Fetching filter options...');
      try {
        const { data: jurisdictions, error } = await supabase
          .from('jurisdiction')
          .select('name')
          .order('name');
        
        if (error) {
          console.error('❌ Error fetching jurisdictions:', error);
        } else {
          console.log('✅ Fetched', jurisdictions?.length, 'jurisdictions');
          setAvailableFilters(prev => ({
            ...prev,
            jurisdictions: jurisdictions?.map(j => j.name) || []
          }));
        }
      } catch (err) {
        console.error('❌ Fatal error fetching filter options:', err);
      }
    };

    fetchFilterOptions();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleToggle = (filterType: keyof typeof filters, value: string) => {
    console.log('🔧 Filter toggle:', filterType, value);
    const currentValues = filters[filterType] as string[];
    if (Array.isArray(currentValues)) {
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      console.log('🔧 New filter values:', newValues);
      updateFilter(filterType, newValues);
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => 
    (Array.isArray(v) && v.length > 0) || (typeof v === 'string' && v !== '')
  ).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#794108]" />
          <h3 className="font-semibold text-lg text-[#794108]">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-[#E89C5C] text-white text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            onClick={() => {
              console.log('🧹 Clearing all filters');
              clearFilters();
            }}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection('jurisdiction')}
            className="w-full flex items-center justify-between text-left hover:text-[#794108]"
          >
            <span className="font-medium">Jurisdiction</span>
            {expandedSections.includes('jurisdiction') ? 
              <ChevronUp className="w-4 h-4" /> : 
              <ChevronDown className="w-4 h-4" />
            }
          </button>
          {expandedSections.includes('jurisdiction') && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {availableFilters.jurisdictions.length === 0 ? (
                <p className="text-sm text-gray-500">Loading jurisdictions...</p>
              ) : (
                availableFilters.jurisdictions.map(jurisdiction => (
                  <label key={jurisdiction} className="flex items-center gap-2 cursor-pointer hover:text-[#794108]">
                    <input
                      type="checkbox"
                      checked={filters.jurisdictions.includes(jurisdiction)}
                      onChange={() => handleToggle('jurisdictions', jurisdiction)}
                      className="rounded border-gray-300 text-[#794108] focus:ring-[#794108]"
                    />
                    <span className="text-sm">{jurisdiction}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection('status')}
            className="w-full flex items-center justify-between text-left hover:text-[#794108]"
          >
            <span className="font-medium">Status</span>
            {expandedSections.includes('status') ? 
              <ChevronUp className="w-4 h-4" /> : 
              <ChevronDown className="w-4 h-4" />
            }
          </button>
          {expandedSections.includes('status') && (
            <div className="mt-3 space-y-2">
              {availableFilters.statuses.map(status => (
                <label key={status} className="flex items-center gap-2 cursor-pointer hover:text-[#794108]">
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(status)}
                    onChange={() => handleToggle('statuses', status)}
                    className="rounded border-gray-300 text-[#794108] focus:ring-[#794108]"
                  />
                  <span className="text-sm capitalize">{status}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection('products')}
            className="w-full flex items-center justify-between text-left hover:text-[#794108]"
          >
            <span className="font-medium">Products</span>
            {expandedSections.includes('products') ? 
              <ChevronUp className="w-4 h-4" /> : 
              <ChevronDown className="w-4 h-4" />
            }
          </button>
          {expandedSections.includes('products') && (
            <div className="mt-3 space-y-2">
              {availableFilters.products.map(product => (
                <label key={product} className="flex items-center gap-2 cursor-pointer hover:text-[#794108]">
                  <input
                    type="checkbox"
                    checked={filters.products.includes(product)}
                    onChange={() => handleToggle('products', product)}
                    className="rounded border-gray-300 text-[#794108] focus:ring-[#794108]"
                  />
                  <span className="text-sm">{product}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection('impact')}
            className="w-full flex items-center justify-between text-left hover:text-[#794108]"
          >
            <span className="font-medium">Impact Level</span>
            {expandedSections.includes('impact') ? 
              <ChevronUp className="w-4 h-4" /> : 
              <ChevronDown className="w-4 h-4" />
            }
          </button>
          {expandedSections.includes('impact') && (
            <div className="mt-3 space-y-2">
              {availableFilters.impacts.map(impact => (
                <label key={impact} className="flex items-center gap-2 cursor-pointer hover:text-[#794108]">
                  <input
                    type="checkbox"
                    checked={filters.impactLevels.includes(impact)}
                    onChange={() => handleToggle('impactLevels', impact)}
                    className="rounded border-gray-300 text-[#794108] focus:ring-[#794108]"
                  />
                  <span className="text-sm capitalize">{impact}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection('tags')}
            className="w-full flex items-center justify-between text-left hover:text-[#794108]"
          >
            <span className="font-medium">Tags</span>
            {expandedSections.includes('tags') ? 
              <ChevronUp className="w-4 h-4" /> : 
              <ChevronDown className="w-4 h-4" />
            }
          </button>
          {expandedSections.includes('tags') && (
            <div className="mt-3 space-y-2">
              {availableFilters.tags.map(tag => (
                <label key={tag} className="flex items-center gap-2 cursor-pointer hover:text-[#794108]">
                  <input
                    type="checkbox"
                    checked={filters.tags?.includes(tag) || false}
                    onChange={() => handleToggle('tags', tag)}
                    className="rounded border-gray-300 text-[#794108] focus:ring-[#794108]"
                  />
                  <span className="text-sm capitalize">{tag}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="pt-2">
          <h4 className="font-medium mb-3">Date Range</h4>
          <div className="space-y-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => {
                console.log('📅 Date from changed:', e.target.value);
                updateFilter('dateFrom', e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#794108] focus:border-[#794108]"
              placeholder="From"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => {
                console.log('📅 Date to changed:', e.target.value);
                updateFilter('dateTo', e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#794108] focus:border-[#794108]"
              placeholder="To"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
