import { StateDetail, ComplianceDeadline, Authority, TimelineEntry } from './stateDetails';
import { coLicensing, coTesting, coPackaging } from './coDataRequirements';

const timeline: TimelineEntry[] = [
  { id: 'co-t1', date: '2025-10-12', title: 'Psilocybin Healing Centers Licensed', type: 'rule', status: 'effective', impact: 'high', summary: 'Natural Medicine Division issues first psilocybin healing center licenses.', products: ['Psychedelics'], citation: 'Prop 122 Implementation', url: 'https://sbg.colorado.gov' },
  { id: 'co-t2', date: '2025-09-18', title: 'Cannabis Delivery Service Expansion', type: 'rule', status: 'effective', impact: 'medium', summary: 'MED expands delivery zones for licensed cannabis retailers.', products: ['Cannabis'], citation: '1 CCR 212-3', url: 'https://sbg.colorado.gov' },
  { id: 'co-t3', date: '2025-08-05', title: 'Hemp Extract Product Testing Standards', type: 'rule', status: 'adopted', impact: 'medium', summary: 'Updated testing requirements for hemp-derived products.', products: ['Hemp', 'CBD'], citation: 'CRS 35-61-101', url: 'https://ag.colorado.gov' }
];

const deadlines: ComplianceDeadline[] = [
  { id: 'co-d1', date: '2025-12-31', title: 'Cannabis License Renewal', description: 'Annual renewal for all cannabis business licenses.', products: ['Cannabis'], priority: 'critical' }
];

const authorities: Authority[] = [
  { name: 'Marijuana Enforcement Division', acronym: 'MED', phone: '(303) 205-2300', email: 'dor_medinfo@state.co.us', website: 'https://sbg.colorado.gov', address: '1881 Pierce St, Lakewood, CO 80214' }
];

export const coloradoDetail: StateDetail = {
  id: 'CO', name: 'Colorado', slug: 'colorado',
  summary: 'Colorado has a mature cannabis market and pioneering psilocybin program. Hemp products are legal with testing requirements.',
  lastUpdated: '2025-10-12', timeline, deadlines, authorities,
  licensing: coLicensing, testing: coTesting, packaging: coPackaging
};

