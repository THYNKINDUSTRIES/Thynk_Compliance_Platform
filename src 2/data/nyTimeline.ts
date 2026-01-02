import { TimelineEntry } from './stateDetails';

export const nyTimeline: TimelineEntry[] = [
  { id: 'ny-t1', date: '2025-10-18', title: 'Adult-Use Cannabis Retail Licenses Issued', type: 'rule', status: 'effective', impact: 'high', summary: 'OCM issues 50 new conditional adult-use retail dispensary licenses.', products: ['Cannabis'], citation: 'Cannabis Law § 68', url: 'https://cannabis.ny.gov' },
  { id: 'ny-t2', date: '2025-09-25', title: 'Delta-8 THC Product Ban Enforcement', type: 'enforcement', status: 'effective', impact: 'high', summary: 'OCM begins enforcement action against retailers selling delta-8 THC products.', products: ['Delta-8'], citation: 'OCM Guidance 2025-09', url: 'https://cannabis.ny.gov' },
  { id: 'ny-t3', date: '2025-08-15', title: 'Hemp Cannabinoid Extract Regulations', type: 'rule', status: 'adopted', impact: 'high', summary: 'New regulations for hemp-derived cannabinoid products including THCa.', products: ['Hemp', 'THCa', 'CBD'], citation: '10 NYCRR Part 1004', url: 'https://cannabis.ny.gov' },
  { id: 'ny-t4', date: '2025-07-20', title: 'Flavored E-Cigarette Ban Extended', type: 'enforcement', status: 'effective', impact: 'medium', summary: 'DOH extends enforcement of flavored vaping product ban.', products: ['Nicotine'], citation: 'Public Health Law § 1399-mm-1', url: 'https://health.ny.gov' },
  { id: 'ny-t5', date: '2025-06-30', title: 'Cannabis Social Equity Program Launch', type: 'rule', status: 'effective', impact: 'medium', summary: 'OCM launches social equity licensing program for cannabis businesses.', products: ['Cannabis'], citation: 'Cannabis Law § 87', url: 'https://cannabis.ny.gov' }
];
