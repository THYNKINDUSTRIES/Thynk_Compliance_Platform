import { StateDetail, ComplianceDeadline, Authority } from './stateDetails';
import { waTimeline } from './waTimeline';
import { waLicensing, waTesting, waPackaging } from './waDataRequirements';


const deadlines: ComplianceDeadline[] = [
  { id: 'wa-d1', date: '2025-11-30', title: 'Cannabis License Renewal Period', description: 'Annual renewal period for all cannabis licenses.', products: ['Cannabis'], priority: 'critical' },
  { id: 'wa-d2', date: '2025-12-15', title: 'Hemp Product Registration Deadline', description: 'All hemp cannabinoid products must be registered with DOH.', products: ['Hemp', 'CBD'], priority: 'important' }
];

const authorities: Authority[] = [
  { name: 'Washington State Liquor and Cannabis Board', acronym: 'LCB', phone: '(360) 664-1600', email: 'licensing@lcb.wa.gov', website: 'https://lcb.wa.gov', address: '3000 Pacific Ave SE, Olympia, WA 98504' },
  { name: 'Washington State Dept of Health', acronym: 'DOH', phone: '(360) 236-4501', email: 'hemp@doh.wa.gov', website: 'https://doh.wa.gov', address: '310 Israel Rd SE, Tumwater, WA 98501' },
  { name: 'Washington State Dept of Agriculture', acronym: 'WSDA', phone: '(360) 902-1800', email: 'hemp@agr.wa.gov', website: 'https://agr.wa.gov', address: 'PO Box 42560, Olympia, WA 98504' }
];

export const washingtonDetail: StateDetail = {
  id: 'WA', name: 'Washington', slug: 'washington',
  summary: 'Washington has a mature cannabis market and emerging psilocybin program. Hemp cannabinoids are regulated through DOH registration. Kratom is legal without specific restrictions.',
  lastUpdated: '2025-10-10', timeline: waTimeline, deadlines, authorities,
  licensing: waLicensing, testing: waTesting, packaging: waPackaging

};
