import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';

interface Props {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<Props> = ({ 
  onSearch, 
  placeholder = 'Search regulations, citations, or keywords...' 
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions } = useSearchSuggestions(query);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced search - trigger search 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    setShowSuggestions(false);
  };

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative" ref={wrapperRef}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-24 py-4 text-lg border-2 border-[#E89C5C]/30 rounded-lg focus:border-[#794108] focus:outline-none shadow-sm"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-24 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#794108] hover:bg-[#5a3006] text-white px-6 py-2 rounded-lg transition-colors z-10"
        >
          Search
        </button>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#E89C5C]/30 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            <div className="p-2">
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Popular searches</span>
              </div>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSuggestion(suggestion.query)}
                  className="w-full text-left px-3 py-2 hover:bg-[#FDF8F3] rounded transition-colors flex items-center justify-between"
                >
                  <span className="text-gray-700">{suggestion.query}</span>
                  <span className="text-xs text-gray-400">{suggestion.count} searches</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        {['Hemp', 'Delta-8', 'Kratom', 'FDA Warning', 'Testing Requirements'].map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => {
              setQuery(tag);
              onSearch(tag);
            }}
            className="text-sm bg-[#FDF8F3] hover:bg-[#E89C5C]/20 text-[#794108] px-3 py-1 rounded-full transition-colors border border-[#E89C5C]/30"
          >
            {tag}
          </button>
        ))}
      </div>
    </form>
  );
};
