import React from 'react';
import { StateInfo } from '@/data/states';

interface Props {
  states: (StateInfo & { lastUpdated?: string; totalInstruments?: number })[];
  onStateClick: (state: StateInfo) => void;
}

export const StateMap: React.FC<Props> = ({ states, onStateClick }) => {
  const statusColors = {
    permissive: 'bg-green-500 hover:bg-green-600',
    moderate: 'bg-yellow-500 hover:bg-yellow-600',
    restrictive: 'bg-red-500 hover:bg-red-600'
  };

  const formatLastUpdated = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">U.S. Regulatory Map</h2>
        <p className="text-gray-300 text-sm">Click any state to view detailed regulations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
        {states.map(state => {
          const lastUpdated = formatLastUpdated(state.lastUpdated);
          return (
            <div
              key={state.id}
              onClick={() => onStateClick(state)}
              className={`${statusColors[state.status]} text-white rounded-lg p-4 cursor-pointer transition-all transform hover:scale-105 shadow-lg relative`}
            >
              {lastUpdated && (
                <div className="absolute top-1 right-1 bg-black bg-opacity-40 text-xs px-1.5 py-0.5 rounded">
                  {lastUpdated}
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{state.id}</div>
                <div className="text-xs mb-2">{state.name}</div>
                <div className="text-xs opacity-90">
                  <div>{state.totalInstruments || state.recentUpdates} items</div>
                  <div>{state.activeDeadlines} deadlines</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-6 mt-6">

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-white text-sm">Permissive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-white text-sm">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-white text-sm">Restrictive</span>
        </div>
      </div>
    </div>
  );
};
