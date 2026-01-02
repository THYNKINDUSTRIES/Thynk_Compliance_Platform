import React from 'react';
import { SearchBar } from './SearchBar';

interface Props {
  onSearch: (query: string) => void;
}

export const Hero: React.FC<Props> = ({ onSearch }) => {
  return (
    <div 
      className="relative bg-gradient-to-br from-[#794108] via-[#A0522D] to-[#E89C5C] py-20 px-4"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Thynk Compliance
          </h1>
          <p className="text-xl md:text-2xl text-[#FDF8F3] mb-3 font-semibold">
            Regulatory Intelligence Platform
          </p>
          <p className="text-lg text-white/90">
            Real-time regulatory intelligence for hemp, cannabinoids, kratom, psychedelics & more
          </p>
        </div>

        
        <div className="max-w-3xl mx-auto mb-8">
          <SearchBar onSearch={onSearch} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center border border-white/20">
            <div className="text-4xl font-bold text-[#FDF8F3] mb-1">50+</div>
            <div className="text-sm text-white">Jurisdictions</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center border border-white/20">
            <div className="text-4xl font-bold text-[#FDF8F3] mb-1">1,200+</div>
            <div className="text-sm text-white">Regulations</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center border border-white/20">
            <div className="text-4xl font-bold text-[#FDF8F3] mb-1">15 min</div>
            <div className="text-sm text-white">Update Time</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center border border-white/20">
            <div className="text-4xl font-bold text-[#FDF8F3] mb-1">8</div>
            <div className="text-sm text-white">Product Categories</div>
          </div>
        </div>
      </div>
    </div>
  );
};
