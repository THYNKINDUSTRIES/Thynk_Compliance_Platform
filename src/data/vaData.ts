import { StateDetail, ComplianceDeadline, Authority } from './stateDetails';
import { vaTimeline } from './vaTimeline';
import { vaLicensing, vaTesting, vaPackaging } from './vaDataRequirements';


const deadlines: ComplianceDeadline[] = [
  { id: 'va-d1', date: '2025-12-10', title: 'Medical Cannabis Processor License Renewal', description: 'Pharmaceutical processor permits must be renewed with Board of Pharmacy.', products: ['Cannabis'], priority: 'critical' },
  { id: 'va-d2', date: '2025-11-18', title: 'Hemp Grower Registration Renewal', description: 'Industrial hemp growers must renew registration with VDACS.', products: ['Hemp'], priority: 'important' }
];

const authorities: Authority[] = [
  { name: 'Virginia Board of Pharmacy', acronym: 'BOP', phone: '(804) 367-4456', email: 'pharmacyboard@dhp.virginia.gov', website: 'https://dhp.virginia.gov', address: '9960 Mayland Drive, Suite 300, Richmond, VA 23233' },
  { name: 'Virginia Department of Agriculture and Consumer Services', acronym: 'VDACS', phone: '(804) 786-3501', email: 'vdacs@vdacs.virginia.gov', website: 'https://vdacs.virginia.gov', address: '102 Governor Street, Richmond, VA 23219' }
];

export const virginiaDetail: StateDetail = {
  id: 'VA', name: 'Virginia', slug: 'virginia',
  summary: 'Virginia has a developing medical cannabis program with limited dispensaries. Delta-8 THC is restricted. Adult-use cannabis legalization framework is under legislative consideration.',
  lastUpdated: '2025-10-30', timeline: vaTimeline, deadlines, authorities,
  licensing: vaLicensing, testing: vaTesting, packaging: vaPackaging
};

