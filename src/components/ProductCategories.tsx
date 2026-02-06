import React from 'react';
import { Leaf, Droplet, Pill, Cookie, Cloud, FlaskRound, Brain, Sparkles, Check } from 'lucide-react';

interface Props {
  onCategoryClick: (productId: string) => void;
  activeProducts?: string[];
}

const categories = [
  { id: 'Hemp', name: 'Hemp/CBD', icon: Leaf, bg: 'bg-green-100', bgActive: 'bg-green-600', hover: 'hover:bg-green-200', text: 'text-green-700', textActive: 'text-white', ring: 'ring-green-400', description: 'Hemp & CBD regulations' },
  { id: 'Cannabis', name: 'Cannabis', icon: FlaskRound, bg: 'bg-purple-100', bgActive: 'bg-purple-600', hover: 'hover:bg-purple-200', text: 'text-purple-700', textActive: 'text-white', ring: 'ring-purple-400', description: 'Cannabis/marijuana regulations' },
  { id: 'Delta-8', name: 'Delta-8 THC', icon: Droplet, bg: 'bg-blue-100', bgActive: 'bg-blue-600', hover: 'hover:bg-blue-200', text: 'text-blue-700', textActive: 'text-white', ring: 'ring-blue-400', description: 'Delta-8 THC products' },
  { id: 'Kratom', name: 'Kratom', icon: Pill, bg: 'bg-red-100', bgActive: 'bg-red-600', hover: 'hover:bg-red-200', text: 'text-red-700', textActive: 'text-white', ring: 'ring-red-400', description: 'Kratom regulations' },
  { id: 'Psychedelics', name: 'Psychedelics', icon: Brain, bg: 'bg-pink-100', bgActive: 'bg-pink-600', hover: 'hover:bg-pink-200', text: 'text-pink-700', textActive: 'text-white', ring: 'ring-pink-400', description: 'Psilocybin, ketamine, MDMA' },
  { id: 'Nicotine', name: 'Nicotine/Vapes', icon: Cloud, bg: 'bg-gray-100', bgActive: 'bg-gray-600', hover: 'hover:bg-gray-200', text: 'text-gray-700', textActive: 'text-white', ring: 'ring-gray-400', description: 'Tobacco & vaping products' },
  { id: 'Edibles', name: 'Edibles', icon: Cookie, bg: 'bg-yellow-100', bgActive: 'bg-yellow-600', hover: 'hover:bg-yellow-200', text: 'text-yellow-700', textActive: 'text-white', ring: 'ring-yellow-400', description: 'Edible products' },
  { id: 'Kava', name: 'Kava', icon: Sparkles, bg: 'bg-teal-100', bgActive: 'bg-teal-600', hover: 'hover:bg-teal-200', text: 'text-teal-700', textActive: 'text-white', ring: 'ring-teal-400', description: 'Kava regulations' },
];

export const ProductCategories: React.FC<Props> = ({ onCategoryClick, activeProducts = [] }) => {
  return (
    <div className="bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-[#794108] mb-2 text-center">Browse by Product Category</h2>
        <p className="text-gray-600 text-center mb-8">Click a category to filter regulations — click again to deselect</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeProducts.includes(category.id);
            return (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category.id)}
                className={`relative p-6 rounded-lg transition-all transform hover:scale-105 cursor-pointer ${
                  isActive
                    ? `${category.bgActive} ${category.textActive} shadow-lg ring-2 ${category.ring} ring-offset-2 scale-[1.02]`
                    : `${category.bg} ${category.hover} ${category.text} hover:shadow-lg`
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 bg-white rounded-full p-0.5">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                )}
                <Icon className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold text-lg">{category.name}</h3>
                <p className={`text-sm mt-1 ${isActive ? 'opacity-90' : 'opacity-80'}`}>{category.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
