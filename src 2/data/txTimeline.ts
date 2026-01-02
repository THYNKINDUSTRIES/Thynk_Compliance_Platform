import { TimelineEntry } from './stateDetails';

export const txTimeline: TimelineEntry[] = [
  { id: 'tx-t1', date: '2025-10-20', title: 'Hemp THC Concentration Rules Clarified', type: 'guidance', status: 'effective', impact: 'high', summary: 'DSHS clarified that total THC concentration limits apply to finished products, not raw materials.', products: ['Hemp', 'THCa'], citation: 'DSHS Guidance 2025-10', url: 'https://dshs.texas.gov' },
  { id: 'tx-t2', date: '2025-09-15', title: 'Delta-8 THC Sales Ban Enforcement', type: 'enforcement', status: 'effective', impact: 'high', summary: 'State begins enforcement of delta-8 THC product ban following court ruling upholding prohibition.', products: ['Delta-8'], citation: 'Tex. Health & Safety Code § 443.001', url: 'https://statutes.capitol.texas.gov' },
  { id: 'tx-t3', date: '2025-08-30', title: 'Tobacco 21 Enforcement Intensifies', type: 'enforcement', status: 'effective', impact: 'medium', summary: 'DSHS increases compliance checks for tobacco and nicotine sales to minors.', products: ['Nicotine'], citation: 'Tex. Health & Safety Code § 161.082', url: 'https://dshs.texas.gov' },
  { id: 'tx-t4', date: '2025-07-25', title: 'Hemp Processor Registration Requirements', type: 'rule', status: 'effective', impact: 'medium', summary: 'New registration requirements for hemp processors and manufacturers.', products: ['Hemp', 'CBD'], citation: 'DSHS Rule § 229.1', url: 'https://dshs.texas.gov' },
  { id: 'tx-t5', date: '2025-06-10', title: 'Kratom Age Restriction Proposed', type: 'bill', status: 'proposed', impact: 'medium', summary: 'HB 2847 proposes minimum age of 21 for kratom purchases.', products: ['Kratom'], citation: 'HB 2847', url: 'https://capitol.texas.gov' }
];
