import { StateDetail, ComplianceDeadline, Authority } from './stateDetails';
import { maTimeline } from './maTimeline';
import { maLicensing, maTesting, maPackaging } from './maDataRequirements';


const deadlines: ComplianceDeadline[] = [
  { id: 'ma-d1', date: '2025-12-15', title: 'Cannabis Establishment License Renewal', description: 'All marijuana establishment licenses must be renewed with CCC annually.', products: ['Cannabis'], priority: 'critical' },
  { id: 'ma-d2', date: '2025-11-10', title: 'Tobacco Retailer Permit Renewal', description: 'Local tobacco retailer permits expire and require renewal.', products: ['Nicotine'], priority: 'important' }
];

const authorities: Authority[] = [
  { name: 'Cannabis Control Commission', acronym: 'CCC', phone: '(617) 701-8400', email: 'CannabisCommission@mass.gov', website: 'https://masscannabiscontrol.com', address: '2 Washington Street, Boston, MA 02108' },
  { name: 'Department of Public Health', acronym: 'DPH', phone: '(617) 624-6000', email: 'dph@mass.gov', website: 'https://mass.gov/dph', address: '250 Washington Street, Boston, MA 02108' }
];

export const massachusettsDetail: StateDetail = {
  id: 'MA', name: 'Massachusetts', slug: 'massachusetts',
  summary: 'Massachusetts has a mature cannabis market with strong social equity focus. Flavored tobacco is banned statewide. Hemp-derived intoxicating products prohibited outside dispensaries.',
  lastUpdated: '2025-10-22', timeline: maTimeline, deadlines, authorities,
  licensing: maLicensing, testing: maTesting, packaging: maPackaging
};

