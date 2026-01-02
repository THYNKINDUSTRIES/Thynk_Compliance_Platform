import { TimelineEntry } from './stateDetails';

export const vaTimeline: TimelineEntry[] = [
  { id: 'va-t1', date: '2025-10-30', title: 'Medical Cannabis Dispensary Openings', type: 'rule', status: 'effective', impact: 'high', summary: 'BOP approves 5 new pharmaceutical processor dispensary locations.', products: ['Cannabis'], citation: 'VA Code § 54.1-3442.5', url: 'https://cannabis.virginia.gov' },
  { id: 'va-t2', date: '2025-09-15', title: 'Delta-8 THC Product Restrictions', type: 'guidance', status: 'effective', impact: 'medium', summary: 'Department of Agriculture issues guidance on delta-8 THC product sales restrictions.', products: ['Delta-8'], citation: 'VDACS Guidance 2025-09', url: 'https://vdacs.virginia.gov' },
  { id: 'va-t3', date: '2025-07-20', title: 'Adult-Use Cannabis Legalization Framework', type: 'bill', status: 'proposed', impact: 'high', summary: 'HB 2312 proposes retail sales framework for adult-use cannabis.', products: ['Cannabis'], citation: 'VA HB 2312', url: 'https://lis.virginia.gov' }
];
