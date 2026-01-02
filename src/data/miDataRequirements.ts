import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const miLicensing: LicenseRequirement[] = [
  { type: 'Adult-Use Marijuana Retailer', authority: 'CRA', fee: '$25,000', renewal: 'Annual', requirements: ['Background check', 'Financial disclosure', 'Municipal authorization', 'Security plan', 'Inventory tracking system'] },
  { type: 'Marijuana Grower (Class A-C)', authority: 'CRA', fee: '$4,000 - $40,000', renewal: 'Annual', requirements: ['Plant count tier', 'Security measures', 'Waste disposal plan', 'Track-and-trace compliance'] },
  { type: 'Marijuana Processor', authority: 'CRA', fee: '$40,000', renewal: 'Annual', requirements: ['Processing facility standards', 'Extraction methods', 'Quality control plan', 'Employee training'] },
  { type: 'Industrial Hemp Grower', authority: 'MDARD', fee: '$100 - $1,350', renewal: 'Annual', requirements: ['Acreage registration', 'GPS coordinates', 'THC testing compliance'] }
];

export const miTesting: TestingRequirement[] = [
  { product: 'Marijuana Flower', analytes: ['Potency', 'Microbials', 'Mycotoxins', 'Heavy Metals', 'Pesticides', 'Residual Solvents'], actionLevels: 'LARA/CRA standards', labAccreditation: 'CRA-licensed safety compliance facility' },
  { product: 'Marijuana Concentrates', analytes: ['Potency', 'Residual Solvents', 'Pesticides', 'Heavy Metals', 'Foreign Material'], actionLevels: 'Solvent limits per CRA rules', labAccreditation: 'CRA-licensed safety compliance facility' }
];

export const miPackaging: PackagingRequirement[] = [
  { product: 'Adult-Use Marijuana', childResistant: true, warnings: ['Intoxication warning', 'Pregnancy/nursing warning', 'Impaired driving warning'], labeling: ['Universal symbol', 'THC/CBD content', 'Net weight', 'Batch number', 'Test results', 'License number'], restrictions: ['Opaque packaging', 'No appeal to minors', 'Tamper-evident seal'] }
];
