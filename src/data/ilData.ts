import { StateDetail, ComplianceDeadline, Authority } from './stateDetails';
import { ilTimeline } from './ilTimeline';
import { ilLicensing, ilTesting, ilPackaging } from './ilDataRequirements';


const deadlines: ComplianceDeadline[] = [
  { id: 'il-d1', date: '2025-12-20', title: 'Cannabis Dispensary License Renewal', description: 'All adult-use and medical dispensary licenses must be renewed annually.', products: ['Cannabis'], priority: 'critical' },
  { id: 'il-d2', date: '2025-11-15', title: 'Hemp Processor Registration', description: 'Hemp processors must register with Department of Agriculture for 2026.', products: ['Hemp'], priority: 'important' }
];

const authorities: Authority[] = [
  { name: 'Illinois Department of Financial and Professional Regulation', acronym: 'IDFPR', phone: '(888) 473-4858', email: 'fpr.prfgroup@illinois.gov', website: 'https://idfpr.illinois.gov', address: '100 West Randolph Street, Chicago, IL 60601' },
  { name: 'Illinois Department of Agriculture', acronym: 'IDOA', phone: '(217) 782-2172', email: 'agr.hemp@illinois.gov', website: 'https://agr.illinois.gov', address: 'PO Box 19281, Springfield, IL 62794' }
];

export const illinoisDetail: StateDetail = {
  id: 'IL', name: 'Illinois', slug: 'illinois',
  summary: 'Illinois has a mature adult-use cannabis market with strong social equity provisions. Hemp-derived intoxicating cannabinoids now require dispensary licensing.',
  lastUpdated: '2025-10-25', timeline: ilTimeline, deadlines, authorities,
  licensing: ilLicensing, testing: ilTesting, packaging: ilPackaging
};

