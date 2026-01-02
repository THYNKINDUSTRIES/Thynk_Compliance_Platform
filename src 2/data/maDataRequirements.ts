import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const maLicensing: LicenseRequirement[] = [
  { type: 'Marijuana Retailer', authority: 'CCC', fee: '$1,500 - $50,000', renewal: 'Annual', requirements: ['Background check', 'Host community agreement', 'Management and operations profile', 'Security plan', 'Diversity plan'] },
  { type: 'Marijuana Cultivator', authority: 'CCC', fee: '$1,500 - $100,000', renewal: 'Annual', requirements: ['Cultivation tier', 'Security measures', 'Track-and-trace system', 'Energy compliance', 'Waste management'] },
  { type: 'Marijuana Product Manufacturer', authority: 'CCC', fee: '$1,500 - $75,000', renewal: 'Annual', requirements: ['Manufacturing plan', 'Extraction protocols', 'Quality control', 'Recall procedures'] },
  { type: 'Hemp Processor', authority: 'MDAR', fee: '$100 - $1,000', renewal: 'Annual', requirements: ['Processing facility registration', 'Testing protocols', 'Product labeling'] }
];

export const maTesting: TestingRequirement[] = [
  { product: 'Marijuana Flower', analytes: ['Cannabinoids', 'Microbials', 'Mycotoxins', 'Heavy Metals', 'Pesticides', 'Residual Solvents'], actionLevels: '935 CMR 500.160 standards', labAccreditation: 'CCC-licensed independent testing laboratory' },
  { product: 'Marijuana Concentrates/Infused', analytes: ['Potency', 'Residual Solvents', 'Pesticides', 'Heavy Metals', 'Homogeneity'], actionLevels: 'Solvent limits per 935 CMR 500.160', labAccreditation: 'CCC-licensed independent testing laboratory' }
];

export const maPackaging: PackagingRequirement[] = [
  { product: 'Marijuana Products', childResistant: true, warnings: ['Intoxicating effects', 'Pregnancy/nursing warning', 'Impaired driving', 'Keep away from children'], labeling: ['Universal symbol', 'THC/CBD content', 'Net weight', 'Batch number', 'Test results', 'License number', 'Ingredients'], restrictions: ['Opaque/child-resistant', 'No appeal to persons under 21', 'Resealable'] }
];
