export interface TimelineEntry {
  id: string;
  date: string;
  title: string;
  type: 'rule' | 'bill' | 'enforcement' | 'guidance';
  status: 'effective' | 'proposed' | 'adopted';
  impact: 'high' | 'medium' | 'low';
  summary: string;
  products: string[];
  citation: string;
  url: string;
}

export interface ComplianceDeadline {
  id: string;
  date: string;
  title: string;
  description: string;
  products: string[];
  priority: 'critical' | 'important' | 'routine';
}

export interface Authority {
  name: string;
  acronym: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

export interface LicenseRequirement {
  type: string;
  authority: string;
  fee: string;
  renewal: string;
  requirements: string[];
}

export interface TestingRequirement {
  product: string;
  analytes: string[];
  actionLevels: string;
  labAccreditation: string;
}

export interface PackagingRequirement {
  product: string;
  childResistant: boolean;
  warnings: string[];
  labeling: string[];
  restrictions: string[];
}

export interface StateDetail {
  id: string;
  name: string;
  slug: string;
  summary: string;
  lastUpdated: string;
  timeline: TimelineEntry[];
  deadlines: ComplianceDeadline[];
  authorities: Authority[];
  licensing: LicenseRequirement[];
  testing: TestingRequirement[];
  packaging: PackagingRequirement[];
}
