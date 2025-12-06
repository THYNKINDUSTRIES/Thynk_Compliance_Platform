import { TimelineEntry } from './stateDetails';

export const paTimeline: TimelineEntry[] = [
  { id: 'pa-t1', date: '2025-10-15', title: 'Medical Marijuana Program Expansion', type: 'rule', status: 'effective', impact: 'high', summary: 'DOH adds anxiety disorders and Tourette syndrome to qualifying conditions.', products: ['Cannabis'], citation: 'PA Act 16', url: 'https://health.pa.gov' },
  { id: 'pa-t2', date: '2025-09-20', title: 'Hemp-Derived Cannabinoid Restrictions', type: 'guidance', status: 'effective', impact: 'high', summary: 'Department of Agriculture issues guidance restricting intoxicating hemp products.', products: ['Hemp', 'Delta-8'], citation: 'PA Dept Ag Guidance 2025-09', url: 'https://agriculture.pa.gov' },
  { id: 'pa-t3', date: '2025-08-10', title: 'Adult-Use Cannabis Legalization Bill', type: 'bill', status: 'proposed', impact: 'high', summary: 'SB 846 proposes adult-use cannabis legalization framework.', products: ['Cannabis'], citation: 'PA SB 846', url: 'https://legis.state.pa.us' }
];
