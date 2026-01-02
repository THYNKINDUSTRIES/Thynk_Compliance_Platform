import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const azLicensing: LicenseRequirement[] = [
  { type: 'Marijuana Retail Store', authority: 'AZDHS', fee: '$25,000', renewal: 'Biennial', requirements: ['Background check', 'Financial capability', 'Operating plan', 'Security measures', 'Local zoning compliance'] },
  { type: 'Marijuana Cultivation Facility', authority: 'AZDHS', fee: '$25,000', renewal: 'Biennial', requirements: ['Cultivation plan', 'Security system', 'Inventory tracking', 'Water usage plan', 'Odor mitigation'] },
  { type: 'Marijuana Manufacturing Facility', authority: 'AZDHS', fee: '$25,000', renewal: 'Biennial', requirements: ['Manufacturing protocols', 'Extraction equipment approval', 'Quality assurance plan', 'Employee training'] },
  { type: 'Hemp Processor', authority: 'AZDA', fee: '$500', renewal: 'Annual', requirements: ['Processing facility registration', 'Testing protocols', 'Product labeling compliance'] }
];

export const azTesting: TestingRequirement[] = [
  { product: 'Marijuana Products', analytes: ['Potency', 'Microbials', 'Mycotoxins', 'Heavy Metals', 'Pesticides', 'Residual Solvents', 'Filth'], actionLevels: 'A.A.C. R9-17-317 standards', labAccreditation: 'AZDHS-licensed independent testing lab' },
  { product: 'Hemp Products', analytes: ['Total THC', 'CBD', 'Contaminants'], actionLevels: '0.3% total THC dry weight', labAccreditation: 'DEA-registered laboratory' }
];

export const azPackaging: PackagingRequirement[] = [
  { product: 'Marijuana Products', childResistant: true, warnings: ['Intoxicating effects', 'Pregnancy warning', 'Keep away from children', 'Impaired driving'], labeling: ['Universal symbol', 'THC/CBD content per serving', 'Net weight', 'Batch number', 'Test results', 'License number'], restrictions: ['Opaque packaging', 'No appeal to minors', 'Resealable if multiple servings'] }
];
