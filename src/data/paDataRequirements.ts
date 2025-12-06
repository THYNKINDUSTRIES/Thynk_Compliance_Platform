import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const paLicensing: LicenseRequirement[] = [
  { type: 'Medical Marijuana Dispensary', authority: 'DOH', fee: '$30,000', renewal: 'Annual', requirements: ['Background check', 'Financial solvency', 'Dispensing plan', 'Security measures', 'Employee training program'] },
  { type: 'Medical Marijuana Grower/Processor', authority: 'DOH', fee: '$200,000 - $500,000', renewal: 'Annual', requirements: ['Cultivation/processing plan', 'Security system', 'Quality assurance', 'Inventory tracking', 'Waste disposal'] },
  { type: 'Clinical Registrant', authority: 'DOH', fee: '$10,000', renewal: 'Annual', requirements: ['Academic clinical research institution', 'IRB approval', 'Research protocol'] },
  { type: 'Hemp Processor', authority: 'PDA', fee: '$500', renewal: 'Annual', requirements: ['Processing facility registration', 'Testing protocols', 'Product compliance'] }
];

export const paTesting: TestingRequirement[] = [
  { product: 'Medical Marijuana', analytes: ['Cannabinoids', 'Microbiological', 'Mycotoxins', 'Heavy Metals', 'Pesticides', 'Residual Solvents'], actionLevels: '28 Pa. Code § 1161.28 standards', labAccreditation: 'DOH-approved testing laboratory' },
  { product: 'Hemp Products', analytes: ['Total THC', 'CBD', 'Contaminants'], actionLevels: '0.3% total THC', labAccreditation: 'DEA-registered lab' }
];

export const paPackaging: PackagingRequirement[] = [
  { product: 'Medical Marijuana', childResistant: true, warnings: ['For medical use only', 'Keep away from children', 'Impairment warning', 'Pregnancy warning'], labeling: ['Product name', 'Form', 'Cannabinoid content', 'Net weight', 'Batch number', 'Expiration date', 'Dispensary info'], restrictions: ['Opaque packaging', 'Tamper-evident', 'No false/misleading statements'] }
];
