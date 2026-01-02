import { StateDetail, ComplianceDeadline, Authority } from './stateDetails';
import { nvTimeline } from './nvTimeline';
import { nvLicensing, nvTesting, nvPackaging } from './nvDataRequirements';


const deadlines: ComplianceDeadline[] = [
  { id: 'nv-d1', date: '2025-12-31', title: 'Cannabis Establishment License Renewal', description: 'All cannabis dispensary, cultivation, and production licenses expire annually.', products: ['Cannabis'], priority: 'critical' },
  { id: 'nv-d2', date: '2025-11-30', title: 'Tobacco Retailer License Renewal', description: 'Tobacco and vaping retailer licenses must be renewed with Department of Taxation.', products: ['Nicotine'], priority: 'important' }
];

const authorities: Authority[] = [
  { name: 'Nevada Cannabis Compliance Board', acronym: 'CCB', phone: '(775) 687-6299', email: 'ccb@ccb.nv.gov', website: 'https://ccb.nv.gov', address: '1550 College Parkway, Suite 142, Carson City, NV 89706' },
  { name: 'Nevada Department of Taxation', acronym: 'NDOT', phone: '(866) 962-3707', email: 'taxinfo@tax.nv.gov', website: 'https://tax.nv.gov', address: '1550 College Parkway, Suite 115, Carson City, NV 89706' }
];

export const nevadaDetail: StateDetail = {
  id: 'NV', name: 'Nevada', slug: 'nevada',
  summary: 'Nevada has a robust adult-use cannabis market with consumption lounges and delivery services. Hemp-derived intoxicating products require dispensary licensing.',
  lastUpdated: '2025-10-18', timeline: nvTimeline, deadlines, authorities,
  licensing: nvLicensing, testing: nvTesting, packaging: nvPackaging
};

