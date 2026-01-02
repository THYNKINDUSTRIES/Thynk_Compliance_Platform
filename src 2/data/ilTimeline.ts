import { TimelineEntry } from './stateDetails';

export const ilTimeline: TimelineEntry[] = [
  { id: 'il-t1', date: '2025-10-25', title: 'Cannabis Social Equity License Lottery', type: 'rule', status: 'effective', impact: 'high', summary: 'IDFPR conducts lottery for 185 new social equity dispensary licenses.', products: ['Cannabis'], citation: 'IL Admin Code § 1290', url: 'https://idfpr.illinois.gov' },
  { id: 'il-t2', date: '2025-09-30', title: 'Hemp-Derived Cannabinoid Restrictions', type: 'rule', status: 'effective', impact: 'high', summary: 'Delta-8, Delta-10, and THC-O products now require cannabis dispensary licensing.', products: ['Hemp', 'Delta-8'], citation: 'IL Public Act 103-0563', url: 'https://ilga.gov' },
  { id: 'il-t3', date: '2025-08-20', title: 'Tobacco 21 Retailer Compliance', type: 'enforcement', status: 'effective', impact: 'medium', summary: 'Enhanced enforcement of age verification for tobacco and vaping products.', products: ['Nicotine'], citation: 'IL Tobacco 21 Act', url: 'https://dph.illinois.gov' },
  { id: 'il-t4', date: '2025-07-15', title: 'Cannabis Consumption Lounges Approved', type: 'rule', status: 'effective', impact: 'medium', summary: 'First on-site consumption licenses issued to dispensaries in Chicago.', products: ['Cannabis'], citation: 'IL Cannabis Regulation Act § 55-21', url: 'https://idfpr.illinois.gov' },
  { id: 'il-t5', date: '2025-06-01', title: 'Kratom Consumer Protection Act', type: 'bill', status: 'proposed', impact: 'medium', summary: 'HB 3590 proposes labeling and testing standards for kratom products.', products: ['Kratom'], citation: 'HB 3590', url: 'https://ilga.gov' }
];
