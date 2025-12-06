import React from 'react';

interface Provider {
  id: string;
  name: string;
  logo: string;
  description: string;
  categories: string[];
  tier: 'VIP' | 'Vetted';
  url: string;
}

interface Props {
  provider: Provider;
}

export const ProviderCard: React.FC<Props> = ({ provider }) => {
  const handleClick = () => {
    window.open(provider.url, '_blank');
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white border border-[#E5DFD6] rounded-lg p-6 hover:shadow-lg hover:border-[#E89C5C] transition-all cursor-pointer"
    >

      <div className="flex items-start gap-4 mb-4">
        <img src={provider.logo} alt={provider.name} className="w-16 h-16 object-contain" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{provider.name}</h3>
            <span className={`text-xs px-2 py-1 rounded ${provider.tier === 'VIP' ? 'bg-amber-100 text-amber-700' : 'bg-[#E89C5C]/20 text-[#794108]'}`}>

              {provider.tier}
            </span>
          </div>
          <p className="text-sm text-gray-600">{provider.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {provider.categories.map(cat => (
          <span key={cat} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
};

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'ComplianceLab Pro',
    logo: 'https://d64gsuwffb70l.cloudfront.net/68f945cb086e2661e0d9d180_1761192260914_36330f45.webp',
    description: 'Full-spectrum testing and COA generation for hemp and cannabinoid products',
    categories: ['Testing', 'Lab Services', 'COA'],
    tier: 'VIP' as const,
    url: '#'
  },
  {
    id: '2',
    name: 'PackRight Solutions',
    logo: 'https://d64gsuwffb70l.cloudfront.net/68f945cb086e2661e0d9d180_1761192263550_29c26a65.webp',
    description: 'Compliant packaging and labeling for all 50 states',
    categories: ['Packaging', 'Labeling', 'Design'],
    tier: 'VIP' as const,
    url: '#'
  },
  {
    id: '3',
    name: 'RegTrack Systems',
    logo: 'https://d64gsuwffb70l.cloudfront.net/68f945cb086e2661e0d9d180_1761192265273_ccc60b8b.webp',
    description: 'Track-and-trace software for cannabis and hemp operations',
    categories: ['Software', 'Track & Trace', 'Compliance'],
    tier: 'Vetted' as const,
    url: '#'
  }
];