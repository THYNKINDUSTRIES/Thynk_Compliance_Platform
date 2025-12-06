export interface AgencyContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  officeHours: string;
  publicCommentUrl?: string;
  website: string;
  type: 'federal' | 'state';
}

export const federalAgencyContacts: AgencyContact[] = [
  {
    id: 'fda',
    name: 'Food and Drug Administration (FDA)',
    phone: '1-800-FDA-1088',
    email: 'druginfo@fda.hhs.gov',
    address: '10001 New Hampshire Avenue',
    city: 'Silver Spring',
    state: 'MD',
    zip: '20993',
    officeHours: 'Mon-Fri 8:00 AM - 4:30 PM ET',
    publicCommentUrl: 'https://www.regulations.gov/docket/FDA-2019-N-1482',
    website: 'https://www.fda.gov/news-events/public-health-focus/fda-regulation-cannabis-and-cannabis-derived-products-including-cannabidiol-cbd',
    type: 'federal'
  },
  {
    id: 'dea',
    name: 'Drug Enforcement Administration (DEA)',
    phone: '202-307-1000',
    email: 'DEA.Registration.Help@dea.usdoj.gov',
    address: '8701 Morrissette Drive',
    city: 'Springfield',
    state: 'VA',
    zip: '22152',
    officeHours: 'Mon-Fri 8:00 AM - 5:00 PM ET',
    publicCommentUrl: 'https://www.regulations.gov/document/DEA-2023-0059-0001',
    website: 'https://www.dea.gov/drug-information/cannabis',
    type: 'federal'
  },
  {
    id: 'usda',
    name: 'U.S. Department of Agriculture (USDA)',
    phone: '202-720-2791',
    email: 'SM.AMS.HempProduction@usda.gov',
    address: '1400 Independence Ave SW',
    city: 'Washington',
    state: 'DC',
    zip: '20250',
    officeHours: 'Mon-Fri 8:00 AM - 5:00 PM ET',
    publicCommentUrl: 'https://www.regulations.gov/docket/AMS-SC-21-0042',
    website: 'https://www.ams.usda.gov/rules-regulations/hemp',
    type: 'federal'
  }
];

export const stateAgencyContacts: AgencyContact[] = [
  {
    id: 'mi-cra',
    name: 'Michigan Cannabis Regulatory Agency',
    phone: '517-284-8599',
    email: 'CRA-Info@michigan.gov',
    address: '2407 N Grand River Ave',
    city: 'Lansing',
    state: 'MI',
    zip: '48906',
    officeHours: 'Mon-Fri 8:00 AM - 5:00 PM ET',
    publicCommentUrl: 'https://www.michigan.gov/cra/about/contact',
    website: 'https://www.michigan.gov/cra',
    type: 'state'
  },
  {
    id: 'ca-dcc',
    name: 'California Department of Cannabis Control',
    phone: '844-612-2322',
    email: 'info@cannabis.ca.gov',
    address: '2920 Kilgore Road',
    city: 'Rancho Cordova',
    state: 'CA',
    zip: '95670',
    officeHours: 'Mon-Fri 8:00 AM - 5:00 PM PT',
    publicCommentUrl: 'https://cannabis.ca.gov/about-us/contact-us/',
    website: 'https://cannabis.ca.gov',
    type: 'state'
  },
  {
    id: 'co-med',
    name: 'Colorado Marijuana Enforcement Division',
    phone: '303-205-2300',
    email: 'dor_enforcement@state.co.us',
    address: '1881 Pierce Street',
    city: 'Lakewood',
    state: 'CO',
    zip: '80214',
    officeHours: 'Mon-Fri 8:00 AM - 5:00 PM MT',
    website: 'https://sbg.colorado.gov/med',
    type: 'state'
  }
];

