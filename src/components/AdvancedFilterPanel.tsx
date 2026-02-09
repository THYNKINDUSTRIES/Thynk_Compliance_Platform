import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, Save, X, Search } from 'lucide-react';
import { PRODUCTS, STAGES, INSTRUMENT_TYPES } from '@/data/products';
import { US_STATES } from '@/data/states';


interface FilterPreset {
  id: string;
  name: string;
  filters: any;
}

interface Props {
  selectedProducts: string[];
  selectedStages: string[];
  selectedTypes: string[];
  selectedJurisdictions: string[];
  selectedAuthorities: string[];
  selectedStatuses: string[];
  selectedImpacts: string[];
  dateFrom: string;
  dateTo: string;
  onProductToggle: (id: string) => void;
  onStageToggle: (stage: string) => void;
  onTypeToggle: (type: string) => void;
  onJurisdictionToggle: (jurisdiction: string) => void;
  onAuthorityToggle: (authority: string) => void;
  onStatusToggle: (status: string) => void;
  onImpactToggle: (impact: string) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onClearAll: () => void;
  onLoadPreset: (preset: FilterPreset) => void;
}

const ALL_STATES = US_STATES.map(s => s.name).sort();
const AUTHORITIES = ['FDA', 'DEA', 'USDA', 'EPA', 'FTC', 'DOT', 'OSHA', 'ATF', 'State Agency'];
const STATUSES = ['Proposed', 'Final', 'Active', 'Pending', 'Archived', 'Effective', 'Repealed'];
const IMPACTS = ['High', 'Medium', 'Low'];

const PRESET_KEY = 'regulationFilterPresets';

export const AdvancedFilterPanel: React.FC<Props> = (props) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['products', 'jurisdiction'])
  );
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PRESET_KEY);
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load presets', e);
      }
    }
  }, []);

  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
  }, [presets]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) newSet.delete(section);
      else newSet.add(section);
      return newSet;
    });
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: {
        products: props.selectedProducts,
        stages: props.selectedStages,
        types: props.selectedTypes,
        jurisdictions: props.selectedJurisdictions,
        authorities: props.selectedAuthorities,
        statuses: props.selectedStatuses,
        impacts: props.selectedImpacts,
        dateFrom: props.dateFrom,
        dateTo: props.dateTo
      }
    };
    setPresets([...presets, preset]);
    setPresetName('');
    setShowSavePreset(false);
  };

  const deletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
  };

  const filteredStates = ALL_STATES.filter(state => 
    state.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const FilterSection = ({ title, items, selected, onToggle, sectionKey, searchable = false }: any) => (
    <div className="mb-4 border-b border-gray-200 pb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between mb-2 text-left hover:text-[#794108]"
      >
        <h4 className="font-medium text-gray-700 text-sm">{title}</h4>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <span className="text-xs bg-[#794108] text-white px-2 py-0.5 rounded-full">
              {selected.length}
            </span>
          )}
          {expandedSections.has(sectionKey) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {expandedSections.has(sectionKey) && (
        <div className="space-y-2 mt-2">
          {searchable && (
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                className="pl-8 text-sm"
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            {items.map((item: any) => (
              <label key={item.id || item} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selected.includes(item.id || item)}
                  onChange={() => onToggle(item.id || item)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{item.name || item}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E5DFD6]">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#794108]">Advanced Filters</h3>
          <Button variant="ghost" size="sm" onClick={props.onClearAll} className="text-[#E89C5C] hover:text-[#794108]">
            Clear All
          </Button>
        </div>

        {/* Saved Presets */}
        {presets.length > 0 && (
          <div className="mb-4">
            <Label className="text-xs text-gray-600 mb-2 block">Saved Presets</Label>
            <div className="space-y-1">
              {presets.map(preset => (
                <div key={preset.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <button
                    onClick={() => props.onLoadPreset(preset)}
                    className="text-[#794108] hover:underline flex-1 text-left"
                  >
                    {preset.name}
                  </button>
                  <button onClick={() => deletePreset(preset.id)} className="text-red-500 hover:text-red-700">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Preset */}
        {showSavePreset ? (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <Input
              placeholder="Preset name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="mb-2"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={savePreset} className="bg-[#794108] hover:bg-[#E89C5C]">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowSavePreset(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSavePreset(true)}
            className="w-full mb-4"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Current Filters
          </Button>
        )}
      </div>

      <ScrollArea className="h-[600px] p-5">
        {/* Date Range */}
        <div className="mb-4 border-b border-gray-200 pb-4">
          <h4 className="font-medium text-gray-700 text-sm mb-2">Date Range</h4>
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-gray-600">From</Label>
              <Input
                type="date"
                value={props.dateFrom}
                onChange={(e) => props.onDateFromChange(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">To</Label>
              <Input
                type="date"
                value={props.dateTo}
                onChange={(e) => props.onDateToChange(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <FilterSection
          title="States & Jurisdictions"
          items={filteredStates}
          selected={props.selectedJurisdictions}
          onToggle={props.onJurisdictionToggle}
          sectionKey="jurisdiction"
          searchable={true}
        />

        <FilterSection
          title="Products"
          items={PRODUCTS}
          selected={props.selectedProducts}
          onToggle={props.onProductToggle}
          sectionKey="products"
        />

        <FilterSection
          title="Regulation Type"
          items={INSTRUMENT_TYPES}
          selected={props.selectedTypes}
          onToggle={props.onTypeToggle}
          sectionKey="types"
        />

        <FilterSection
          title="Impact Level"
          items={IMPACTS}
          selected={props.selectedImpacts}
          onToggle={props.onImpactToggle}
          sectionKey="impact"
        />

        <FilterSection
          title="Status"
          items={STATUSES}
          selected={props.selectedStatuses}
          onToggle={props.onStatusToggle}
          sectionKey="status"
        />

        <FilterSection
          title="Authority"
          items={AUTHORITIES}
          selected={props.selectedAuthorities}
          onToggle={props.onAuthorityToggle}
          sectionKey="authority"
        />

        <FilterSection
          title="Supply Chain Stage"
          items={STAGES}
          selected={props.selectedStages}
          onToggle={props.onStageToggle}
          sectionKey="stages"
        />
      </ScrollArea>
    </div>
  );
};
