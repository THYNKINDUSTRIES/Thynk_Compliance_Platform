import { StateDetail, ComplianceDeadline, Authority, LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

import { txTimeline } from './txTimeline';

const deadlines: ComplianceDeadline[] = [
  { id: 'tx-d1', date: '2025-12-15', title: 'Hemp Processor Registration Renewal', description: 'All hemp processors must renew annual registration with DSHS.', products: ['Hemp'], priority: 'critical' },
  { id: 'tx-d2', date: '2025-11-30', title: 'Nicotine Retailer Permit Renewal', description: 'Tobacco and nicotine retailer permits expire annually.', products: ['Nicotine'], priority: 'important' }
];

const authorities: Authority[] = [
  { name: 'Department of State Health Services', acronym: 'DSHS', phone: '(512) 776-7111', email: 'customer.service@dshs.texas.gov', website: 'https://dshs.texas.gov', address: '1100 West 49th Street, Austin, TX 78756' },
  { name: 'Texas Department of Agriculture', acronym: 'TDA', phone: '(512) 463-7476', email: 'hemp@texasagriculture.gov', website: 'https://texasagriculture.gov', address: 'PO Box 12847, Austin, TX 78711' }
];

const licensing: LicenseRequirement[] = [
  { type: 'Hemp Processor Registration', authority: 'DSHS', fee: '$1,200', renewal: 'Annual', requirements: ['Facility inspection', 'Product testing protocols', 'Batch tracking system', 'Quality control procedures'] },
  { type: 'Compassionate Use Registry', authority: 'DSHS', fee: '$0 (for patients)', renewal: 'Annual', requirements: ['Physician certification', 'Qualifying condition', 'Texas residency proof'] }
];

const testing: TestingRequirement[] = [
  { product: 'Hemp Products', analytes: ['Total THC', 'Delta-8 THC', 'Delta-9 THC', 'Heavy Metals', 'Pesticides'], actionLevels: '0.3% total THC max; Delta-8 THC prohibited', labAccreditation: 'ISO/IEC 17025 or equivalent' },
  { product: 'Low-THC Cannabis (Compassionate Use)', analytes: ['THC', 'CBD', 'Contaminants'], actionLevels: '0.5% THC or less; 10% CBD minimum', labAccreditation: 'State-approved laboratory' }
];

const packaging: PackagingRequirement[] = [
  { product: 'Hemp/CBD Products', childResistant: false, warnings: ['Not for use by minors', 'Not evaluated by FDA'], labeling: ['Total THC content', 'Serving size', 'Manufacturer info', 'Batch number'], restrictions: ['No Delta-8 THC', 'No synthetic cannabinoids', 'Cannot resemble food products'] },
  { product: 'Nicotine Products', childResistant: true, warnings: ['Nicotine is addictive', 'Keep away from children'], labeling: ['Nicotine content', 'Ingredient list', 'Health warnings'], restrictions: ['No sales to minors under 21'] }
];

export const texasDetail: StateDetail = {
  id: 'TX', name: 'Texas', slug: 'texas',
  summary: 'Texas regulates hemp products through DSHS with strict THC limits. Delta-8 THC is banned. Kratom remains legal but faces potential age restrictions.',
  lastUpdated: '2025-10-20', timeline: txTimeline, deadlines, authorities,
  licensing, testing, packaging
};

