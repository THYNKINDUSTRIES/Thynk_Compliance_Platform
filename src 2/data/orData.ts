import { StateDetail, ComplianceDeadline, Authority, TimelineEntry } from './stateDetails';
import { orLicensing, orTesting, orPackaging } from './orDataRequirements';

const timeline: TimelineEntry[] = [
  { id: 'or-t1', date: '2025-10-08', title: 'Psilocybin Service Center Licenses', type: 'rule', status: 'effective', impact: 'high', summary: 'OHA issues additional psilocybin service center licenses.', products: ['Psychedelics'], citation: 'ORS 475A', url: 'https://oregon.gov/oha' },
  { id: 'or-t2', date: '2025-09-14', title: 'Cannabis Testing Lab Standards Update', type: 'rule', status: 'adopted', impact: 'medium', summary: 'OLCC updates accreditation standards for cannabis testing labs.', products: ['Cannabis'], citation: 'OAR 333-064', url: 'https://olcc.oregon.gov' }
];

const deadlines: ComplianceDeadline[] = [
  { id: 'or-d1', date: '2025-11-30', title: 'Cannabis License Renewal', description: 'Annual cannabis license renewals due to OLCC.', products: ['Cannabis'], priority: 'critical' }
];

const authorities: Authority[] = [
  { name: 'Oregon Liquor and Cannabis Commission', acronym: 'OLCC', phone: '(503) 872-5000', email: 'marijuana@olcc.oregon.gov', website: 'https://olcc.oregon.gov', address: '9079 SE McLoughlin Blvd, Portland, OR 97222' }
];

export const oregonDetail: StateDetail = {
  id: 'OR', name: 'Oregon', slug: 'oregon',
  summary: 'Oregon has established cannabis and psilocybin programs. Hemp products are legal with regulatory oversight.',
  lastUpdated: '2025-10-08', timeline, deadlines, authorities,
  licensing: orLicensing, testing: orTesting, packaging: orPackaging
};

