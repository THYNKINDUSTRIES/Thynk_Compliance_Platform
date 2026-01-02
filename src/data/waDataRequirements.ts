import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const waLicensing: LicenseRequirement[] = [
  { type: 'Cannabis Retailer', authority: 'WSLCB', fee: '$1,000', renewal: 'Annual', requirements: ['Background check', 'Financial documentation', 'Location approval', 'Security plan', 'Business plan'] },
  { type: 'Cannabis Producer', authority: 'WSLCB', fee: '$1,000 - $2,500', renewal: 'Annual', requirements: ['Tier selection (I-III)', 'Traceability system', 'Security measures', 'Waste disposal plan'] },
  { type: 'Cannabis Processor', authority: 'WSLCB', fee: '$1,000', renewal: 'Annual', requirements: ['Processing facility standards', 'Extraction methods approval', 'Quality assurance plan'] },
  { type: 'Hemp Producer', authority: 'WSDA', fee: '$150', renewal: 'Annual', requirements: ['Acreage reporting', 'GPS coordinates', 'Sampling compliance'] }
];

export const waTesting: TestingRequirement[] = [
  { product: 'Cannabis Flower', analytes: ['Cannabinoids', 'Moisture', 'Foreign Matter', 'Microbiological', 'Mycotoxins'], actionLevels: 'WAC 314-55-102 standards', labAccreditation: 'WSLCB-certified lab' },
  { product: 'Cannabis Concentrates', analytes: ['Cannabinoids', 'Residual Solvents', 'Pesticides', 'Heavy Metals', 'Mycotoxins'], actionLevels: 'Solvent limits per WAC 314-55-104', labAccreditation: 'WSLCB-certified lab' }
];

export const waPackaging: PackagingRequirement[] = [
  { product: 'Cannabis Products', childResistant: true, warnings: ['Intoxicating effects', 'Pregnancy warning', 'Keep away from children'], labeling: ['THC/CBD content', 'Net weight', 'Batch number', 'Test date', 'Warning statements'], restrictions: ['Opaque or child-resistant', 'No cartoons', 'No health claims'] }
];
