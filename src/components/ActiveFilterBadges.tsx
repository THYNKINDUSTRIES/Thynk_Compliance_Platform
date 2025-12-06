import React from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { PRODUCTS } from '@/data/products';

interface Props {
  filters: {
    products: string[];
    stages: string[];
    types: string[];
    jurisdictions: string[];
    authorities: string[];
    statuses: string[];
    impacts: string[];
    dateFrom: string;
    dateTo: string;
  };
  onRemoveFilter: (category: string, value: string) => void;
  onClearAll: () => void;
}

export const ActiveFilterBadges: React.FC<Props> = ({ filters, onRemoveFilter, onClearAll }) => {
  // Helper to get product name from ID
  const getProductName = (id: string) => {
    const product = PRODUCTS.find(p => p.id === id);
    return product ? product.name : id;
  };

  const allFilters = [
    ...filters.products.map(p => ({ category: 'products', value: p, label: getProductName(p) })),
    ...filters.stages.map(s => ({ category: 'stages', value: s, label: s })),
    ...filters.types.map(t => ({ category: 'types', value: t, label: t })),
    ...filters.jurisdictions.map(j => ({ category: 'jurisdictions', value: j, label: j })),
    ...filters.authorities.map(a => ({ category: 'authorities', value: a, label: a })),
    ...filters.statuses.map(s => ({ category: 'statuses', value: s, label: s })),
    ...filters.impacts.map(i => ({ category: 'impacts', value: i, label: `${i} Impact` })),
  ];

  if (filters.dateFrom) {
    allFilters.push({ category: 'dateFrom', value: filters.dateFrom, label: `From: ${filters.dateFrom}` });
  }
  if (filters.dateTo) {
    allFilters.push({ category: 'dateTo', value: filters.dateTo, label: `To: ${filters.dateTo}` });
  }

  if (allFilters.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-[#E5DFD6] p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">
          Active Filters <span className="text-[#794108]">({allFilters.length})</span>
        </h4>
        <button
          onClick={onClearAll}
          className="text-sm text-[#E89C5C] hover:text-[#794108] transition-colors font-medium"
        >
          Clear All
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {allFilters.map((filter, idx) => (
          <Badge
            key={`${filter.category}-${filter.value}-${idx}`}
            variant="secondary"
            className="bg-[#FDF8F3] text-[#794108] border border-[#E5DFD6] hover:bg-[#F5EDE3] pr-1 transition-colors"
          >
            {filter.label}
            <button
              onClick={() => onRemoveFilter(filter.category, filter.value)}
              className="ml-2 hover:bg-[#E89C5C] hover:text-white rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};
