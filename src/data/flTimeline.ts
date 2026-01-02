import { TimelineEntry } from './stateDetails';

export const flTimeline: TimelineEntry[] = [
  { id: 'fl-t1', date: '2025-10-25', title: 'Medical Marijuana Dispensary Expansion', type: 'rule', status: 'effective', impact: 'high', summary: 'OMMU approves 15 new dispensary locations statewide under expanded medical program.', products: ['Cannabis'], citation: 'Fla. Admin. Code r. 64-4.002', url: 'https://knowthefactsmmj.com' },
  { id: 'fl-t2', date: '2025-10-01', title: 'Hemp Extract Product Registration', type: 'rule', status: 'effective', impact: 'high', summary: 'FDACS implements new registration system for hemp extract manufacturers and retailers.', products: ['Hemp', 'CBD'], citation: 'Fla. Stat. § 581.217', url: 'https://fdacs.gov' },
  { id: 'fl-t3', date: '2025-09-10', title: 'Kratom Consumer Protection Act Adopted', type: 'rule', status: 'adopted', impact: 'medium', summary: 'Florida adopts Kratom Consumer Protection Act with testing and labeling requirements.', products: ['Kratom'], citation: 'Fla. Stat. § 500.90', url: 'https://leg.state.fl.us' },
  { id: 'fl-t4', date: '2025-08-20', title: 'Flavored Vape Product Restrictions', type: 'bill', status: 'proposed', impact: 'high', summary: 'SB 1342 proposes restrictions on flavored nicotine vaping products.', products: ['Nicotine'], citation: 'SB 1342', url: 'https://flsenate.gov' },
  { id: 'fl-t5', date: '2025-07-15', title: 'Delta-8 THC Labeling Requirements', type: 'guidance', status: 'effective', impact: 'medium', summary: 'FDACS issues guidance on delta-8 product labeling and testing standards.', products: ['Delta-8'], citation: 'FDACS Memo 2025-07', url: 'https://fdacs.gov' }
];
