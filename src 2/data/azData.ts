import { StateDetail, ComplianceDeadline, Authority, TimelineEntry } from './stateDetails';
import { azLicensing, azTesting, azPackaging } from './azDataRequirements';

const timeline: TimelineEntry[] = [
  { id: 'az-t1', date: '2025-10-15', title: 'Social Equity Cannabis Licenses', type: 'rule', status: 'effective', impact: 'high', summary: 'AZDHS issues social equity cannabis dispensary licenses.', products: ['Cannabis'], citation: 'A.R.S. § 36-2854', url: 'https://azdhs.gov' },
  { id: 'az-t2', date: '2025-08-22', title: 'Hemp Product Labeling Requirements', type: 'guidance', status: 'effective', impact: 'medium', summary: 'AZDA issues guidance on hemp product labeling and testing.', products: ['Hemp', 'CBD'], citation: 'AZDA Memo 2025-08', url: 'https://agriculture.az.gov' }
];

const deadlines: ComplianceDeadline[] = [
  { id: 'az-d1', date: '2025-11-30', title: 'Cannabis License Renewal', description: 'Annual renewal period for cannabis establishment licenses.', products: ['Cannabis'], priority: 'critical' }
];

const authorities: Authority[] = [
  { name: 'Arizona Dept of Health Services', acronym: 'AZDHS', phone: '(844) 694-8255', email: 'medicalmarijuana@azdhs.gov', website: 'https://azdhs.gov', address: '150 N 18th Ave, Phoenix, AZ 85007' }
];

export const arizonaDetail: StateDetail = {
  id: 'AZ', name: 'Arizona', slug: 'arizona',
  summary: 'Arizona has adult-use cannabis with social equity licensing. Hemp products are legal with labeling requirements.',
  lastUpdated: '2025-10-15', timeline, deadlines, authorities,
  licensing: azLicensing, testing: azTesting, packaging: azPackaging
};

