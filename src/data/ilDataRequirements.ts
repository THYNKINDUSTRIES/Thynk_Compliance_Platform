import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const ilLicensing: LicenseRequirement[] = [
  { type: 'Adult-Use Dispensary', authority: 'IDFPR', fee: '$30,000 - $60,000', renewal: 'Annual', requirements: ['Background check', 'Social equity verification (conditional)', 'Security plan', 'Dispensing plan', 'Agent training'] },
  { type: 'Cannabis Cultivation Center', authority: 'IDFPR', fee: '$100,000 - $200,000', renewal: 'Annual', requirements: ['Cultivation plan', 'Security measures', 'Track-and-trace system', 'Energy plan', 'Labor peace agreement'] },
  { type: 'Cannabis Infuser', authority: 'IDFPR', fee: '$75,000', renewal: 'Annual', requirements: ['Infusion protocols', 'Quality control plan', 'Packaging plan', 'Recall procedures'] },
  { type: 'Hemp Processor', authority: 'IDOA', fee: '$750', renewal: 'Annual', requirements: ['Processing facility registration', 'Testing compliance', 'Product labeling'] }
];

export const ilTesting: TestingRequirement[] = [
  { product: 'Cannabis Flower', analytes: ['Cannabinoids', 'Microbials', 'Mycotoxins', 'Pesticides', 'Heavy Metals', 'Residual Solvents'], actionLevels: 'IDFPR standards per 68 IAC 1290', labAccreditation: 'IDFPR-licensed testing facility' },
  { product: 'Cannabis Concentrates/Infused', analytes: ['Potency', 'Residual Solvents', 'Pesticides', 'Heavy Metals', 'Foreign Material'], actionLevels: 'Solvent limits per 68 IAC 1290', labAccreditation: 'IDFPR-licensed testing facility' }
];

export const ilPackaging: PackagingRequirement[] = [
  { product: 'Adult-Use Cannabis', childResistant: true, warnings: ['Intoxicating effects', 'Pregnancy warning', 'Impaired driving', 'Unlawful outside Illinois'], labeling: ['Universal symbol', 'THC/CBD content', 'Net weight', 'Batch number', 'Test date', 'License number'], restrictions: ['Opaque/child-resistant', 'No appeal to minors', 'Resealable for multiple servings'] }
];
