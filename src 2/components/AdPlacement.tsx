import React from 'react';

interface Props {
  slot: 'hero-banner' | 'sidebar' | 'in-feed';
  sponsor: {
    name: string;
    logo: string;
    url: string;
    tier: 'VIP' | 'Vetted' | 'Standard';
  };
}

export const AdPlacement: React.FC<Props> = ({ slot, sponsor }) => {
  const handleClick = () => {
    console.log(`Ad clicked: ${sponsor.name}`);
    window.open(sponsor.url, '_blank');
  };

  const tierColors = {
    VIP: 'border-amber-400 bg-amber-50',
    Vetted: 'border-[#E89C5C] bg-[#FDF8F3]',
    Standard: 'border-gray-300 bg-gray-50'
  };


  if (slot === 'hero-banner') {
    return (
      <div className={`border-2 ${tierColors[sponsor.tier]} rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow`} onClick={handleClick}>
        <div className="flex items-center gap-4">
          <img src={sponsor.logo} alt={sponsor.name} className="w-16 h-16 object-contain" />
          <div>
            <div className="text-xs text-gray-500 mb-1">{sponsor.tier} Partner</div>
            <div className="font-semibold text-gray-900">{sponsor.name}</div>
            <div className="text-sm text-gray-600">Trusted compliance solutions</div>
          </div>
        </div>
      </div>
    );
  }

  if (slot === 'sidebar') {
    return (
      <div className={`border ${tierColors[sponsor.tier]} rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow`} onClick={handleClick}>
        <div className="text-xs text-gray-500 mb-2">{sponsor.tier} Partner</div>
        <img src={sponsor.logo} alt={sponsor.name} className="w-full h-24 object-contain mb-2" />
        <div className="font-medium text-gray-900 text-sm text-center">{sponsor.name}</div>
      </div>
    );
  }

  return (
    <div className={`border ${tierColors[sponsor.tier]} rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow`} onClick={handleClick}>
      <div className="flex items-center gap-3">
        <img src={sponsor.logo} alt={sponsor.name} className="w-12 h-12 object-contain" />
        <div className="flex-1">
          <div className="text-xs text-gray-500">{sponsor.tier}</div>
          <div className="font-medium text-gray-900 text-sm">{sponsor.name}</div>
        </div>
      </div>
    </div>
  );
};
