import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const njLicensing: LicenseRequirement[] = [
  { type: 'Cannabis Retailer', authority: 'CRC', fee: '$20,000', renewal: 'Annual', requirements: ['Background check', 'Social equity priority', 'Diversity plan', 'Security measures', 'Municipal approval', 'Community impact statement'] },
  { type: 'Cannabis Cultivator', authority: 'CRC', fee: '$20,000', renewal: 'Annual', requirements: ['Cultivation plan', 'Security system', 'Track-and-trace', 'Environmental plan', 'Labor harmony'] },
  { type: 'Cannabis Manufacturer', authority: 'CRC', fee: '$20,000', renewal: 'Annual', requirements: ['Manufacturing protocols', 'Extraction methods', 'Quality assurance', 'Product development plan'] },
  { type: 'Hemp Processor', authority: 'NJDA', fee: '$2,000', renewal: 'Annual', requirements: ['Processing facility registration', 'Testing protocols', 'Product compliance'] }
];

export const njTesting: TestingRequirement[] = [
  { product: 'Cannabis Flower', analytes: ['Cannabinoids', 'Microbials', 'Mycotoxins', 'Heavy Metals', 'Pesticides', 'Residual Solvents'], actionLevels: 'N.J.A.C. 17:30 standards', labAccreditation: 'CRC-licensed clinical laboratory' },
  { product: 'Cannabis Concentrates/Edibles', analytes: ['Potency', 'Residual Solvents', 'Pesticides', 'Heavy Metals', 'Homogeneity'], actionLevels: 'Solvent limits per N.J.A.C. 17:30', labAccreditation: 'CRC-licensed clinical laboratory' }
];

export const njPackaging: PackagingRequirement[] = [
  { product: 'Cannabis Products', childResistant: true, warnings: ['Intoxicating effects', 'Pregnancy warning', 'Impaired driving', 'For adults 21+'], labeling: ['Universal symbol', 'THC/CBD content per serving', 'Net weight', 'Batch number', 'Test date', 'License number', 'Allergen statement'], restrictions: ['Opaque/child-resistant', 'No appeal to minors', 'Resealable for multiple servings'] }
];
