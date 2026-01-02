export interface KeyPersonnel {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  bio?: string;
  imageUrl?: string;
}

export interface EnforcementAction {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'fine' | 'license_suspension' | 'license_revocation' | 'warning' | 'cease_desist' | 'criminal_referral';
  amount?: number;
  licenseeType?: string;
  resolution?: string;
  documentUrl?: string;
}

export interface RegulatoryTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'law_enacted' | 'rule_adopted' | 'rule_proposed' | 'guidance_issued' | 'program_launched' | 'amendment' | 'emergency_rule';
  impact: 'high' | 'medium' | 'low';
  documentUrl?: string;
}

export interface RegulatoryFocusArea {
  name: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  recentActivity?: string;
}

export interface StateAgencyProfile {
  stateCode: string;
  stateName: string;
  slug: string;
  agency: {
    name: string;
    acronym: string;
    description: string;
    mission?: string;
    established: string;
    parentDepartment?: string;
    logoUrl?: string;
  };
  contact: {
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    fax?: string;
    email: string;
    generalInquiriesEmail?: string;
    licensingEmail?: string;
    complianceEmail?: string;
    website: string;
    licensingPortal?: string;
    publicRecordsUrl?: string;
    complaintsUrl?: string;
    officeHours: string;
    timezone: string;
  };
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  keyPersonnel: KeyPersonnel[];
  regulatoryFocusAreas: RegulatoryFocusArea[];
  enforcementActions: EnforcementAction[];
  regulatoryTimeline: RegulatoryTimelineEvent[];
  statistics: {
    totalLicenses?: number;
    activeLicenses?: number;
    pendingApplications?: number;
    enforcementActionsYTD?: number;
    totalFinesYTD?: number;
    inspectionsYTD?: number;
  };
  licenseTypes: string[];
  quickLinks: { label: string; url: string }[];
}

export const stateAgencyProfiles: StateAgencyProfile[] = [
  {
    stateCode: 'CA',
    stateName: 'California',
    slug: 'california',
    agency: {
      name: 'Department of Cannabis Control',
      acronym: 'DCC',
      description: 'The Department of Cannabis Control (DCC) is the single state regulatory agency responsible for licensing and regulating commercial cannabis activity in California.',
      mission: 'To provide a safe, sustainable, and equitable cannabis market that protects consumers, supports a competitive and inclusive industry, and benefits all Californians.',
      established: 'July 2021',
      parentDepartment: 'Business, Consumer Services and Housing Agency',
    },
    contact: {
      address: '2920 Kilgore Road',
      city: 'Rancho Cordova',
      state: 'CA',
      zip: '95670',
      phone: '844-612-2322',
      fax: '916-465-9090',
      email: 'info@cannabis.ca.gov',
      generalInquiriesEmail: 'info@cannabis.ca.gov',
      licensingEmail: 'licensing@cannabis.ca.gov',
      complianceEmail: 'compliance@cannabis.ca.gov',
      website: 'https://cannabis.ca.gov',
      licensingPortal: 'https://online.bcc.ca.gov/bcc/Login.aspx',
      publicRecordsUrl: 'https://cannabis.ca.gov/about-us/public-records-requests/',
      complaintsUrl: 'https://cannabis.ca.gov/resources/file-a-complaint/',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM PT',
      timezone: 'America/Los_Angeles',
    },
    socialMedia: {
      twitter: 'https://twitter.com/CADeptCannabis',
      facebook: 'https://www.facebook.com/CADeptCannabis',
      instagram: 'https://www.instagram.com/cadeptcannabis/',
      linkedin: 'https://www.linkedin.com/company/california-department-of-cannabis-control/',
      youtube: 'https://www.youtube.com/@CADeptCannabis',
    },
    keyPersonnel: [
      {
        name: 'Nicole Elliott',
        title: 'Director',
        email: 'director@cannabis.ca.gov',
        bio: 'Nicole Elliott was appointed Director of the Department of Cannabis Control by Governor Gavin Newsom in July 2021. She previously served as Senior Advisor on Cannabis to the Governor.',
      },
      {
        name: 'Rasha Salama',
        title: 'Chief Deputy Director',
        bio: 'Oversees day-to-day operations and strategic initiatives for the department.',
      },
      {
        name: 'Tamara Colson',
        title: 'Deputy Director, Licensing',
        email: 'licensing@cannabis.ca.gov',
        bio: 'Leads the licensing division responsible for processing and managing all cannabis business licenses.',
      },
      {
        name: 'Matthew Lee',
        title: 'Deputy Director, Compliance',
        email: 'compliance@cannabis.ca.gov',
        bio: 'Oversees compliance and enforcement activities across all licensed cannabis businesses.',
      },
      {
        name: 'Eugene Hillsman',
        title: 'Deputy Director, Equity & Inclusion',
        bio: 'Leads equity initiatives and programs to support diverse participation in the cannabis industry.',
      },
    ],
    regulatoryFocusAreas: [
      {
        name: 'Licensing & Permits',
        description: 'Processing new license applications, renewals, and modifications for all cannabis business types.',
        icon: 'FileCheck',
        priority: 'high',
        recentActivity: 'Streamlined provisional license conversion process launched Q4 2024',
      },
      {
        name: 'Track & Trace Compliance',
        description: 'Monitoring METRC compliance and ensuring accurate tracking of cannabis from seed to sale.',
        icon: 'ScanLine',
        priority: 'high',
        recentActivity: 'Enhanced METRC integration requirements effective January 2025',
      },
      {
        name: 'Testing Standards',
        description: 'Enforcing laboratory testing requirements for potency, contaminants, and product safety.',
        icon: 'FlaskConical',
        priority: 'high',
        recentActivity: 'Updated pesticide testing thresholds adopted December 2024',
      },
      {
        name: 'Equity Programs',
        description: 'Supporting social equity applicants and promoting diversity in the cannabis industry.',
        icon: 'Users',
        priority: 'medium',
        recentActivity: 'Fee waiver program expanded for equity applicants',
      },
      {
        name: 'Advertising & Marketing',
        description: 'Regulating cannabis advertising to prevent youth exposure and ensure truthful marketing.',
        icon: 'Megaphone',
        priority: 'medium',
        recentActivity: 'New digital advertising guidelines issued November 2024',
      },
      {
        name: 'Environmental Compliance',
        description: 'Ensuring cannabis cultivation meets environmental standards and sustainability requirements.',
        icon: 'Leaf',
        priority: 'medium',
        recentActivity: 'Water use reporting requirements updated',
      },
    ],
    enforcementActions: [
      {
        id: 'ca-enf-001',
        date: '2024-12-15',
        title: 'License Revocation - Unlicensed Distribution',
        description: 'Distributor license revoked for engaging in unlicensed cannabis distribution activities and METRC violations.',
        type: 'license_revocation',
        licenseeType: 'Distributor',
        resolution: 'License permanently revoked; $150,000 fine assessed',
        amount: 150000,
      },
      {
        id: 'ca-enf-002',
        date: '2024-12-10',
        title: 'Fine - Packaging Violations',
        description: 'Manufacturer fined for non-compliant packaging lacking required warning labels and child-resistant features.',
        type: 'fine',
        amount: 25000,
        licenseeType: 'Manufacturer',
        resolution: 'Fine paid; corrective action plan approved',
      },
      {
        id: 'ca-enf-003',
        date: '2024-11-28',
        title: 'License Suspension - Track & Trace',
        description: 'Cultivation license suspended for 30 days due to repeated METRC reporting failures.',
        type: 'license_suspension',
        licenseeType: 'Cultivator',
        resolution: '30-day suspension completed; enhanced monitoring in place',
      },
      {
        id: 'ca-enf-004',
        date: '2024-11-15',
        title: 'Warning - Advertising Violation',
        description: 'Retail dispensary issued warning for social media advertising visible to minors.',
        type: 'warning',
        licenseeType: 'Retailer',
        resolution: 'Content removed; staff training completed',
      },
      {
        id: 'ca-enf-005',
        date: '2024-10-30',
        title: 'Cease & Desist - Unlicensed Operation',
        description: 'Cease and desist order issued to unlicensed delivery service operating in Los Angeles County.',
        type: 'cease_desist',
        resolution: 'Operation ceased; criminal referral pending',
      },
    ],
    regulatoryTimeline: [
      {
        id: 'ca-tl-001',
        date: '2024-12-01',
        title: 'Emergency Regulations - Hemp-Derived Cannabinoids',
        description: 'Emergency regulations adopted to address intoxicating hemp-derived cannabinoid products in the retail market.',
        type: 'emergency_rule',
        impact: 'high',
      },
      {
        id: 'ca-tl-002',
        date: '2024-10-15',
        title: 'Cultivation License Fee Reduction',
        description: 'Permanent regulations reducing cultivation license fees by 50% for small and medium operators.',
        type: 'rule_adopted',
        impact: 'medium',
      },
      {
        id: 'ca-tl-003',
        date: '2024-08-01',
        title: 'Cannabis Events Regulations',
        description: 'New regulations allowing temporary cannabis events with on-site consumption.',
        type: 'rule_adopted',
        impact: 'medium',
      },
      {
        id: 'ca-tl-004',
        date: '2024-06-15',
        title: 'Provisional License Deadline Extension',
        description: 'Extended deadline for provisional license holders to complete CEQA requirements.',
        type: 'amendment',
        impact: 'high',
      },
      {
        id: 'ca-tl-005',
        date: '2024-03-01',
        title: 'Interstate Commerce Framework Proposed',
        description: 'Proposed regulations for interstate cannabis commerce pending federal authorization.',
        type: 'rule_proposed',
        impact: 'high',
      },
      {
        id: 'ca-tl-006',
        date: '2023-07-01',
        title: 'Unified Cannabis Regulations',
        description: 'Consolidated regulations from former BCC, CDFA, and CDPH into single regulatory framework.',
        type: 'rule_adopted',
        impact: 'high',
      },
      {
        id: 'ca-tl-007',
        date: '2021-07-12',
        title: 'DCC Established',
        description: 'Department of Cannabis Control created, consolidating three former licensing agencies.',
        type: 'program_launched',
        impact: 'high',
      },
      {
        id: 'ca-tl-008',
        date: '2018-01-01',
        title: 'Adult-Use Cannabis Sales Begin',
        description: 'California begins legal recreational cannabis sales under Proposition 64.',
        type: 'program_launched',
        impact: 'high',
      },
      {
        id: 'ca-tl-009',
        date: '2016-11-08',
        title: 'Proposition 64 Passed',
        description: 'California voters approve Adult Use of Marijuana Act (AUMA), legalizing recreational cannabis.',
        type: 'law_enacted',
        impact: 'high',
      },
    ],
    statistics: {
      totalLicenses: 12500,
      activeLicenses: 8750,
      pendingApplications: 1200,
      enforcementActionsYTD: 245,
      totalFinesYTD: 4500000,
      inspectionsYTD: 3200,
    },
    licenseTypes: [
      'Cultivation - Outdoor',
      'Cultivation - Indoor',
      'Cultivation - Mixed-Light',
      'Nursery',
      'Processor',
      'Manufacturer - Type 6',
      'Manufacturer - Type 7',
      'Manufacturer - Type N',
      'Distributor',
      'Distributor - Transport Only',
      'Retailer',
      'Retailer - Non-Storefront',
      'Microbusiness',
      'Testing Laboratory',
      'Cannabis Event Organizer',
    ],
    quickLinks: [
      { label: 'Apply for a License', url: 'https://cannabis.ca.gov/applicants/how-to-apply/' },
      { label: 'License Search', url: 'https://search.cannabis.ca.gov/' },
      { label: 'METRC Support', url: 'https://cannabis.ca.gov/licensees/track-and-trace/' },
      { label: 'Regulations', url: 'https://cannabis.ca.gov/cannabis-laws/laws-and-regulations/' },
      { label: 'File a Complaint', url: 'https://cannabis.ca.gov/resources/file-a-complaint/' },
      { label: 'Public Meetings', url: 'https://cannabis.ca.gov/about-us/public-meetings/' },
    ],
  },
  {
    stateCode: 'CO',
    stateName: 'Colorado',
    slug: 'colorado',
    agency: {
      name: 'Marijuana Enforcement Division',
      acronym: 'MED',
      description: 'The Marijuana Enforcement Division (MED) licenses and regulates the medical and retail marijuana industry in Colorado.',
      mission: 'To maintain a balanced regulatory framework that promotes public safety, prevents diversion, and supports a compliant cannabis industry.',
      established: 'May 2013',
      parentDepartment: 'Department of Revenue',
    },
    contact: {
      address: '1881 Pierce Street, Suite 108',
      city: 'Lakewood',
      state: 'CO',
      zip: '80214',
      phone: '303-205-2300',
      email: 'dor_enforcement@state.co.us',
      generalInquiriesEmail: 'dor_enforcement@state.co.us',
      licensingEmail: 'dor_medlicensing@state.co.us',
      complianceEmail: 'dor_medcompliance@state.co.us',
      website: 'https://sbg.colorado.gov/med',
      licensingPortal: 'https://sbg.colorado.gov/med/licensees',
      publicRecordsUrl: 'https://sbg.colorado.gov/med/resources',
      complaintsUrl: 'https://sbg.colorado.gov/med/file-complaint',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM MT',
      timezone: 'America/Denver',
    },
    socialMedia: {
      twitter: 'https://twitter.com/ColoradoMED',
    },
    keyPersonnel: [
      {
        name: 'Dominique Mendiola',
        title: 'Senior Director',
        bio: 'Leads the Marijuana Enforcement Division and oversees all regulatory and enforcement activities.',
      },
      {
        name: 'Jim Burack',
        title: 'Deputy Senior Director',
        bio: 'Supports division leadership and manages strategic initiatives.',
      },
      {
        name: 'Sarah Johnson',
        title: 'Licensing Manager',
        email: 'dor_medlicensing@state.co.us',
        bio: 'Oversees the licensing process for all marijuana business applications.',
      },
    ],
    regulatoryFocusAreas: [
      {
        name: 'Licensing & Background Checks',
        description: 'Processing license applications and conducting thorough background investigations.',
        icon: 'Shield',
        priority: 'high',
        recentActivity: 'Streamlined background check process implemented',
      },
      {
        name: 'Seed-to-Sale Tracking',
        description: 'Ensuring compliance with METRC tracking requirements throughout the supply chain.',
        icon: 'ScanLine',
        priority: 'high',
        recentActivity: 'METRC 2.0 integration completed',
      },
      {
        name: 'Product Safety',
        description: 'Enforcing testing requirements and product safety standards.',
        icon: 'FlaskConical',
        priority: 'high',
        recentActivity: 'New contaminant testing requirements effective 2025',
      },
      {
        name: 'Youth Prevention',
        description: 'Preventing underage access and ensuring responsible marketing practices.',
        icon: 'ShieldAlert',
        priority: 'high',
        recentActivity: 'Enhanced ID verification requirements',
      },
      {
        name: 'Social Equity',
        description: 'Supporting diversity and inclusion in the cannabis industry.',
        icon: 'Users',
        priority: 'medium',
        recentActivity: 'Accelerator program launched for equity applicants',
      },
    ],
    enforcementActions: [
      {
        id: 'co-enf-001',
        date: '2024-12-08',
        title: 'Fine - Inventory Discrepancy',
        description: 'Cultivation facility fined for significant inventory discrepancies in METRC system.',
        type: 'fine',
        amount: 50000,
        licenseeType: 'Cultivator',
        resolution: 'Fine paid; inventory audit completed',
      },
      {
        id: 'co-enf-002',
        date: '2024-11-20',
        title: 'License Suspension - Security Violation',
        description: 'Retail store license suspended for failure to maintain required security measures.',
        type: 'license_suspension',
        licenseeType: 'Retailer',
        resolution: '14-day suspension; security upgrades completed',
      },
      {
        id: 'co-enf-003',
        date: '2024-10-15',
        title: 'Warning - Labeling Deficiency',
        description: 'Manufacturer issued warning for products with incomplete labeling information.',
        type: 'warning',
        licenseeType: 'Manufacturer',
        resolution: 'Labels corrected; products re-released',
      },
    ],
    regulatoryTimeline: [
      {
        id: 'co-tl-001',
        date: '2024-11-01',
        title: 'Delivery Services Expansion',
        description: 'Regulations expanded to allow third-party delivery services statewide.',
        type: 'rule_adopted',
        impact: 'medium',
      },
      {
        id: 'co-tl-002',
        date: '2024-07-01',
        title: 'Social Consumption Licenses',
        description: 'New license category for cannabis consumption lounges and hospitality venues.',
        type: 'rule_adopted',
        impact: 'medium',
      },
      {
        id: 'co-tl-003',
        date: '2023-01-01',
        title: 'Potency Limits Implemented',
        description: 'THC potency limits for concentrates and edibles took effect.',
        type: 'rule_adopted',
        impact: 'high',
      },
      {
        id: 'co-tl-004',
        date: '2019-05-29',
        title: 'HB19-1230 Signed',
        description: 'Hospitality and social consumption legislation signed into law.',
        type: 'law_enacted',
        impact: 'medium',
      },
      {
        id: 'co-tl-005',
        date: '2014-01-01',
        title: 'Recreational Sales Begin',
        description: 'Colorado becomes first state to allow recreational cannabis sales.',
        type: 'program_launched',
        impact: 'high',
      },
      {
        id: 'co-tl-006',
        date: '2012-11-06',
        title: 'Amendment 64 Passed',
        description: 'Colorado voters approve recreational cannabis legalization.',
        type: 'law_enacted',
        impact: 'high',
      },
    ],
    statistics: {
      totalLicenses: 3200,
      activeLicenses: 2800,
      pendingApplications: 150,
      enforcementActionsYTD: 89,
      totalFinesYTD: 1200000,
      inspectionsYTD: 1500,
    },
    licenseTypes: [
      'Retail Marijuana Store',
      'Medical Marijuana Center',
      'Retail Marijuana Cultivation',
      'Medical Marijuana Cultivation',
      'Retail Marijuana Products Manufacturer',
      'Medical Marijuana Products Manufacturer',
      'Retail Marijuana Testing Facility',
      'Medical Marijuana Testing Facility',
      'Marijuana Transporter',
      'Marijuana Hospitality Business',
    ],
    quickLinks: [
      { label: 'Apply for License', url: 'https://sbg.colorado.gov/med/licensees' },
      { label: 'License Lookup', url: 'https://sbg.colorado.gov/med/license-verification' },
      { label: 'Rules & Regulations', url: 'https://sbg.colorado.gov/med/rules' },
      { label: 'File a Complaint', url: 'https://sbg.colorado.gov/med/file-complaint' },
      { label: 'Industry Resources', url: 'https://sbg.colorado.gov/med/resources' },
    ],
  },
  {
    stateCode: 'NY',
    stateName: 'New York',
    slug: 'new-york',
    agency: {
      name: 'Office of Cannabis Management',
      acronym: 'OCM',
      description: 'The Office of Cannabis Management (OCM) oversees the implementation of the Marijuana Regulation and Taxation Act (MRTA) and regulates the adult-use, medical, and hemp cannabis programs in New York.',
      mission: 'To create a well-regulated cannabis industry that prioritizes public health, safety, and social equity.',
      established: 'March 2021',
      parentDepartment: 'Cannabis Control Board',
    },
    contact: {
      address: 'One Commerce Plaza',
      city: 'Albany',
      state: 'NY',
      zip: '12257',
      phone: '518-474-2121',
      email: 'info@cannabis.ny.gov',
      generalInquiriesEmail: 'info@cannabis.ny.gov',
      licensingEmail: 'licensing@cannabis.ny.gov',
      complianceEmail: 'compliance@cannabis.ny.gov',
      website: 'https://cannabis.ny.gov',
      licensingPortal: 'https://cannabis.ny.gov/licensing',
      publicRecordsUrl: 'https://cannabis.ny.gov/foil-requests',
      complaintsUrl: 'https://cannabis.ny.gov/file-complaint',
      officeHours: 'Monday - Friday, 9:00 AM - 5:00 PM ET',
      timezone: 'America/New_York',
    },
    socialMedia: {
      twitter: 'https://twitter.com/NYSCannabis',
      facebook: 'https://www.facebook.com/NYSCannabis',
      instagram: 'https://www.instagram.com/nyscannabis/',
    },
    keyPersonnel: [
      {
        name: 'Chris Alexander',
        title: 'Executive Director',
        bio: 'Chris Alexander serves as the first Executive Director of the Office of Cannabis Management, leading the implementation of New York\'s cannabis program.',
      },
      {
        name: 'Tremaine Wright',
        title: 'Chair, Cannabis Control Board',
        bio: 'Tremaine Wright chairs the Cannabis Control Board, which oversees the Office of Cannabis Management.',
      },
      {
        name: 'Damian Fagon',
        title: 'Chief Equity Officer',
        bio: 'Leads social equity initiatives and ensures diverse participation in the cannabis industry.',
      },
    ],
    regulatoryFocusAreas: [
      {
        name: 'Social Equity Licensing',
        description: 'Prioritizing licenses for communities disproportionately impacted by cannabis prohibition.',
        icon: 'Scale',
        priority: 'high',
        recentActivity: 'CAURD license applications reopened',
      },
      {
        name: 'Illicit Market Enforcement',
        description: 'Combating unlicensed cannabis operations and protecting legal businesses.',
        icon: 'ShieldAlert',
        priority: 'high',
        recentActivity: 'Enhanced enforcement operations in NYC',
      },
      {
        name: 'Licensing Expansion',
        description: 'Processing applications and expanding the licensed retail network.',
        icon: 'FileCheck',
        priority: 'high',
        recentActivity: 'Adult-use retail licenses accelerated',
      },
      {
        name: 'Product Safety',
        description: 'Ensuring all cannabis products meet safety and testing standards.',
        icon: 'FlaskConical',
        priority: 'high',
        recentActivity: 'Testing lab certifications expanded',
      },
      {
        name: 'Community Reinvestment',
        description: 'Directing cannabis tax revenue to impacted communities.',
        icon: 'Building',
        priority: 'medium',
        recentActivity: 'Community grants program launched',
      },
    ],
    enforcementActions: [
      {
        id: 'ny-enf-001',
        date: '2024-12-12',
        title: 'Cease & Desist - Unlicensed Smoke Shop',
        description: 'Cease and desist order issued to unlicensed smoke shop selling cannabis products in Manhattan.',
        type: 'cease_desist',
        resolution: 'Products seized; criminal charges pending',
      },
      {
        id: 'ny-enf-002',
        date: '2024-11-30',
        title: 'Fine - Advertising Violation',
        description: 'Licensed retailer fined for advertising visible from public sidewalk.',
        type: 'fine',
        amount: 10000,
        licenseeType: 'Retailer',
        resolution: 'Signage removed; fine paid',
      },
      {
        id: 'ny-enf-003',
        date: '2024-11-15',
        title: 'Warning - Record Keeping',
        description: 'Dispensary issued warning for incomplete sales records.',
        type: 'warning',
        licenseeType: 'Retailer',
        resolution: 'Records corrected; staff retrained',
      },
    ],
    regulatoryTimeline: [
      {
        id: 'ny-tl-001',
        date: '2024-10-01',
        title: 'Delivery License Applications Open',
        description: 'Applications for cannabis delivery licenses began accepting submissions.',
        type: 'program_launched',
        impact: 'medium',
      },
      {
        id: 'ny-tl-002',
        date: '2024-06-01',
        title: 'Expanded Retail Licensing',
        description: 'General adult-use retail license applications opened beyond CAURD priority.',
        type: 'rule_adopted',
        impact: 'high',
      },
      {
        id: 'ny-tl-003',
        date: '2023-12-28',
        title: 'First Legal Dispensaries Open',
        description: 'First CAURD-licensed dispensaries begin sales in New York City.',
        type: 'program_launched',
        impact: 'high',
      },
      {
        id: 'ny-tl-004',
        date: '2022-11-21',
        title: 'Adult-Use Regulations Adopted',
        description: 'Cannabis Control Board adopts comprehensive adult-use regulations.',
        type: 'rule_adopted',
        impact: 'high',
      },
      {
        id: 'ny-tl-005',
        date: '2021-03-31',
        title: 'MRTA Signed Into Law',
        description: 'Governor Cuomo signs Marijuana Regulation and Taxation Act, legalizing adult-use cannabis.',
        type: 'law_enacted',
        impact: 'high',
      },
    ],
    statistics: {
      totalLicenses: 450,
      activeLicenses: 320,
      pendingApplications: 2500,
      enforcementActionsYTD: 156,
      totalFinesYTD: 850000,
      inspectionsYTD: 420,
    },
    licenseTypes: [
      'Adult-Use Retail Dispensary',
      'Adult-Use Cultivator',
      'Adult-Use Processor',
      'Adult-Use Distributor',
      'Adult-Use Microbusiness',
      'Adult-Use Delivery',
      'Medical Dispensary',
      'Registered Organization',
      'Cannabis Laboratory',
    ],
    quickLinks: [
      { label: 'Apply for License', url: 'https://cannabis.ny.gov/licensing' },
      { label: 'Find Legal Dispensaries', url: 'https://cannabis.ny.gov/dispensary-location-verification' },
      { label: 'Report Illegal Sales', url: 'https://cannabis.ny.gov/report-illegal-activity' },
      { label: 'Regulations', url: 'https://cannabis.ny.gov/regulations' },
      { label: 'Social Equity', url: 'https://cannabis.ny.gov/social-and-economic-equity' },
    ],
  },
  {
    stateCode: 'MI',
    stateName: 'Michigan',
    slug: 'michigan',
    agency: {
      name: 'Cannabis Regulatory Agency',
      acronym: 'CRA',
      description: 'The Cannabis Regulatory Agency (CRA) is responsible for licensing and regulating the medical and adult-use cannabis industries in Michigan.',
      mission: 'To establish Michigan as a national model for a safe, responsible, and successful cannabis industry.',
      established: 'October 2019',
      parentDepartment: 'Department of Licensing and Regulatory Affairs',
    },
    contact: {
      address: '2407 N Grand River Ave',
      city: 'Lansing',
      state: 'MI',
      zip: '48906',
      phone: '517-284-8599',
      email: 'CRA-Info@michigan.gov',
      generalInquiriesEmail: 'CRA-Info@michigan.gov',
      licensingEmail: 'CRA-Licensing@michigan.gov',
      complianceEmail: 'CRA-Compliance@michigan.gov',
      website: 'https://www.michigan.gov/cra',
      licensingPortal: 'https://aca-prod.accela.com/MILARA/Default.aspx',
      publicRecordsUrl: 'https://www.michigan.gov/cra/about/foia',
      complaintsUrl: 'https://www.michigan.gov/cra/about/contact',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM ET',
      timezone: 'America/Detroit',
    },
    socialMedia: {
      twitter: 'https://twitter.com/MichiganCRA',
      facebook: 'https://www.facebook.com/MichiganCRA',
    },
    keyPersonnel: [
      {
        name: 'Brian Hanna',
        title: 'Executive Director',
        bio: 'Brian Hanna leads the Cannabis Regulatory Agency and oversees all licensing and regulatory activities.',
      },
      {
        name: 'David Harns',
        title: 'Communications Director',
        email: 'HarnsD@michigan.gov',
        bio: 'Manages public communications and media relations for the agency.',
      },
    ],
    regulatoryFocusAreas: [
      {
        name: 'Licensing',
        description: 'Processing applications for medical and adult-use cannabis licenses.',
        icon: 'FileCheck',
        priority: 'high',
        recentActivity: 'Social equity license applications prioritized',
      },
      {
        name: 'Compliance & Enforcement',
        description: 'Ensuring licensees comply with state regulations and taking enforcement action when necessary.',
        icon: 'Shield',
        priority: 'high',
        recentActivity: 'Enhanced inspection protocols implemented',
      },
      {
        name: 'METRC Tracking',
        description: 'Overseeing seed-to-sale tracking compliance.',
        icon: 'ScanLine',
        priority: 'high',
        recentActivity: 'METRC training sessions expanded',
      },
      {
        name: 'Social Equity',
        description: 'Supporting diverse participation in the cannabis industry.',
        icon: 'Users',
        priority: 'medium',
        recentActivity: 'Social equity program expanded',
      },
    ],
    enforcementActions: [
      {
        id: 'mi-enf-001',
        date: '2024-12-05',
        title: 'Fine - METRC Violation',
        description: 'Processor fined for repeated METRC reporting failures.',
        type: 'fine',
        amount: 35000,
        licenseeType: 'Processor',
        resolution: 'Fine paid; compliance plan approved',
      },
      {
        id: 'mi-enf-002',
        date: '2024-11-18',
        title: 'License Suspension - Failed Testing',
        description: 'Cultivator license suspended after products failed contaminant testing.',
        type: 'license_suspension',
        licenseeType: 'Cultivator',
        resolution: 'Products destroyed; remediation completed',
      },
    ],
    regulatoryTimeline: [
      {
        id: 'mi-tl-001',
        date: '2024-09-01',
        title: 'Social Equity Program Enhanced',
        description: 'Expanded social equity program with additional fee reductions and support services.',
        type: 'rule_adopted',
        impact: 'medium',
      },
      {
        id: 'mi-tl-002',
        date: '2023-10-01',
        title: 'CRA Established',
        description: 'Cannabis Regulatory Agency created as standalone agency.',
        type: 'program_launched',
        impact: 'high',
      },
      {
        id: 'mi-tl-003',
        date: '2019-12-01',
        title: 'Adult-Use Sales Begin',
        description: 'First adult-use cannabis sales in Michigan.',
        type: 'program_launched',
        impact: 'high',
      },
      {
        id: 'mi-tl-004',
        date: '2018-11-06',
        title: 'Proposal 1 Passed',
        description: 'Michigan voters approve adult-use cannabis legalization.',
        type: 'law_enacted',
        impact: 'high',
      },
    ],
    statistics: {
      totalLicenses: 2100,
      activeLicenses: 1850,
      pendingApplications: 320,
      enforcementActionsYTD: 67,
      totalFinesYTD: 890000,
      inspectionsYTD: 980,
    },
    licenseTypes: [
      'Adult-Use Retailer',
      'Medical Provisioning Center',
      'Adult-Use Grower - Class A',
      'Adult-Use Grower - Class B',
      'Adult-Use Grower - Class C',
      'Medical Grower',
      'Adult-Use Processor',
      'Medical Processor',
      'Secure Transporter',
      'Safety Compliance Facility',
      'Microbusiness',
    ],
    quickLinks: [
      { label: 'Apply for License', url: 'https://www.michigan.gov/cra/licensing' },
      { label: 'License Search', url: 'https://www.michigan.gov/cra/licensing/license-search' },
      { label: 'Rules & Regulations', url: 'https://www.michigan.gov/cra/about/rules' },
      { label: 'Contact Us', url: 'https://www.michigan.gov/cra/about/contact' },
    ],
  },
  {
    stateCode: 'IL',
    stateName: 'Illinois',
    slug: 'illinois',
    agency: {
      name: 'Department of Agriculture - Cannabis Programs',
      acronym: 'IDOA',
      description: 'The Illinois Department of Agriculture oversees cannabis cultivation licensing while the Department of Financial and Professional Regulation handles dispensary licensing.',
      mission: 'To regulate cannabis cultivation and ensure product safety while supporting a diverse and equitable industry.',
      established: 'January 2020',
      parentDepartment: 'Illinois Department of Agriculture',
    },
    contact: {
      address: '801 E Sangamon Ave',
      city: 'Springfield',
      state: 'IL',
      zip: '62702',
      phone: '217-782-2172',
      email: 'AGR.AdultUseCannabis@illinois.gov',
      website: 'https://www2.illinois.gov/sites/agr/Plants/Pages/Adult-Use-Cannabis.aspx',
      officeHours: 'Monday - Friday, 8:30 AM - 5:00 PM CT',
      timezone: 'America/Chicago',
    },
    keyPersonnel: [
      {
        name: 'Jerry Costello II',
        title: 'Director',
        bio: 'Director of the Illinois Department of Agriculture.',
      },
    ],
    regulatoryFocusAreas: [
      {
        name: 'Cultivation Licensing',
        description: 'Licensing and regulating cannabis cultivation facilities.',
        icon: 'Leaf',
        priority: 'high',
      },
      {
        name: 'Social Equity',
        description: 'Implementing the most ambitious social equity program in the nation.',
        icon: 'Scale',
        priority: 'high',
        recentActivity: 'Social equity lottery completed',
      },
      {
        name: 'Craft Grower Program',
        description: 'Supporting small-scale cultivation operations.',
        icon: 'Sprout',
        priority: 'medium',
      },
    ],
    enforcementActions: [
      {
        id: 'il-enf-001',
        date: '2024-11-25',
        title: 'Fine - Cultivation Violation',
        description: 'Cultivation facility fined for exceeding licensed canopy space.',
        type: 'fine',
        amount: 75000,
        licenseeType: 'Cultivator',
        resolution: 'Excess plants destroyed; fine paid',
      },
    ],
    regulatoryTimeline: [
      {
        id: 'il-tl-001',
        date: '2024-08-01',
        title: 'Social Equity Licenses Issued',
        description: 'First wave of social equity dispensary licenses issued.',
        type: 'program_launched',
        impact: 'high',
      },
      {
        id: 'il-tl-002',
        date: '2020-01-01',
        title: 'Adult-Use Sales Begin',
        description: 'Illinois begins legal recreational cannabis sales.',
        type: 'program_launched',
        impact: 'high',
      },
      {
        id: 'il-tl-003',
        date: '2019-06-25',
        title: 'Cannabis Regulation and Tax Act',
        description: 'Governor Pritzker signs comprehensive cannabis legalization law.',
        type: 'law_enacted',
        impact: 'high',
      },
    ],
    statistics: {
      totalLicenses: 890,
      activeLicenses: 780,
      pendingApplications: 450,
      enforcementActionsYTD: 34,
      totalFinesYTD: 560000,
      inspectionsYTD: 620,
    },
    licenseTypes: [
      'Adult-Use Dispensary',
      'Medical Dispensary',
      'Cultivation Center',
      'Craft Grower',
      'Infuser',
      'Transporter',
      'Testing Laboratory',
    ],
    quickLinks: [
      { label: 'Cultivation Licensing', url: 'https://www2.illinois.gov/sites/agr/Plants/Pages/Adult-Use-Cannabis.aspx' },
      { label: 'IDFPR Dispensary Info', url: 'https://idfpr.illinois.gov/profs/cannabis.asp' },
      { label: 'Social Equity', url: 'https://www2.illinois.gov/dceo/Pages/default.aspx' },
    ],
  },
  {
    stateCode: 'MA',
    stateName: 'Massachusetts',
    slug: 'massachusetts',
    agency: {
      name: 'Cannabis Control Commission',
      acronym: 'CCC',
      description: 'The Cannabis Control Commission (CCC) is an independent state agency responsible for implementing and administering the laws enabling access to medical and adult-use marijuana in Massachusetts.',
      mission: 'To honor the will of the voters of Massachusetts by safely, equitably, and effectively implementing and administering the regulation of the medical and adult-use cannabis industries.',
      established: 'September 2017',
    },
    contact: {
      address: 'Union Station, 2 Washington Square',
      city: 'Worcester',
      state: 'MA',
      zip: '01604',
      phone: '617-701-8400',
      email: 'CannabisCommission@mass.gov',
      generalInquiriesEmail: 'CannabisCommission@mass.gov',
      licensingEmail: 'Commission@mass.gov',
      website: 'https://masscannabiscontrol.com',
      licensingPortal: 'https://masscannabiscontrol.com/licensing/',
      officeHours: 'Monday - Friday, 9:00 AM - 5:00 PM ET',
      timezone: 'America/New_York',
    },
    socialMedia: {
      twitter: 'https://twitter.com/MA_Cannabis',
    },
    keyPersonnel: [
      {
        name: 'Shannon O\'Brien',
        title: 'Chair',
        bio: 'Shannon O\'Brien serves as Chair of the Cannabis Control Commission.',
      },
      {
        name: 'Ava Callender Concepcion',
        title: 'Commissioner',
        bio: 'Commissioner focused on social equity and community reinvestment.',
      },
      {
        name: 'Nurys Camargo',
        title: 'Commissioner',
        bio: 'Commissioner with expertise in public health and safety.',
      },
    ],
    regulatoryFocusAreas: [
      {
        name: 'Licensing',
        description: 'Processing applications for medical and adult-use cannabis establishments.',
        icon: 'FileCheck',
        priority: 'high',
      },
      {
        name: 'Social Equity',
        description: 'Implementing programs to support economic empowerment applicants.',
        icon: 'Scale',
        priority: 'high',
        recentActivity: 'Social Equity Trust Fund grants distributed',
      },
      {
        name: 'Host Community Agreements',
        description: 'Overseeing agreements between licensees and municipalities.',
        icon: 'Handshake',
        priority: 'medium',
        recentActivity: 'HCA reform regulations adopted',
      },
      {
        name: 'Delivery Licensing',
        description: 'Expanding delivery services with equity priority.',
        icon: 'Truck',
        priority: 'medium',
      },
    ],
    enforcementActions: [
      {
        id: 'ma-enf-001',
        date: '2024-12-01',
        title: 'Fine - Security Violation',
        description: 'Dispensary fined for inadequate security camera coverage.',
        type: 'fine',
        amount: 15000,
        licenseeType: 'Retailer',
        resolution: 'Security system upgraded; fine paid',
      },
    ],
    regulatoryTimeline: [
      {
        id: 'ma-tl-001',
        date: '2024-07-01',
        title: 'Delivery Expansion',
        description: 'Delivery licenses expanded beyond social equity priority.',
        type: 'rule_adopted',
        impact: 'medium',
      },
      {
        id: 'ma-tl-002',
        date: '2023-01-01',
        title: 'HCA Reform',
        description: 'Host Community Agreement reforms take effect.',
        type: 'rule_adopted',
        impact: 'high',
      },
      {
        id: 'ma-tl-003',
        date: '2018-11-20',
        title: 'First Adult-Use Sales',
        description: 'Massachusetts begins recreational cannabis sales.',
        type: 'program_launched',
        impact: 'high',
      },
      {
        id: 'ma-tl-004',
        date: '2016-11-08',
        title: 'Question 4 Passed',
        description: 'Massachusetts voters approve adult-use cannabis legalization.',
        type: 'law_enacted',
        impact: 'high',
      },
    ],
    statistics: {
      totalLicenses: 1450,
      activeLicenses: 1200,
      pendingApplications: 380,
      enforcementActionsYTD: 45,
      totalFinesYTD: 420000,
      inspectionsYTD: 850,
    },
    licenseTypes: [
      'Marijuana Retailer',
      'Medical Marijuana Treatment Center',
      'Marijuana Cultivator - Indoor',
      'Marijuana Cultivator - Outdoor',
      'Marijuana Product Manufacturer',
      'Marijuana Transporter',
      'Independent Testing Laboratory',
      'Delivery Operator',
      'Microbusiness',
      'Social Consumption Establishment',
    ],
    quickLinks: [
      { label: 'Apply for License', url: 'https://masscannabiscontrol.com/licensing/' },
      { label: 'License Search', url: 'https://masscannabiscontrol.com/licensees/' },
      { label: 'Regulations', url: 'https://masscannabiscontrol.com/regulations/' },
      { label: 'Social Equity', url: 'https://masscannabiscontrol.com/equityprograms/' },
    ],
  },
];

// Helper function to get agency profile by state code or slug
export const getAgencyProfile = (identifier: string): StateAgencyProfile | undefined => {
  return stateAgencyProfiles.find(
    profile => profile.stateCode.toLowerCase() === identifier.toLowerCase() ||
               profile.slug.toLowerCase() === identifier.toLowerCase()
  );
};

// Helper function to get all agency profiles
export const getAllAgencyProfiles = (): StateAgencyProfile[] => {
  return stateAgencyProfiles;
};
