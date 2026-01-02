import { TimelineEntry } from './stateDetails';

export const waTimeline: TimelineEntry[] = [
  { id: 'wa-t1', date: '2025-10-10', title: 'Cannabis Social Consumption Licenses Approved', type: 'rule', status: 'effective', impact: 'high', summary: 'LCB approves first social consumption endorsements for licensed retailers.', products: ['Cannabis'], citation: 'WAC 314-55-515', url: 'https://lcb.wa.gov' },
  { id: 'wa-t2', date: '2025-09-05', title: 'Hemp Cannabinoid Product Registration', type: 'rule', status: 'effective', impact: 'high', summary: 'DOH implements registration system for hemp-derived cannabinoid products.', products: ['Hemp', 'THCa', 'Delta-8'], citation: 'WAC 246-70-050', url: 'https://doh.wa.gov' },
  { id: 'wa-t3', date: '2025-08-12', title: 'Psilocybin Services Program Framework', type: 'rule', status: 'adopted', impact: 'medium', summary: 'DOH adopts framework for psilocybin service center licensing.', products: ['Psychedelics'], citation: 'RCW 69.55', url: 'https://doh.wa.gov' },
  { id: 'wa-t4', date: '2025-07-01', title: 'Tobacco Age Verification Requirements', type: 'enforcement', status: 'effective', impact: 'medium', summary: 'Enhanced age verification for online tobacco and nicotine sales.', products: ['Nicotine'], citation: 'RCW 70.155.090', url: 'https://doh.wa.gov' }
];
