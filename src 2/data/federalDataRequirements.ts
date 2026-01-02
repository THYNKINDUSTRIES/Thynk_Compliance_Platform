import { LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';

export const federalLicensing: LicenseRequirement[] = [
  {
    type: 'DEA Registration',
    authority: 'Drug Enforcement Administration',
    fee: '$888 annually',
    renewal: 'Annual',
    requirements: [
      'Complete DEA Form 224 for new registration',
      'Provide state license documentation',
      'Background check for all key personnel',
      'Secure storage facility requirements',
      'Maintain DEA 222 forms for Schedule I-II substances'
    ]
  },
  {
    type: 'FDA Facility Registration',
    authority: 'Food and Drug Administration',
    fee: 'No fee',
    renewal: 'Biennial (every 2 years)',
    requirements: [
      'Register facility within 60 days of operation',
      'Designate a U.S. agent for foreign facilities',
      'Maintain current good manufacturing practices (cGMP)',
      'Implement hazard analysis and risk-based preventive controls',
      'Update registration within 60 days of any changes'
    ]
  }
];

export const federalTesting: TestingRequirement[] = [
  {
    product: 'All Cannabis Products',
    analytes: ['Pesticides (66 compounds)', 'Heavy Metals', 'Microbial Contaminants', 'Mycotoxins', 'Residual Solvents'],
    actionLevels: 'EPA limits: <0.1 ppm most pesticides; Lead <0.5 ppm; Arsenic <0.2 ppm',
    labAccreditation: 'ISO/IEC 17025 accreditation required'
  },
  {
    product: 'Edibles and Ingestibles',
    analytes: ['Pathogenic Bacteria', 'Salmonella', 'E. coli', 'Aflatoxins', 'Ochratoxin A'],
    actionLevels: 'Zero tolerance for Salmonella; E. coli <100 CFU/g; Aflatoxins <20 ppb',
    labAccreditation: 'FDA-registered laboratory with validated methods'
  }
];

export const federalPackaging: PackagingRequirement[] = [
  {
    product: 'All Cannabis Products',
    childResistant: true,
    warnings: [
      'WARNING: This product contains cannabis and may cause impairment',
      'Keep out of reach of children and pets',
      'For use only by adults 21 years of age and older'
    ],
    labeling: [
      'Product name and net quantity',
      'Manufacturer name and address',
      'Batch/lot number for traceability',
      'Accurate ingredient list in descending order',
      'Allergen warnings (if applicable)',
      'No false or misleading health claims'
    ],
    restrictions: [
      'Must meet CPSC 16 CFR 1700.20 child-resistant standards',
      'Cannot resemble candy or appeal to children',
      'No health benefit claims without FDA approval'
    ]
  }
];
