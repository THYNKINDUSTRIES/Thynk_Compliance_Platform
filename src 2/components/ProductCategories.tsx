import React from 'react';
import { Leaf, Droplet, Pill, Cookie, Cloud, Package, FlaskRound, Cigarette, Brain, Sparkles } from 'lucide-react';

interface Props {
  onCategoryClick: (productId: string) => void;
}

export const ProductCategories: React.FC<Props> = ({ onCategoryClick }) => {
  const categories = [
    { id: 'Hemp', name: 'Hemp/CBD', icon: Leaf, color: 'bg-green-100 hover:bg-green-200 text-green-700', description: 'Hemp & CBD regulations' },
    { id: 'Cannabis', name: 'Cannabis', icon: FlaskRound, color: 'bg-purple-100 hover:bg-purple-200 text-purple-700', description: 'Cannabis/marijuana regulations' },
    { id: 'Delta-8', name: 'Delta-8 THC', icon: Droplet, color: 'bg-blue-100 hover:bg-blue-200 text-blue-700', description: 'Delta-8 THC products' },
    { id: 'Kratom', name: 'Kratom', icon: Pill, color: 'bg-red-100 hover:bg-red-200 text-red-700', description: 'Kratom regulations' },
    { id: 'Psychedelics', name: 'Psychedelics', icon: Brain, color: 'bg-pink-100 hover:bg-pink-200 text-pink-700', description: 'Psilocybin, ketamine, MDMA' },
    { id: 'Nicotine', name: 'Nicotine/Vapes', icon: Cloud, color: 'bg-gray-100 hover:bg-gray-200 text-gray-700', description: 'Tobacco & vaping products' },
    { id: 'Edibles', name: 'Edibles', icon: Cookie, color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700', description: 'Edible products' },
    { id: 'Kava', name: 'Kava', icon: Sparkles, color: 'bg-teal-100 hover:bg-teal-200 text-teal-700', description: 'Kava regulations' },
  ];

  return (
    <div className="bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-[#794108] mb-2 text-center">Browse by Product Category</h2>
        <p className="text-gray-600 text-center mb-8">Click a category to filter regulations for cannabis, hemp, kratom, psychedelics & more</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category.id)}
                className={`${category.color} p-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg cursor-pointer`}
              >
                <Icon className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold text-lg">{category.name}</h3>
                <p className="text-sm mt-1 opacity-80">{category.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
