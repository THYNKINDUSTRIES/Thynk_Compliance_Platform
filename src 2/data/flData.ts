import { StateDetail, ComplianceDeadline, Authority, LicenseRequirement, TestingRequirement, PackagingRequirement } from './stateDetails';
import { flTimeline } from './flTimeline';

const deadlines: ComplianceDeadline[] = [
  { id: 'fl-d1', date: '2025-12-31', title: 'Hemp Extract Registration Deadline', description: 'All hemp extract businesses must complete FDACS registration.', products: ['Hemp', 'CBD'], priority: 'critical' },
  { id: 'fl-d2', date: '2025-11-15', title: 'Medical Marijuana License Renewal', description: 'OMMU medical marijuana dispensary licenses require renewal.', products: ['Cannabis'], priority: 'critical' },
  { id: 'fl-d3', date: '2025-12-01', title: 'Kratom Product Testing Compliance', description: 'All kratom products must meet new testing standards.', products: ['Kratom'], priority: 'important' },
  { id: 'fl-d4', date: '2025-11-30', title: 'Tobacco Retailer Permit Renewal', description: 'Annual tobacco and nicotine retailer permit renewals due.', products: ['Nicotine'], priority: 'routine' }
];

const authorities: Authority[] = [
  { name: 'Florida Dept of Agriculture and Consumer Services', acronym: 'FDACS', phone: '(850) 410-3800', email: 'hemp@fdacs.gov', website: 'https://fdacs.gov', address: '600 S Calhoun St, Tallahassee, FL 32399' },
  { name: 'Office of Medical Marijuana Use', acronym: 'OMMU', phone: '(850) 245-4657', email: 'mmur@flhealth.gov', website: 'https://knowthefactsmmj.com', address: '4052 Bald Cypress Way, Tallahassee, FL 32399' }
];

const licensing: LicenseRequirement[] = [
  { type: 'Medical Marijuana Treatment Center', authority: 'OMMU', fee: '$60,830 initial + $146,000 annual', renewal: 'Biennial', requirements: ['Vertical integration required', 'Financial stability proof', 'Security plan', 'Dispensing organization registration', 'Background checks for all principals'] },
  { type: 'Hemp Extract Registration', authority: 'FDACS', fee: '$250', renewal: 'Annual', requirements: ['Product testing certificates', 'Labeling compliance', 'QR code for lab results', 'Business registration'] },
  { type: 'Kratom Vendor Registration', authority: 'FDACS', fee: '$500', renewal: 'Annual', requirements: ['Product testing for contaminants', 'Age verification system', 'Labeling requirements', 'Good manufacturing practices'] }
];

const testing: TestingRequirement[] = [
  { product: 'Medical Cannabis', analytes: ['Cannabinoids', 'Pesticides', 'Heavy Metals', 'Mycotoxins', 'Microbials', 'Residual Solvents'], actionLevels: 'Per OMMU standards', labAccreditation: 'Florida-licensed testing laboratory' },
  { product: 'Hemp/CBD Products', analytes: ['Total THC', 'CBD', 'Heavy Metals', 'Pesticides'], actionLevels: '0.3% total THC on dry weight', labAccreditation: 'ISO/IEC 17025 accredited' },
  { product: 'Kratom Products', analytes: ['Mitragynine', 'Heavy Metals', 'Salmonella', 'Dangerous Adulterants'], actionLevels: 'No dangerous adulterants; safe heavy metal levels', labAccreditation: 'Third-party laboratory' }
];

const packaging: PackagingRequirement[] = [
  { product: 'Medical Cannabis', childResistant: true, warnings: ['For medical use only', 'Keep out of reach of children', 'Impairment warning'], labeling: ['THC/CBD content', 'Batch number', 'Expiration date', 'MMTC name', 'Patient ID'], restrictions: ['Opaque packaging', 'No health claims', 'Medical marijuana symbol required'] },
  { product: 'Hemp/CBD Products', childResistant: false, warnings: ['Not FDA evaluated', 'Not for use by minors'], labeling: ['QR code to lab results', 'Total THC content', 'CBD content', 'Batch/lot number', 'Manufacturer info'], restrictions: ['No drug claims', 'Accurate cannabinoid content'] },
  { product: 'Kratom Products', childResistant: false, warnings: ['Not for use by minors under 21', 'Consult physician if pregnant'], labeling: ['Mitragynine content', 'Recommended serving', 'Manufacturer contact', 'Batch number'], restrictions: ['No adulteration', 'No synthetic alkaloids', 'Age verification required'] }
];

export const floridaDetail: StateDetail = {
  id: 'FL', name: 'Florida', slug: 'florida',
  summary: 'Florida has an active medical marijuana program and comprehensive hemp regulations. Kratom is legal with consumer protections. Delta-8 and other hemp cannabinoids are legal with proper labeling.',
  lastUpdated: '2025-10-25', timeline: flTimeline, deadlines, authorities,
  licensing, testing, packaging
};

