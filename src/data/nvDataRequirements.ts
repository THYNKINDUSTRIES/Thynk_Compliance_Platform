import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const nvLicensing: LicenseRequirement[] = [
  { type: 'Retail Marijuana Store', authority: 'CCB', fee: '$30,000', renewal: 'Annual', requirements: ['Background check', 'Financial disclosure', 'Operating plan', 'Security measures', 'Local government approval'] },
  { type: 'Marijuana Cultivation Facility', authority: 'CCB', fee: '$30,000', renewal: 'Annual', requirements: ['Cultivation plan', 'Security system', 'Inventory tracking', 'Water usage documentation', 'Waste disposal plan'] },
  { type: 'Marijuana Production Facility', authority: 'CCB', fee: '$30,000', renewal: 'Annual', requirements: ['Production protocols', 'Extraction methods', 'Quality assurance plan', 'Employee training'] },
  { type: 'Hemp Handler', authority: 'NDA', fee: '$500', renewal: 'Annual', requirements: ['Handler registration', 'Facility inspection', 'Testing compliance'] }
];

export const nvTesting: TestingRequirement[] = [
  { product: 'Marijuana Flower', analytes: ['Potency', 'Moisture', 'Foreign Material', 'Microbials', 'Mycotoxins', 'Pesticides', 'Heavy Metals'], actionLevels: 'NAC 453A standards', labAccreditation: 'CCB-licensed independent testing laboratory' },
  { product: 'Marijuana Concentrates/Edibles', analytes: ['Potency', 'Residual Solvents', 'Pesticides', 'Heavy Metals', 'Microbials'], actionLevels: 'Solvent limits per NAC 453A', labAccreditation: 'CCB-licensed independent testing laboratory' }
];

export const nvPackaging: PackagingRequirement[] = [
  { product: 'Marijuana Products', childResistant: true, warnings: ['Intoxicating effects', 'Pregnancy warning', 'Keep out of reach of children'], labeling: ['Universal symbol', 'THC/CBD content', 'Net weight', 'Batch number', 'Test results', 'License number', 'Allergen info'], restrictions: ['Opaque packaging', 'No appeal to children', 'Tamper-evident'] }
];
