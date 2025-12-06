import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const coLicensing: LicenseRequirement[] = [
  { type: 'Retail Marijuana Store', authority: 'MED', fee: '$2,500 - $5,000', renewal: 'Annual', requirements: ['Background check', 'Residency (2 years)', 'Financial records', 'Local approval', 'Operating plan'] },
  { type: 'Marijuana Cultivation Facility', authority: 'MED', fee: '$2,750 - $14,000', renewal: 'Annual', requirements: ['Tier selection', 'Security system', 'Inventory tracking', 'Water rights documentation'] },
  { type: 'Marijuana Product Manufacturer', authority: 'MED', fee: '$2,500 - $11,250', renewal: 'Annual', requirements: ['Manufacturing plan', 'Extraction protocols', 'Quality control procedures'] },
  { type: 'Hemp Processor', authority: 'CDA', fee: '$500 - $2,500', renewal: 'Annual', requirements: ['Processing facility registration', 'Testing protocols', 'Product labeling plan'] }
];

export const coTesting: TestingRequirement[] = [
  { product: 'Marijuana Flower', analytes: ['Potency', 'Microbials', 'Mycotoxins', 'Pesticides', 'Heavy Metals', 'Residual Solvents'], actionLevels: '1 CCR 212-3 standards', labAccreditation: 'MED-licensed testing facility' },
  { product: 'Marijuana Concentrates', analytes: ['Potency', 'Residual Solvents', 'Pesticides', 'Heavy Metals', 'Foreign Material'], actionLevels: 'Solvent limits per 1 CCR 212-3', labAccreditation: 'MED-licensed testing facility' }
];

export const coPackaging: PackagingRequirement[] = [
  { product: 'Retail Marijuana', childResistant: true, warnings: ['Impairment warning', 'Pregnancy/breastfeeding warning', 'Unlawful outside Colorado'], labeling: ['Universal symbol', 'THC content', 'Activation time', 'Batch/tracking number', 'License number'], restrictions: ['Opaque packaging', 'No appeal to children', 'Single-serving indicators'] }
];
