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
  // Original states
  { id: 'CA', name: 'California', slug: 'california', status: 'permissive', recentUpdates: 156, activeDeadlines: 3, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Restricted', kratom: 'Legal', psychedelics: 'Decriminalized', nicotine: 'Regulated' } },
  { id: 'CO', name: 'Colorado', slug: 'colorado', status: 'permissive', recentUpdates: 142, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Decriminalized', nicotine: 'Regulated' } },
  { id: 'WA', name: 'Washington', slug: 'washington', status: 'permissive', recentUpdates: 98, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Decriminalized', nicotine: 'Regulated' } },
  { id: 'OR', name: 'Oregon', slug: 'oregon', status: 'permissive', recentUpdates: 87, activeDeadlines: 1, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Legal', nicotine: 'Regulated' } },
  { id: 'NV', name: 'Nevada', slug: 'nevada', status: 'permissive', recentUpdates: 76, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'MA', name: 'Massachusetts', slug: 'massachusetts', status: 'permissive', recentUpdates: 94, activeDeadlines: 3, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Decriminalized', nicotine: 'Regulated' } },
  { id: 'MI', name: 'Michigan', slug: 'michigan', status: 'permissive', recentUpdates: 88, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Decriminalized', nicotine: 'Regulated' } },
  { id: 'IL', name: 'Illinois', slug: 'illinois', status: 'permissive', recentUpdates: 102, activeDeadlines: 4, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'AZ', name: 'Arizona', slug: 'arizona', status: 'permissive', recentUpdates: 79, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'NY', name: 'New York', slug: 'new-york', status: 'permissive', recentUpdates: 112, activeDeadlines: 1, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Banned', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'NJ', name: 'New Jersey', slug: 'new-jersey', status: 'permissive', recentUpdates: 85, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'PA', name: 'Pennsylvania', slug: 'pennsylvania', status: 'moderate', recentUpdates: 67, activeDeadlines: 1, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'OH', name: 'Ohio', slug: 'ohio', status: 'permissive', recentUpdates: 72, activeDeadlines: 3, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'MD', name: 'Maryland', slug: 'maryland', status: 'permissive', recentUpdates: 81, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'MO', name: 'Missouri', slug: 'missouri', status: 'permissive', recentUpdates: 65, activeDeadlines: 1, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'CT', name: 'Connecticut', slug: 'connecticut', status: 'permissive', recentUpdates: 58, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'VA', name: 'Virginia', slug: 'virginia', status: 'moderate', recentUpdates: 54, activeDeadlines: 1, legalStatus: { hemp: 'Legal', thca: 'Legal', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'NM', name: 'New Mexico', slug: 'new-mexico', status: 'permissive', recentUpdates: 49, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'ME', name: 'Maine', slug: 'maine', status: 'permissive', recentUpdates: 43, activeDeadlines: 1, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'VT', name: 'Vermont', slug: 'vermont', status: 'permissive', recentUpdates: 38, activeDeadlines: 1, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  
  // NEW 10 STATES
  { id: 'FL', name: 'Florida', slug: 'florida', status: 'moderate', recentUpdates: 134, activeDeadlines: 4, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'TX', name: 'Texas', slug: 'texas', status: 'moderate', recentUpdates: 89, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Legal', delta8: 'Legal (Contested)', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'GA', name: 'Georgia', slug: 'georgia', status: 'restrictive', recentUpdates: 45, activeDeadlines: 1, legalStatus: { hemp: 'Legal', thca: 'Medical Only (Low-THC)', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'NC', name: 'North Carolina', slug: 'north-carolina', status: 'restrictive', recentUpdates: 32, activeDeadlines: 1, legalStatus: { hemp: 'Legal (USDA)', thca: 'Unregulated', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'SC', name: 'South Carolina', slug: 'south-carolina', status: 'restrictive', recentUpdates: 28, activeDeadlines: 0, legalStatus: { hemp: 'Legal', thca: 'Illegal', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'TN', name: 'Tennessee', slug: 'tennessee', status: 'moderate', recentUpdates: 56, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'KY', name: 'Kentucky', slug: 'kentucky', status: 'moderate', recentUpdates: 78, activeDeadlines: 3, legalStatus: { hemp: 'Legal', thca: 'Medical (2025)', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'WV', name: 'West Virginia', slug: 'west-virginia', status: 'moderate', recentUpdates: 41, activeDeadlines: 1, legalStatus: { hemp: 'Legal', thca: 'Medical Only', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'DE', name: 'Delaware', slug: 'delaware', status: 'permissive', recentUpdates: 62, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Adult-Use (2025)', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'RI', name: 'Rhode Island', slug: 'rhode-island', status: 'permissive', recentUpdates: 53, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
];
