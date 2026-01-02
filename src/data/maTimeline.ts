import { TimelineEntry } from './stateDetails';

export const maTimeline: TimelineEntry[] = [
  { id: 'ma-t1', date: '2025-10-22', title: 'Cannabis Social Equity Program Expansion', type: 'rule', status: 'effective', impact: 'high', summary: 'CCC expands technical assistance and priority licensing for social equity applicants.', products: ['Cannabis'], citation: 'MA CCC Regulation 935 CMR 500.105', url: 'https://masscannabiscontrol.com' },
  { id: 'ma-t2', date: '2025-09-18', title: 'Hemp-Derived Intoxicating Products Ban', type: 'rule', status: 'effective', impact: 'high', summary: 'DPH prohibits sale of delta-8, delta-10, and THC-O products outside licensed dispensaries.', products: ['Hemp', 'Delta-8'], citation: 'MA DPH Regulation 105 CMR 725.001', url: 'https://mass.gov/dph' },
  { id: 'ma-t3', date: '2025-08-25', title: 'Flavored Tobacco Ban Enforcement', type: 'enforcement', status: 'effective', impact: 'high', summary: 'Strict enforcement of statewide ban on flavored tobacco and vaping products.', products: ['Nicotine'], citation: 'MA Gen Laws Ch 270 § 6', url: 'https://malegislature.gov' },
  { id: 'ma-t4', date: '2025-07-12', title: 'Cannabis Delivery License Priority', type: 'rule', status: 'effective', impact: 'medium', summary: 'CCC prioritizes delivery-only licenses for social equity applicants.', products: ['Cannabis'], citation: 'MA CCC Policy 2025-07', url: 'https://masscannabiscontrol.com' },
  { id: 'ma-t5', date: '2025-06-20', title: 'Psilocybin Decriminalization Expansion', type: 'bill', status: 'proposed', impact: 'medium', summary: 'Bill proposes statewide framework for regulated psilocybin therapy.', products: ['Psychedelics'], citation: 'HD 3605', url: 'https://malegislature.gov' }
];
