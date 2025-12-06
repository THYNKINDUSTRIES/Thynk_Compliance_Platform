import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface Props {
  onQuickFilter: (filters: any) => void;
}

export const FilterQuickActions: React.FC<Props> = ({ onQuickFilter }) => {
  const quickFilters = [
    {
      name: 'High Impact Only',
      filters: { impacts: ['High'] }
    },
    {
      name: 'Recent (Last 30 Days)',
      filters: { 
        dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    },
    {
      name: 'Hemp & CBD',
      filters: { products: ['hemp'] }
    },
    {
      name: 'Federal Only',
      filters: { jurisdictions: ['Federal'] }
    },
    {
      name: 'Active Bills',
      filters: { types: ['Bill'], statuses: ['Active'] }
    },
    {
      name: 'Enforcement Actions',
      filters: { types: ['Enforcement', 'Warning Letter'] }
    }
  ];

  return (
    <div className="bg-gradient-to-r from-[#FDF8F3] to-[#F5EDE3] rounded-lg border border-[#E5DFD6] p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-[#794108]" />
        <h4 className="text-sm font-medium text-gray-700">Quick Filters</h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            onClick={() => onQuickFilter(filter.filters)}
            className="bg-white hover:bg-[#794108] hover:text-white border-[#E5DFD6] text-[#794108] transition-colors"
          >
            {filter.name}
          </Button>
        ))}
      </div>
    </div>
  );
};
