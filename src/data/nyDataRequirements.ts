import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const nyLicensing: LicenseRequirement[] = [
  { type: 'Adult-Use Cannabis Retailer', authority: 'OCM', fee: '$2,000 - $20,000', renewal: 'Annual', requirements: ['Social equity eligibility (priority)', 'Background check', 'Business plan', 'Financial disclosure', 'Local approval'] },
  { type: 'Cannabis Cultivator', authority: 'OCM', fee: '$10,000 - $300,000', renewal: 'Annual', requirements: ['Cultivation plan', 'Security measures', 'Environmental compliance', 'Track-and-trace system'] },
  { type: 'Hemp Processor', authority: 'NYS Ag & Markets', fee: '$500', renewal: 'Annual', requirements: ['Processing facility registration', 'Testing protocols', 'Batch tracking'] }
];

export const nyTesting: TestingRequirement[] = [
  { product: 'Adult-Use Cannabis', analytes: ['Cannabinoids', 'Pesticides', 'Heavy Metals', 'Mycotoxins', 'Microbials', 'Residual Solvents'], actionLevels: 'OCM standards; 0.3% THC for hemp', labAccreditation: 'OCM-licensed laboratory' },
  { product: 'Hemp Products', analytes: ['Total THC', 'CBD', 'Contaminants'], actionLevels: '0.3% total THC dry weight', labAccreditation: 'ISO/IEC 17025' }
];

export const nyPackaging: PackagingRequirement[] = [
  { product: 'Adult-Use Cannabis', childResistant: true, warnings: ['THC content warning', 'Pregnancy warning', 'Impairment warning'], labeling: ['Universal symbol', 'THC/CBD content', 'Batch number', 'Test results', 'Licensee info'], restrictions: ['Opaque packaging', 'No appeal to minors', 'No health claims'] },
  { product: 'Hemp/CBD Products', childResistant: false, warnings: ['Not FDA evaluated'], labeling: ['Cannabinoid content', 'Serving size', 'Manufacturer info', 'Batch number'], restrictions: ['No drug claims', 'Accurate labeling'] }
];
