import { StateDetail, ComplianceDeadline, Authority } from './stateDetails';
import { njTimeline } from './njTimeline';
import { njLicensing, njTesting, njPackaging } from './njDataRequirements';


const deadlines: ComplianceDeadline[] = [
  { id: 'nj-d1', date: '2025-12-31', title: 'Cannabis License Annual Renewal', description: 'All cannabis business licenses must be renewed with CRC by year end.', products: ['Cannabis'], priority: 'critical' },
  { id: 'nj-d2', date: '2025-11-25', title: 'Tobacco Retail License Renewal', description: 'Tobacco and vaping retailer licenses expire annually.', products: ['Nicotine'], priority: 'important' }
];

const authorities: Authority[] = [
  { name: 'Cannabis Regulatory Commission', acronym: 'CRC', phone: '(609) 292-0424', email: 'crc@crc.nj.gov', website: 'https://nj.gov/cannabis', address: 'PO Box 360, Trenton, NJ 08625' },
  { name: 'Department of Health', acronym: 'DOH', phone: '(609) 292-7837', email: 'health@doh.nj.gov', website: 'https://nj.gov/health', address: 'PO Box 360, Trenton, NJ 08625' }
];

export const newJerseyDetail: StateDetail = {
  id: 'NJ', name: 'New Jersey', slug: 'new-jersey',
  summary: 'New Jersey has a rapidly expanding adult-use cannabis market with strong social equity provisions and impact zone benefits. Hemp-derived intoxicating products require cannabis licensing.',
  lastUpdated: '2025-10-28', timeline: njTimeline, deadlines, authorities,
  licensing: njLicensing, testing: njTesting, packaging: njPackaging
};

