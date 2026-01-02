import { StateDetail, ComplianceDeadline, Authority } from './stateDetails';
import { paTimeline } from './paTimeline';
import { paLicensing, paTesting, paPackaging } from './paDataRequirements';


const deadlines: ComplianceDeadline[] = [
  { id: 'pa-d1', date: '2025-12-31', title: 'Medical Marijuana Dispensary License Renewal', description: 'All dispensary permits must be renewed annually with Department of Health.', products: ['Cannabis'], priority: 'critical' },
  { id: 'pa-d2', date: '2025-11-20', title: 'Hemp Grower Registration Deadline', description: 'Hemp growers must register with Department of Agriculture for 2026 season.', products: ['Hemp'], priority: 'important' }
];

const authorities: Authority[] = [
  { name: 'Pennsylvania Department of Health', acronym: 'DOH', phone: '(717) 787-2500', email: 'ra-dhmedmarijuana@pa.gov', website: 'https://health.pa.gov', address: '625 Forster Street, Harrisburg, PA 17120' },
  { name: 'Pennsylvania Department of Agriculture', acronym: 'PDA', phone: '(717) 787-4737', email: 'ra-hemp@pa.gov', website: 'https://agriculture.pa.gov', address: '2301 North Cameron Street, Harrisburg, PA 17110' }
];

export const pennsylvaniaDetail: StateDetail = {
  id: 'PA', name: 'Pennsylvania', slug: 'pennsylvania',
  summary: 'Pennsylvania has an established medical marijuana program with expanding conditions. Hemp-derived intoxicating products face restrictions. Adult-use legalization is under consideration.',
  lastUpdated: '2025-10-15', timeline: paTimeline, deadlines, authorities,
  licensing: paLicensing, testing: paTesting, packaging: paPackaging
};

