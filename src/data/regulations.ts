export interface Regulation {
  id: string;
  title: string;
  summary: string;
  jurisdiction: string;
  authority: string;
  status: string;
  products: string[];
  stages: string[];
  instrumentType: string;
  publishedAt: string;
  effectiveAt?: string;
  citation?: string;
  url: string;
  impact: 'high' | 'medium' | 'low';
}

export const MOCK_REGULATIONS: Regulation[] = [
  {
    id: '1',
    title: 'FDA Issues Warning Letters to Delta-8 THC Manufacturers',
    summary: 'FDA issued warning letters to five companies marketing delta-8 THC products with unapproved health claims and inadequate labeling.',
    jurisdiction: 'Federal',
    authority: 'FDA',
    status: 'effective',
    products: ['delta8'],
    stages: ['Manufacturing', 'Retail', 'Advertising'],
    instrumentType: 'Warning Letter',
    publishedAt: '2025-10-15',
    citation: 'FDA-2025-WL-0234',
    url: '#',
    impact: 'high'
  },
  {
    id: '2',
    title: 'California DCC Updates Testing Requirements for Hemp Products',
    summary: 'New pesticide action levels and expanded heavy metal testing panel for intoxicating hemp products effective January 1, 2026.',
    jurisdiction: 'California',
    authority: 'DCC',
    status: 'adopted',
    products: ['hemp', 'thca', 'delta8'],
    stages: ['Testing', 'Manufacturing'],
    instrumentType: 'Rule',
    publishedAt: '2025-10-10',
    effectiveAt: '2026-01-01',
    citation: 'Cal. Code Regs. tit. 16, § 5724',
    url: '#',
    impact: 'high'
  },
];
