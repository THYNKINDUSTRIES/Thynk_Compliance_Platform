import { federalLicensing, federalTesting, federalPackaging } from './federalDataRequirements';
import { federalTimeline } from './federalTimeline';

export const federalData = {
  id: 'federal',
  name: 'Federal',
  fullName: 'Federal Regulations',
  status: 'active',
  lastUpdated: '2024-11-05',
  regulations: [
    {
      id: 'fed-reg-1',
      title: 'DEA Controlled Substances Registration',
      category: 'licensing',
      status: 'active',
      effectiveDate: '2024-01-01',
      description: 'Federal registration requirements for handling Schedule I controlled substances including cannabis',
      agency: 'Drug Enforcement Administration (DEA)',
      impact: 'high',
      requirements: federalLicensing
    },
    {
      id: 'fed-reg-2',
      title: 'FDA Food Safety Modernization Act (FSMA)',
      category: 'testing',
      status: 'active',
      effectiveDate: '2024-03-01',
      description: 'Federal food safety standards applicable to cannabis edibles and CBD products',
      agency: 'Food and Drug Administration (FDA)',
      impact: 'high',
      requirements: federalTesting
    },
    {
      id: 'fed-reg-3',
      title: 'Consumer Product Safety Commission Standards',
      category: 'packaging',
      status: 'active',
      effectiveDate: '2024-01-01',
      description: 'Child-resistant packaging requirements under Poison Prevention Packaging Act',
      agency: 'Consumer Product Safety Commission (CPSC)',
      impact: 'high',
      requirements: federalPackaging
    },
    {
      id: 'fed-reg-4',
      title: 'FinCEN Banking Guidance',
      category: 'compliance',
      status: 'active',
      effectiveDate: '2024-04-15',
      description: 'Financial crimes enforcement guidance for cannabis banking relationships',
      agency: 'Financial Crimes Enforcement Network (FinCEN)',
      impact: 'medium',
      requirements: []
    }
  ],
  timeline: federalTimeline,
  stats: {
    totalRegulations: 4,
    activeRegulations: 4,
    upcomingDeadlines: 3,
    recentUpdates: 2
  }
};
