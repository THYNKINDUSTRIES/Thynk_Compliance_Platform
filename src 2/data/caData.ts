import { StateDetail, ComplianceDeadline, Authority, LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';
import { caTimeline } from './caTimeline';

const deadlines: ComplianceDeadline[] = [
  { id: 'ca-d1', date: '2025-11-15', title: 'Hemp License Renewal Deadline', description: 'All hemp cultivation licenses must be renewed by this date.', products: ['Hemp'], priority: 'critical' },
  { id: 'ca-d2', date: '2025-12-01', title: 'Cannabis Track-and-Trace Compliance', description: 'All licensees must complete METRC system updates.', products: ['Cannabis'], priority: 'important' },
  { id: 'ca-d3', date: '2025-11-30', title: 'Quarterly Testing Report Submission', description: 'Labs must submit Q4 testing reports to CDPH.', products: ['Hemp', 'Cannabis'], priority: 'routine' }
];

const authorities: Authority[] = [
  { name: 'Department of Cannabis Control', acronym: 'DCC', phone: '(844) 612-2322', email: 'licensing@cannabis.ca.gov', website: 'https://dcc.ca.gov', address: '2920 Kilgore Road, Rancho Cordova, CA 95670' },
  { name: 'California Department of Public Health', acronym: 'CDPH', phone: '(916) 558-1784', email: 'cdph.ca.gov', website: 'https://cdph.ca.gov', address: 'PO Box 997377, MS 0500, Sacramento, CA 95899-7377' }
];

const licensing: LicenseRequirement[] = [
  { type: 'Cannabis Retailer', authority: 'DCC', fee: '$1,000 - $96,000 (based on gross revenue)', renewal: 'Annual', requirements: ['Background check', 'Premises diagram', 'Operating procedures', 'Financial statements', 'Local approval'] },
  { type: 'Cannabis Cultivator', authority: 'DCC', fee: '$1,205 - $77,905 (based on canopy size)', renewal: 'Annual', requirements: ['Water rights documentation', 'Environmental compliance', 'Waste management plan', 'Security plan', 'Track-and-trace registration'] },
  { type: 'Hemp Cultivation Registration', authority: 'CDFA', fee: '$900 - $2,000', renewal: 'Annual', requirements: ['GPS coordinates of cultivation sites', 'Sampling plan', 'THC testing protocols', 'Destruction procedures'] }
];

const testing: TestingRequirement[] = [
  { product: 'Cannabis Flower & Products', analytes: ['Cannabinoids', 'Pesticides', 'Heavy Metals', 'Mycotoxins', 'Microbials', 'Residual Solvents', 'Foreign Material'], actionLevels: 'Per CDPH standards - 0.3% THC max for hemp', labAccreditation: 'ISO/IEC 17025 required' },
  { product: 'Hemp Products', analytes: ['Total THC', 'Total CBD', 'Pesticides', 'Heavy Metals'], actionLevels: '0.3% total THC on dry weight basis', labAccreditation: 'DEA-registered lab required' }
];

const packaging: PackagingRequirement[] = [
  { product: 'Cannabis Products', childResistant: true, warnings: ['Prop 65 warning', 'Intoxicating effects warning', 'Pregnancy/breastfeeding warning'], labeling: ['UID number', 'Cannabinoid content', 'Net weight', 'Manufacturer info', 'Batch number', 'Test results'], restrictions: ['No cartoon characters', 'No health claims', 'No resemblance to candy'] },
  { product: 'Hemp/CBD Products', childResistant: false, warnings: ['Not evaluated by FDA', 'Not intended to diagnose, treat, cure, or prevent disease'], labeling: ['Ingredient list', 'CBD content per serving', 'Manufacturer contact', 'Batch/lot number'], restrictions: ['Cannot make drug claims', 'Cannot add to food without FDA approval'] }
];

export const californiaDetail: StateDetail = {
  id: 'CA', name: 'California', slug: 'california',
  summary: 'California maintains comprehensive regulations for hemp, cannabinoids, kratom, and nicotine products through multiple state agencies including DCC, CDPH, and CDTFA.',
  lastUpdated: '2025-10-20', timeline: caTimeline, deadlines, authorities,
  licensing, testing, packaging
};

