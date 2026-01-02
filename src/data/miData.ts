import { StateDetail, ComplianceDeadline, Authority, TimelineEntry } from './stateDetails';
import { miLicensing, miTesting, miPackaging } from './miDataRequirements';

const timeline: TimelineEntry[] = [
  { id: 'mi-t1', date: '2025-10-05', title: 'Adult-Use Cannabis Microbusiness Licenses', type: 'rule', status: 'effective', impact: 'high', summary: 'CRA expands microbusiness licensing for small-scale operations.', products: ['Cannabis'], citation: 'MRTMA § 6', url: 'https://cra.michigan.gov' },
  { id: 'mi-t2', date: '2025-09-01', title: 'Delta-8 THC Product Ban', type: 'enforcement', status: 'effective', impact: 'high', summary: 'State enforcement of delta-8 THC product prohibition begins.', products: ['Delta-8'], citation: 'MCL 333.27954', url: 'https://michigan.gov' }
];

const deadlines: ComplianceDeadline[] = [
  { id: 'mi-d1', date: '2025-12-31', title: 'Cannabis License Renewal', description: 'Annual renewal for cannabis business licenses.', products: ['Cannabis'], priority: 'critical' }
];

const authorities: Authority[] = [
  { name: 'Cannabis Regulatory Agency', acronym: 'CRA', phone: '(517) 284-8599', email: 'cra-info@michigan.gov', website: 'https://cra.michigan.gov', address: '2407 N Grand River Ave, Lansing, MI 48906' }
];

export const michiganDetail: StateDetail = {
  id: 'MI', name: 'Michigan', slug: 'michigan',
  summary: 'Michigan has adult-use cannabis with expanding microbusiness opportunities. Delta-8 THC is banned. Hemp and kratom are legal.',
  lastUpdated: '2025-10-05', timeline, deadlines, authorities,
  licensing: miLicensing, testing: miTesting, packaging: miPackaging
};

