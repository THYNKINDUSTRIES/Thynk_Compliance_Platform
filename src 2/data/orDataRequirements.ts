import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const orLicensing: LicenseRequirement[] = [
  { type: 'Marijuana Retailer', authority: 'OLCC', fee: '$4,750', renewal: 'Annual', requirements: ['Background check', 'Residency (2 years)', 'Financial interest disclosure', 'Local land use approval', 'Operating plan'] },
  { type: 'Marijuana Producer', authority: 'OLCC', fee: '$3,750 - $5,750', renewal: 'Annual', requirements: ['Canopy size tier', 'Water rights', 'Waste management plan', 'Pesticide use plan', 'Security measures'] },
  { type: 'Marijuana Processor', authority: 'OLCC', fee: '$4,750', renewal: 'Annual', requirements: ['Processing methods disclosure', 'Extraction equipment approval', 'Quality assurance protocols'] },
  { type: 'Hemp Grower', authority: 'ODA', fee: '$1,300', renewal: 'Annual', requirements: ['Acreage registration', 'GPS coordinates', 'Sampling compliance', 'THC testing'] }
];

export const orTesting: TestingRequirement[] = [
  { product: 'Marijuana Flower', analytes: ['Cannabinoids', 'Moisture', 'Water Activity', 'Pesticides', 'Solvents'], actionLevels: 'OAR 333-007-0400 standards', labAccreditation: 'ORELAP-accredited lab' },
  { product: 'Marijuana Concentrates/Extracts', analytes: ['Cannabinoids', 'Residual Solvents', 'Pesticides', 'Microbiological', 'Mycotoxins'], actionLevels: 'Solvent limits per OAR 333-007-0410', labAccreditation: 'ORELAP-accredited lab' }
];

export const orPackaging: PackagingRequirement[] = [
  { product: 'Marijuana Items', childResistant: true, warnings: ['Intoxicating effects', 'Pregnancy warning', 'Unlawful outside Oregon'], labeling: ['Universal symbol', 'THC/CBD mg per serving', 'Net weight', 'Harvest/production date', 'UID number'], restrictions: ['Opaque or child-resistant', 'No cartoons/images appealing to minors', 'Resealable if multiple servings'] }
];
