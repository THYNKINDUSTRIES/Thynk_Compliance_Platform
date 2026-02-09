export interface StateInfo {
  id: string;
  name: string;
  slug: string;
  status: 'permissive' | 'moderate' | 'restrictive';
  recentUpdates: number;
  activeDeadlines: number;
  legalStatus: {
    hemp: string;
    thca: string;
    delta8: string;
    kratom: string;
    psychedelics: string;
    nicotine: string;
  };
}

export const US_STATES: StateInfo[] = [
  { id: 'AL', name: 'Alabama', slug: 'alabama', status: 'restrictive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'AK', name: 'Alaska', slug: 'alaska', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'AZ', name: 'Arizona', slug: 'arizona', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'AR', name: 'Arkansas', slug: 'arkansas', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Banned', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'CA', name: 'California', slug: 'california', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Restricted', kratom: 'Legal', psychedelics: 'Decriminalized', nicotine: 'Regulated' } },
  { id: 'CO', name: 'Colorado', slug: 'colorado', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Decriminalized', nicotine: 'Regulated' } },
  { id: 'CT', name: 'Connecticut', slug: 'connecticut', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'DE', name: 'Delaware', slug: 'delaware', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Adult-Use (2025)', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'FL', name: 'Florida', slug: 'florida', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'GA', name: 'Georgia', slug: 'georgia', status: 'restrictive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only (Low-THC)', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'HI', name: 'Hawaii', slug: 'hawaii', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'ID', name: 'Idaho', slug: 'idaho', status: 'restrictive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Restricted', thca: 'Illegal', delta8: 'Illegal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'IL', name: 'Illinois', slug: 'illinois', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'IN', name: 'Indiana', slug: 'indiana', status: 'restrictive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Illegal', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'IA', name: 'Iowa', slug: 'iowa', status: 'restrictive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'KS', name: 'Kansas', slug: 'kansas', status: 'restrictive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Illegal', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'KY', name: 'Kentucky', slug: 'kentucky', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical (2025)', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'LA', name: 'Louisiana', slug: 'louisiana', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Banned', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'ME', name: 'Maine', slug: 'maine', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'MD', name: 'Maryland', slug: 'maryland', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'MA', name: 'Massachusetts', slug: 'massachusetts', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Decriminalized', nicotine: 'Regulated' } },
  { id: 'MI', name: 'Michigan', slug: 'michigan', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Decriminalized', nicotine: 'Regulated' } },
  { id: 'MN', name: 'Minnesota', slug: 'minnesota', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'MS', name: 'Mississippi', slug: 'mississippi', status: 'restrictive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'MO', name: 'Missouri', slug: 'missouri', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'MT', name: 'Montana', slug: 'montana', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'NE', name: 'Nebraska', slug: 'nebraska', status: 'restrictive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Illegal', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'NV', name: 'Nevada', slug: 'nevada', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'NH', name: 'New Hampshire', slug: 'new-hampshire', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Decriminalized', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'NJ', name: 'New Jersey', slug: 'new-jersey', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'NM', name: 'New Mexico', slug: 'new-mexico', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'NY', name: 'New York', slug: 'new-york', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Banned', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'NC', name: 'North Carolina', slug: 'north-carolina', status: 'restrictive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal (USDA)', thca: 'Unregulated', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'ND', name: 'North Dakota', slug: 'north-dakota', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'OH', name: 'Ohio', slug: 'ohio', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'OK', name: 'Oklahoma', slug: 'oklahoma', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'OR', name: 'Oregon', slug: 'oregon', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Legal', nicotine: 'Regulated' } },
  { id: 'PA', name: 'Pennsylvania', slug: 'pennsylvania', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'RI', name: 'Rhode Island', slug: 'rhode-island', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'SC', name: 'South Carolina', slug: 'south-carolina', status: 'restrictive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Illegal', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'SD', name: 'South Dakota', slug: 'south-dakota', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'TN', name: 'Tennessee', slug: 'tennessee', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'TX', name: 'Texas', slug: 'texas', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Legal', delta8: 'Legal (Contested)', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'UT', name: 'Utah', slug: 'utah', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'VT', name: 'Vermont', slug: 'vermont', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'VA', name: 'Virginia', slug: 'virginia', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Legal', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'WA', name: 'Washington', slug: 'washington', status: 'permissive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Decriminalized', nicotine: 'Regulated' } },
  { id: 'WV', name: 'West Virginia', slug: 'west-virginia', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'WI', name: 'Wisconsin', slug: 'wisconsin', status: 'moderate', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Legal', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'WY', name: 'Wyoming', slug: 'wyoming', status: 'restrictive', recentUpdates: 0, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Illegal', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
];
