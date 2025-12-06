import { Regulation } from './regulations';

export const ADDITIONAL_REGULATIONS: Regulation[] = [
  {
    id: '3',
    title: 'Washington LCB Proposes New Packaging Standards for Cannabis Products',
    summary: 'Proposed rule would require child-resistant, opaque packaging and enhanced warning labels for all cannabis products sold in retail.',
    jurisdiction: 'Washington',
    authority: 'LCB',
    status: 'open_comment',
    products: ['delta9', 'hemp'],
    stages: ['Packaging', 'Retail'],
    instrumentType: 'Rule',
    publishedAt: '2025-10-12',
    effectiveAt: '2026-03-01',
    citation: 'WSR 25-20-045',
    url: '#',
    impact: 'medium'
  },
  {
    id: '4',
    title: 'DEA Schedules Synthetic Cannabinoid Analogs',
    summary: 'Emergency scheduling order places several synthetic cannabinoid analogs in Schedule I, effective immediately.',
    jurisdiction: 'Federal',
    authority: 'DEA',
    status: 'effective',
    products: ['delta8', 'delta9'],
    stages: ['Manufacturing', 'Distribution', 'Retail'],
    instrumentType: 'Order',
    publishedAt: '2025-10-08',
    effectiveAt: '2025-10-08',
    citation: '90 FR 68421',
    url: '#',
    impact: 'high'
  },

  {
    id: '5',
    title: 'Oregon OLCC Updates Hemp Testing Panel Requirements',
    summary: 'Expanded testing requirements now include CBN, CBG, and additional terpene profiles for all hemp-derived products.',
    jurisdiction: 'Oregon',
    authority: 'OLCC',
    status: 'adopted',
    products: ['hemp', 'thca'],
    stages: ['Testing', 'Manufacturing'],
    instrumentType: 'Rule',
    publishedAt: '2025-10-05',
    effectiveAt: '2025-12-01',
    citation: 'OAR 845-025-7000',
    url: '#',
    impact: 'medium'
  },
];
