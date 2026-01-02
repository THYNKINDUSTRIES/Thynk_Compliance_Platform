import { StateDetail, ComplianceDeadline, Authority } from './stateDetails';
import { nyTimeline } from './nyTimeline';
import { nyLicensing, nyTesting, nyPackaging } from './nyDataRequirements';

const deadlines: ComplianceDeadline[] = [
  { id: 'ny-d1', date: '2025-12-01', title: 'Cannabis Retail License Application Deadline', description: 'Next round of adult-use retail license applications due to OCM.', products: ['Cannabis'], priority: 'critical' }
];

const authorities: Authority[] = [
  { name: 'Office of Cannabis Management', acronym: 'OCM', phone: '(518) 408-5450', email: 'info@ocm.ny.gov', website: 'https://cannabis.ny.gov', address: '99 Washington Ave, Albany, NY 12260' },
  { name: 'New York State Dept of Agriculture and Markets', acronym: 'AGM', phone: '(518) 457-3880', email: 'hemp@agriculture.ny.gov', website: 'https://agriculture.ny.gov', address: '10B Airline Dr, Albany, NY 12235' },
  { name: 'New York State Dept of Health', acronym: 'DOH', phone: '(518) 474-2011', email: 'ocfs@health.ny.gov', website: 'https://health.ny.gov', address: 'Corning Tower, Empire State Plaza, Albany, NY 12237' }
];

export const newYorkDetail: StateDetail = {
  id: 'NY', name: 'New York', slug: 'new-york',
  summary: 'New York has legalized adult-use cannabis with OCM oversight. Hemp cannabinoids are regulated, and delta-8 THC is banned. Flavored nicotine products are prohibited.',
  lastUpdated: '2025-10-18', timeline: nyTimeline, deadlines, authorities,
  licensing: nyLicensing, testing: nyTesting, packaging: nyPackaging
};

