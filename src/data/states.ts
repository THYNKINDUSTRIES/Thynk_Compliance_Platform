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
  { id: 'CA', name: 'California', slug: 'california', status: 'moderate', recentUpdates: 156, activeDeadlines: 3, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Restricted', kratom: 'Legal', psychedelics: 'Decriminalized', nicotine: 'Regulated' } },
  { id: 'TX', name: 'Texas', slug: 'texas', status: 'moderate', recentUpdates: 89, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Legal', delta8: 'Banned', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'FL', name: 'Florida', slug: 'florida', status: 'moderate', recentUpdates: 134, activeDeadlines: 4, legalStatus: { hemp: 'Legal', thca: 'Legal', delta8: 'Legal', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'NY', name: 'New York', slug: 'new-york', status: 'permissive', recentUpdates: 112, activeDeadlines: 1, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Banned', kratom: 'Legal', psychedelics: 'Illegal', nicotine: 'Regulated' } },
  { id: 'WA', name: 'Washington', slug: 'washington', status: 'permissive', recentUpdates: 98, activeDeadlines: 2, legalStatus: { hemp: 'Legal', thca: 'Regulated', delta8: 'Regulated', kratom: 'Legal', psychedelics: 'Decriminalized', nicotine: 'Regulated' } },
];

