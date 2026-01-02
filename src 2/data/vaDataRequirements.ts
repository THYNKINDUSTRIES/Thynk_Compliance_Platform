import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const vaLicensing: LicenseRequirement[] = [
  { type: 'Pharmaceutical Processor', authority: 'BOP', fee: '$10,000', renewal: 'Annual', requirements: ['Background check', 'Financial capability', 'Security plan', 'Dispensing plan', 'Quality assurance program'] },
  { type: 'Hemp Dealer', authority: 'VDACS', fee: '$250', renewal: 'Annual', requirements: ['Dealer registration', 'Product testing', 'Labeling compliance', 'Record keeping'] },
  { type: 'Hemp Processor', authority: 'VDACS', fee: '$250', renewal: 'Annual', requirements: ['Processing facility registration', 'Testing protocols', 'Product compliance'] },
  { type: 'CBD/Kratom Retailer', authority: 'Local', fee: 'Varies', renewal: 'Annual', requirements: ['Business license', 'Age verification procedures', 'Product labeling', 'Testing documentation'] }
];

export const vaTesting: TestingRequirement[] = [
  { product: 'Medical Cannabis Oil', analytes: ['Cannabinoids', 'Microbials', 'Mycotoxins', 'Heavy Metals', 'Pesticides', 'Residual Solvents'], actionLevels: 'BOP standards per 18VAC110-60', labAccreditation: 'ISO/IEC 17025 accredited laboratory' },
  { product: 'Hemp Products', analytes: ['Total THC', 'CBD', 'Contaminants'], actionLevels: '0.3% total THC', labAccreditation: 'DEA-registered laboratory' },
  { product: 'Kratom Products', analytes: ['Alkaloid content', 'Contaminants', 'Heavy Metals', 'Microbials'], actionLevels: 'KCPA standards', labAccreditation: 'Third-party certified lab' }
];

export const vaPackaging: PackagingRequirement[] = [
  { product: 'Medical Cannabis Oil', childResistant: true, warnings: ['For medical use only', 'Keep away from children', 'Impairment warning'], labeling: ['Product name', 'Cannabinoid content', 'Net weight', 'Batch number', 'Expiration date', 'Processor info'], restrictions: ['Opaque packaging', 'Tamper-evident', 'No false claims'] },
  { product: 'Hemp/CBD Products', childResistant: false, warnings: ['Not FDA evaluated'], labeling: ['Cannabinoid content', 'Serving size', 'Manufacturer info', 'Batch number'], restrictions: ['No drug claims', 'Accurate labeling'] }
];
