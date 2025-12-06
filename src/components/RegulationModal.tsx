import React from 'react';
import { Regulation } from '@/data/regulations';
import { PRODUCTS, STATUSES } from '@/data/products';
import { FavoriteButton } from '@/components/FavoriteButton';
import { WorkflowTriggerButton } from '@/components/WorkflowTriggerButton';


interface Props {
  regulation: Regulation | null;
  onClose: () => void;
}

export const RegulationModal: React.FC<Props> = ({ regulation, onClose }) => {

  if (!regulation) return null;

  const status = STATUSES.find(s => s.id === regulation.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{regulation.title}</h2>
              <FavoriteButton regulationId={regulation.id} />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{regulation.jurisdiction}</span>
              <span>•</span>
              <span>{regulation.authority}</span>
              {status && (
                <>
                  <span>•</span>
                  <span className={`${status.color} text-white px-2 py-1 rounded text-xs`}>
                    {status.label}
                  </span>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl ml-4">×</button>
        </div>


        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
            <p className="text-gray-700">{regulation.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Key Dates</h3>
              <div className="space-y-1 text-sm">
                <div><span className="text-gray-600">Published:</span> {regulation.publishedAt}</div>
                {regulation.effectiveAt && (
                  <div><span className="text-gray-600">Effective:</span> {regulation.effectiveAt}</div>
                )}
                {regulation.citation && (
                  <div><span className="text-gray-600">Citation:</span> {regulation.citation}</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Affected Products</h3>
              <div className="flex flex-wrap gap-2">
                {regulation.products.map(productId => {
                  const product = PRODUCTS.find(p => p.id === productId);
                  return product ? (
                    <span key={productId} className={`${product.color} text-white text-xs px-2 py-1 rounded`}>
                      {product.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Supply Chain Stages</h3>
            <div className="flex flex-wrap gap-2">
              {regulation.stages.map(stage => (
                <span key={stage} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded">
                  {stage}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={regulation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#794108] hover:bg-[#5a3006] text-white px-6 py-2 rounded-lg transition-colors"
            >
              View Primary Source
            </a>
            <WorkflowTriggerButton 
              instrumentId={regulation.id} 
              instrumentTitle={regulation.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

