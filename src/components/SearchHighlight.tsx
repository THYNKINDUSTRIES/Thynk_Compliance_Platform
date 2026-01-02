import React from 'react';

interface Props {
  headline?: string;
  fallbackText: string;
  className?: string;
}

export const SearchHighlight: React.FC<Props> = ({ headline, fallbackText, className = '' }) => {
  if (!headline) {
    return <span className={className}>{fallbackText}</span>;
  }

  // Parse the headline HTML from ts_headline (contains <b> tags for highlights)
  const parseHighlight = (text: string) => {
    const parts = text.split(/(<b>.*?<\/b>)/g);
    
    return parts.map((part, idx) => {
      if (part.startsWith('<b>') && part.endsWith('</b>')) {
        const content = part.slice(3, -4);
        return (
          <mark key={idx} className="bg-yellow-200 font-semibold px-1 rounded">
            {content}
          </mark>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <span className={className}>
      {parseHighlight(headline)}
    </span>
  );
};
