const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

const STATIC_CORS_ORIGINS = [
  'https://thynkflow.io',
  'https://www.thynkflow.io',
  'https://thynk-compliance-platform-77nsei26a.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174'
];

const envCorsOrigins = (Deno.env.get('ALLOWED_CORS_ORIGINS') || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const ALLOWED_CORS_ORIGINS = new Set([...STATIC_CORS_ORIGINS, ...envCorsOrigins]);
const DEFAULT_CORS_ORIGIN = envCorsOrigins[0] || STATIC_CORS_ORIGINS[0];

const buildCorsHeaders = (origin?: string | null) => ({
  ...BASE_CORS_HEADERS,
  'Access-Control-Allow-Origin': origin && ALLOWED_CORS_ORIGINS.has(origin)
    ? origin
    : DEFAULT_CORS_ORIGIN,
});

// @ts-ignore - Deno import for Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const STATE_CANNABIS_SOURCES: Record<string, {
  agency: string;
  agencyName: string;
  rssFeeds: string[];
  newsPages: string[];
  regulationPages: string[];
}> = {'FEDERAL': {
  agency: 'https://www.federalregister.gov/',
  agencyName: 'Federal Register',
  rssFeeds: [],
  newsPages: [],
  regulationPages: [
    'https://www.federalregister.gov/documents/2024/05/21/2024-11137/schedules-of-controlled-substances-rescheduling-of-marijuana',
    'https://www.federalregister.gov/documents/2025/01/16/2025-00945/use-of-cannabis-derived-products-including-cannabidiol-in-veterinary-practice-request-for',
    'https://www.federalregister.gov/documents/2021/01/19/2021-00967/establishment-of-a-domestic-hemp-production-program',
    'https://www.federalregister.gov/documents/2011/07/08/2011-16994/denial-of-petition-to-initiate-proceedings-to-reschedule-marijuana',
    'https://www.federalregister.gov/documents/2001/04/18/01-9306/notice-of-denial-of-petition'
  ]
},

'AL': {
  agency: 'https://amcc.alabama.gov/',
  agencyName: 'Alabama Medical Cannabis Commission',
  rssFeeds: [],
  newsPages: [
    'https://www.al.gov/governor/press-releases/',
    'https://www.al.gov/agriculture/news/',
    'https://www.alabamalegislature.gov/',
    'https://www.alabamapublichealth.gov/',
'https://www.alabama.gov/newsroom',
    'https://www.legislature.state.al.us',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx/news',
    'https://www.al.gov/agriculture/hemp',
    'https://agriculture.al.gov/hemp',
    'https://governor.alabama.gov/news',
    'https://www.al.gov/governor/press-releases',
    'https://governor.alabama.gov/newsroom',
    'https://www.al.gov/agriculture/news',
    'https://amcc.alabama.gov/newsroom',
    'https://www.agi.alabama.gov/news'
  ,
    'https://www.alabamapublichealth.gov/',
    'https://www.legislature.state.al.us',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx/news',
    'https://governor.alabama.gov/news',
    'https://governor.alabama.gov/newsroom',
    'https://www.agi.alabama.gov/news',
    'https://www.alabamapublichealth.gov/',
    'https://www.legislature.state.al.us',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx/news',
    'https://governor.alabama.gov/news',
    'https://governor.alabama.gov/newsroom',
    'https://www.agi.alabama.gov/news',
    'https://www.alabamapublichealth.gov/',
    'https://www.legislature.state.al.us',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx/news',
    'https://governor.alabama.gov/news',
    'https://governor.alabama.gov/newsroom',
    'https://www.agi.alabama.gov/news'],
  regulationPages: [
    'https://www.al.gov/agriculture/hemp/',
    'https://www.alabamaagriculture.gov/',
'https://amcc.alabama.gov/rules/',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx/regulations',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx/rules',
    'https://www.al.gov/laws-regulations/hemp',
    'https://amcc.alabama.gov/licensing',
    'https://www.agi.alabama.gov/hemp-rules',
    'https://amcc.alabama.gov/businesses',
    'https://www.agi.alabama.gov/hemp-businesses',
    'https://amcc.alabama.gov/rules',
    'https://www.agi.alabama.gov/hemp-rules'
  ]
},

'AK': {
  agency: 'https://www.commerce.alaska.gov/web/amco/',
  agencyName: 'Alaska Marijuana Control Board',
  rssFeeds: [],
  newsPages: [
    'https://www.commerce.alaska.gov/web/ArchivedHeadlines',
    'https://www.commerce.alaska.gov/web/amco/MCBMeetingDocuments',
    'https://www.alaska.gov/governor/news',
    'https://www.alaska.gov/news'
  ],
  regulationPages: [
    'https://www.commerce.alaska.gov/web/amco/',
    'https://www.commerce.alaska.gov/web/cbpl/Marijuana',
    'https://www.commerce.alaska.gov/web/cbpl/Hemp'
  ]
},

'AZ': {
  agency: 'https://www.azdhs.gov/licensing/marijuana/',
  agencyName: 'Arizona Department of Health Services – Marijuana Program',
  rssFeeds: [],
  newsPages: [
    'https://az.gov/governor/press-releases/',
    'https://az.gov/governor/',
    'https://az.gov/',
    'https://www.azag.gov/agriculture/news/',
    'https://www.azag.gov/agriculture/hemp/news/',
    'https://www.azdhs.gov/news/',
    'https://agriculture.az.gov/hemp',
    'https://agriculture.az.gov/hemp/news',
    'https://www.az.gov/agriculture/hemp',
    'https://agriculture.az.gov/hemp'
  ,
    'https://www.azdhs.gov/news/',
    'https://www.azdhs.gov/news/',
    'https://www.azdhs.gov/news/'],
  regulationPages: [
    'https://www.azag.gov/agriculture/hemp/',
    'https://www.azag.gov/agriculture/',
    'https://www.azag.gov/',
    'https://www.azdhs.gov/licensing/marijuana/adult-use-marijuana/',
    'https://agriculture.az.gov/hemp',
    'https://agriculture.az.gov/hemp/regulations',
    'https://agriculture.az.gov/hemp/rules',
    'https://www.az.gov/laws-regulations/hemp'
  ]
},

'AR': {
  agency: 'https://www.arkansas.gov/amcc/',
  agencyName: 'Arkansas Medical Marijuana Commission',
  rssFeeds: [],
  newsPages: [],
  regulationPages: []
},

'CA': {
  agency: 'https://www.cannabis.ca.gov/',
  agencyName: 'California Department of Cannabis Control',
  rssFeeds: [],
  newsPages: [
    'https://www.cannabis.ca.gov/about-us/announcements/',
    'https://www.cannabis.ca.gov/posts/',
    'https://www.cdfa.ca.gov/plant/industrialhemp',
    'https://www.cdfa.ca.gov/plant/industrialhemp/news',
    'https://www.ca.gov/agriculture/hemp',
    'https://agriculture.ca.gov/hemp'
  ,
    'https://www.cannabis.ca.gov/about-us/announcements/',
    'https://www.cannabis.ca.gov/posts/',
    'https://www.cdfa.ca.gov/plant/industrialhemp',
    'https://www.cdfa.ca.gov/plant/industrialhemp/news',
    'https://www.cannabis.ca.gov/about-us/announcements/',
    'https://www.cannabis.ca.gov/posts/',
    'https://www.cdfa.ca.gov/plant/industrialhemp',
    'https://www.cdfa.ca.gov/plant/industrialhemp/news',
    'https://www.cannabis.ca.gov/about-us/announcements/',
    'https://www.cannabis.ca.gov/posts/',
    'https://www.cdfa.ca.gov/plant/industrialhemp',
    'https://www.cdfa.ca.gov/plant/industrialhemp/news'],
  regulationPages: [
    'https://www.cannabis.ca.gov/cannabis-laws/dcc-regulations/',
    'https://www.cdfa.ca.gov/plant/industrialhemp/',
    'https://www.cdfa.ca.gov/plant/industrialhemp/regulations',
    'https://www.cdfa.ca.gov/plant/industrialhemp/rules',
    'https://www.ca.gov/laws-regulations/hemp'
  ]
},

'CO': {
  agency: 'https://sbg.colorado.gov/marijuana-home',
  agencyName: 'Colorado Marijuana Enforcement Division',
  rssFeeds: [],
  newsPages: [
    'https://cdor.colorado.gov/category/press-release',
    'https://cdor.colorado.gov/media-center-marijuana-enforcement-division',
    'https://ag.colorado.gov/category/press-release',
    'https://www.colorado.gov/governor/news',
    'https://leg.colorado.gov/news'
  ],
  regulationPages: [
    'https://cdps.colorado.gov/Marijuana/Laws-and-Rules',
    'https://leg.colorado.gov/agendas-rules-procedures/rules-and-regulations',
    'https://ag.colorado.gov/plants/industrial-hemp'
  ]
},

'CT': {
  agency: 'https://portal.ct.gov/dcp/cannabis',
  agencyName: 'Connecticut Department of Consumer Protection – Cannabis',
  rssFeeds: [],
  newsPages: [
    'https://www.ct.gov/agriculture/news/',
    'https://www.ct.gov/agriculture/hemp/news/',
    'https://www.ct.gov/governor/news/',
    'https://www.ct.gov/governor/',
    'https://www.ct.gov/news',
    'https://legislature.ct.gov',
    'https://portal.ct.gov/doag/program/hemp',
    'https://portal.ct.gov/doag/program/hemp/news',
    'https://www.ct.gov/agriculture/hemp',
    'https://agriculture.ct.gov/hemp'
  ,
    'https://www.ct.gov/agriculture/news/',
    'https://www.ct.gov/agriculture/hemp/news/',
    'https://www.ct.gov/governor/news/',
    'https://www.ct.gov/governor/',
    'https://www.ct.gov/news',
    'https://portal.ct.gov/doag/program/hemp',
    'https://portal.ct.gov/doag/program/hemp/news',
    'https://www.ct.gov/agriculture/hemp',
    'https://www.ct.gov/agriculture/news/',
    'https://www.ct.gov/agriculture/hemp/news/',
    'https://www.ct.gov/governor/news/',
    'https://www.ct.gov/governor/',
    'https://www.ct.gov/news',
    'https://portal.ct.gov/doag/program/hemp',
    'https://portal.ct.gov/doag/program/hemp/news',
    'https://www.ct.gov/agriculture/hemp',
    'https://www.ct.gov/agriculture/news/',
    'https://www.ct.gov/agriculture/hemp/news/',
    'https://www.ct.gov/governor/news/',
    'https://www.ct.gov/governor/',
    'https://www.ct.gov/news',
    'https://portal.ct.gov/doag/program/hemp',
    'https://portal.ct.gov/doag/program/hemp/news',
    'https://www.ct.gov/agriculture/hemp'],
  regulationPages: [
    'https://www.ct.gov/agriculture/hemp/',
    'https://portal.ct.gov/dcp/cannabis/regulations',
    'https://portal.ct.gov/doag/program/hemp',
    'https://portal.ct.gov/doag/program/hemp/regulations',
    'https://portal.ct.gov/doag/program/hemp/rules',
    'https://www.ct.gov/laws-regulations/hemp'
  ]
},

'DE': {
  agency: 'https://omc.delaware.gov/',
  agencyName: 'Delaware Office of the Marijuana Commissioner',
  rssFeeds: [],
  newsPages: [
'https://news.delaware.gov',
    'https://legislature.delaware.gov',
    'https://dda.delaware.gov/hemp',
    'https://dda.delaware.gov/hemp/news',
    'https://www.de.gov/agriculture/hemp',
    'https://agriculture.de.gov/hemp',
    'https://dda.delaware.gov/press-releases',
    'https://dda.delaware.gov/announcements',
    'https://governor.delaware.gov/news',
    'https://dda.delaware.gov/newsroom',
    'https://governor.delaware.gov/newsroom',
    'https://dda.delaware.gov/newsroom',
    'https://omc.delaware.gov/newsroom',
    'https://www.de.gov/governor/news'
  ,
    'https://news.delaware.gov',
    'https://dda.delaware.gov/hemp',
    'https://dda.delaware.gov/hemp/news',
    'https://dda.delaware.gov/press-releases',
    'https://dda.delaware.gov/announcements',
    'https://governor.delaware.gov/news',
    'https://dda.delaware.gov/newsroom',
    'https://governor.delaware.gov/newsroom',
    'https://dda.delaware.gov/newsroom',
    'https://omc.delaware.gov/newsroom',
    'https://news.delaware.gov',
    'https://dda.delaware.gov/hemp',
    'https://dda.delaware.gov/hemp/news',
    'https://dda.delaware.gov/press-releases',
    'https://dda.delaware.gov/announcements',
    'https://governor.delaware.gov/news',
    'https://dda.delaware.gov/newsroom',
    'https://governor.delaware.gov/newsroom',
    'https://dda.delaware.gov/newsroom',
    'https://omc.delaware.gov/newsroom',
    'https://news.delaware.gov',
    'https://dda.delaware.gov/hemp',
    'https://dda.delaware.gov/hemp/news',
    'https://dda.delaware.gov/press-releases',
    'https://dda.delaware.gov/announcements',
    'https://governor.delaware.gov/news',
    'https://dda.delaware.gov/newsroom',
    'https://governor.delaware.gov/newsroom',
    'https://dda.delaware.gov/newsroom',
    'https://omc.delaware.gov/newsroom'],
  regulationPages: [
'https://omc.delaware.gov/regulations/',
    'https://dda.delaware.gov/hemp/',
    'https://dda.delaware.gov/hemp/regulations',
    'https://dda.delaware.gov/hemp/rules',
    'https://www.de.gov/laws-regulations/hemp',
    'https://dda.delaware.gov/regulations',
    'https://dda.delaware.gov/rules',
    'https://dda.delaware.gov/laws',
    'https://dda.delaware.gov/plant-industries',
    'https://omc.delaware.gov/cannabis-rules',
    'https://dda.delaware.gov/hemp-businesses',
    'https://omc.delaware.gov/businesses',
    'https://dda.delaware.gov/hemp-rules',
    'https://omc.delaware.gov/rules'
  ]
},

'FL': {
  agency: 'https://knowthefactsmmj.com/',
  agencyName: 'Florida Office of Medical Marijuana Use',
  rssFeeds: [],
  newsPages: [
'https://knowthefactsmmj.com/about/weekly-updates/',
    'https://www.floridahealth.gov/newsroom/',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp/news',
    'https://www.fl.gov/agriculture/hemp',
    'https://agriculture.fl.gov/hemp',
    'https://www.freshfromflorida.com/Divisions-Offices/Plant-Industry',
    'https://www.fdacs.gov/Divisions-Offices/Plant-Industry/News-Releases',
    'https://www.flgov.com/newsroom',
    'https://www.freshfromflorida.com/news',
    'https://www.flgov.com/newsroom',
    'https://www.freshfromflorida.com/newsroom',
    'https://www.fdacs.gov/newsroom',
    'https://www.fl.gov/agriculture/news'
  ,
    'https://knowthefactsmmj.com/about/weekly-updates/',
    'https://www.floridahealth.gov/newsroom/',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp/news',
    'https://www.freshfromflorida.com/Divisions-Offices/Plant-Industry',
    'https://www.fdacs.gov/Divisions-Offices/Plant-Industry/News-Releases',
    'https://www.freshfromflorida.com/news',
    'https://www.fdacs.gov/newsroom',
    'https://knowthefactsmmj.com/about/weekly-updates/',
    'https://www.floridahealth.gov/newsroom/',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp/news',
    'https://www.freshfromflorida.com/Divisions-Offices/Plant-Industry',
    'https://www.fdacs.gov/Divisions-Offices/Plant-Industry/News-Releases',
    'https://www.freshfromflorida.com/news',
    'https://www.fdacs.gov/newsroom',
    'https://knowthefactsmmj.com/about/weekly-updates/',
    'https://www.floridahealth.gov/newsroom/',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp/news',
    'https://www.freshfromflorida.com/Divisions-Offices/Plant-Industry',
    'https://www.fdacs.gov/Divisions-Offices/Plant-Industry/News-Releases',
    'https://www.freshfromflorida.com/news',
    'https://www.fdacs.gov/newsroom'],
  regulationPages: [
'https://knowthefactsmmj.com/about/',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp/regulations',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp/rules',
    'https://www.fl.gov/laws-regulations/hemp',
    'https://www.freshfromflorida.com/Divisions-Offices/Plant-Industry/Bureau-of-Plant-and-Apiary-Inspection/Industrial-Hemp',
    'https://www.fdacs.gov/Divisions-Offices/Plant-Industry/Bureau-of-Plant-and-Apiary-Inspection/Industrial-Hemp',
    'https://www.freshfromflorida.com/cannabis',
    'https://www.freshfromflorida.com/hemp-program',
    'https://www.freshfromflorida.com/hemp-businesses',
    'https://www.freshfromflorida.com/cannabis-businesses',
    'https://www.freshfromflorida.com/hemp-rules',
    'https://www.freshfromflorida.com/cannabis-rules'
  ]
},

'GA': {
  agency: 'https://www.gmcc.ga.gov/',
  agencyName: 'Georgia Access to Medical Cannabis Commission',
  rssFeeds: [],
  newsPages: [
'https://www.gmcc.ga.gov/news',
    'https://gov.georgia.gov/press-releases',
    'https://www.agr.georgia.gov/news.aspx',
    'https://www.ga.gov/agriculture/news'
  ,
    'https://www.ga.gov/agriculture/news',
    'https://www.ga.gov/agriculture/newsroom',
    'https://www.ga.gov/agriculture/press-releases',
    'https://www.ga.gov/agriculture/announcements',
    'https://www.ga.gov/agriculture/updates',
    'https://www.ga.gov/agriculture/latest-news',
    'https://www.ga.gov/agriculture/media/news',
    'https://www.ga.gov/agriculture/about/news',
    'https://www.freshfromflorida.com/news',
    'https://www.freshfromflorida.com/newsroom',
    'https://www.freshfromflorida.com/press-releases',
    'https://www.freshfromflorida.com/announcements',
    'https://www.freshfromflorida.com/updates',
    'https://www.freshfromflorida.com/latest-news',
    'https://www.freshfromflorida.com/media/news',
    'https://www.freshfromflorida.com/about/news',
    'https://gov.georgia.gov/press-releases',
    'https://www.agr.georgia.gov/news.aspx',
    'https://www.freshfromflorida.com/news',
    'https://www.freshfromflorida.com/media/news',
    'https://www.freshfromflorida.com/about/news',
    'https://gov.georgia.gov/press-releases',
    'https://www.agr.georgia.gov/news.aspx',
    'https://www.freshfromflorida.com/news',
    'https://www.freshfromflorida.com/media/news',
    'https://www.freshfromflorida.com/about/news',
    'https://gov.georgia.gov/press-releases',
    'https://www.agr.georgia.gov/news.aspx',
    'https://www.freshfromflorida.com/news',
    'https://www.freshfromflorida.com/media/news',
    'https://www.freshfromflorida.com/about/news'],
  regulationPages: [
'https://www.gmcc.ga.gov/regulations',
    'https://www.agr.georgia.gov/rules-and-regulations.aspx',
    'https://www.ga.gov/agriculture/regulations'
  ]
}
,
'HI': {
  agency: 'https://health.hawaii.gov/medicalcannabis/',
  agencyName: 'Hawaii Department of Health – Medical Cannabis Program',
  rssFeeds: [],
  newsPages: [
'https://health.hawaii.gov/news/',
    'https://hdoa.hawaii.gov/hemp',
    'https://hdoa.hawaii.gov/hemp/news',
    'https://www.hi.gov/agriculture/hemp',
    'https://agriculture.hi.gov/hemp',
    'https://governor.hawaii.gov/news',
    'https://hdoa.hawaii.gov/newsroom',
    'https://governor.hawaii.gov/newsroom',
    'https://hdoa.hawaii.gov/newsroom',
    'https://health.hawaii.gov/newsroom',
    'https://www.hi.gov/governor/news'
  ,
    'https://health.hawaii.gov/news/',
    'https://hdoa.hawaii.gov/hemp',
    'https://governor.hawaii.gov/news',
    'https://governor.hawaii.gov/newsroom',
    'https://health.hawaii.gov/news/',
    'https://hdoa.hawaii.gov/hemp',
    'https://governor.hawaii.gov/news',
    'https://governor.hawaii.gov/newsroom',
    'https://health.hawaii.gov/news/',
    'https://hdoa.hawaii.gov/hemp',
    'https://governor.hawaii.gov/news',
    'https://governor.hawaii.gov/newsroom'],
  regulationPages: [
'https://health.hawaii.gov/medicalcannabis/statutes-rules/',
    'https://hdoa.hawaii.gov/hemp/',
    'https://hdoa.hawaii.gov/hemp/regulations',
    'https://hdoa.hawaii.gov/hemp/rules',
    'https://www.hi.gov/laws-regulations/hemp',
    'https://hdoa.hawaii.gov/plant-industries',
    'https://health.hawaii.gov/medical-cannabis-rules',
    'https://hdoa.hawaii.gov/hemp-businesses',
    'https://health.hawaii.gov/medical-businesses',
    'https://hdoa.hawaii.gov/hemp-rules',
    'https://health.hawaii.gov/medical-rules'
  ]
},

'ID': {
  agency: 'https://agri.idaho.gov/main/hemp/',
  agencyName: 'Idaho State Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://www.idahoagriculture.gov/news/',
    'https://www.idahoagriculture.gov/plant-industries/hemp/news/',
    'https://www.idaho.gov/governor/news/',
    'https://www.idaho.gov/governor/',
    'https://www.idaho.gov/',
    'https://agri.idaho.gov/news/',
    'https://www.agri.idaho.gov/main/hemp',
    'https://www.agri.idaho.gov/main/hemp/news',
    'https://www.id.gov/agriculture/hemp',
    'https://agriculture.id.gov/hemp'
  ,
    'https://www.idaho.gov/',
    'https://agri.idaho.gov/news/',
    'https://www.idaho.gov/',
    'https://agri.idaho.gov/news/',
    'https://www.idaho.gov/',
    'https://agri.idaho.gov/news/'],
  regulationPages: [
    'https://www.idahoagriculture.gov/plant-industries/hemp/',
    'https://www.idahoagriculture.gov/plant-industries/',
    'https://www.idahoagriculture.gov/',
    'https://agri.idaho.gov/main/hemp/',
    'https://www.agri.idaho.gov/main/hemp/',
    'https://www.agri.idaho.gov/main/hemp/regulations',
    'https://www.agri.idaho.gov/main/hemp/rules',
    'https://www.id.gov/laws-regulations/hemp'
  ]
},

'IL': {
  agency: 'https://idfpr.illinois.gov/profs/adultusecan.html',
  agencyName: 'Illinois Department of Financial and Professional Regulation – Cannabis',
  rssFeeds: [],
  newsPages: [
    'https://idfpr.illinois.gov/News.html',
    'https://isp.idfpr.illinois.gov/hemp',
    'https://isp.idfpr.illinois.gov/hemp/news',
    'https://www.il.gov/agriculture/hemp',
    'https://agriculture.il.gov/hemp'
  ],
  regulationPages: [
    'https://idfpr.illinois.gov/profs/adultusecan.html',
    'https://isp.idfpr.illinois.gov/hemp',
    'https://isp.idfpr.illinois.gov/hemp/regulations',
    'https://isp.idfpr.illinois.gov/hemp/rules',
    'https://www.il.gov/laws-regulations/hemp'
  ]
},

'IN': {
  agency: 'https://www.in.gov/cannabis/',
  agencyName: 'Indiana State Department of Health – Cannabis / Hemp',
  rssFeeds: [],
  newsPages: [],
  regulationPages: []
},

'IA': {
  agency: 'https://hhs.iowa.gov/medical-cannabis',
  agencyName: 'Iowa Department of Health and Human Services – Medical Cannabis',
  rssFeeds: [],
  newsPages: [
    'https://hhs.iowa.gov/news',
    'https://www.iowaagriculture.gov/hemp.asp',
    'https://www.iowaagriculture.gov/hemp.asp/news',
    'https://www.ia.gov/agriculture/hemp',
    'https://agriculture.ia.gov/hemp'
  ,
    'https://www.iowaagriculture.gov/news',
    'https://www.iowaagriculture.gov/newsroom',
    'https://www.iowaagriculture.gov/press-releases',
    'https://www.iowaagriculture.gov/announcements',
    'https://www.iowaagriculture.gov/updates',
    'https://www.iowaagriculture.gov/latest-news',
    'https://www.iowaagriculture.gov/media/news',
    'https://www.iowaagriculture.gov/about/news',
    'https://www.iowaagriculture.gov/hemp.asp',
    'https://www.iowaagriculture.gov/hemp.asp/news',
    'https://www.iowaagriculture.gov/news',
    'https://www.iowaagriculture.gov/newsroom',
    'https://www.iowaagriculture.gov/press-releases',
    'https://www.iowaagriculture.gov/announcements',
    'https://www.iowaagriculture.gov/updates',
    'https://www.iowaagriculture.gov/latest-news',
    'https://www.iowaagriculture.gov/media/news',
    'https://www.iowaagriculture.gov/about/news',
    'https://www.iowaagriculture.gov/hemp.asp',
    'https://www.iowaagriculture.gov/hemp.asp/news',
    'https://www.iowaagriculture.gov/news',
    'https://www.iowaagriculture.gov/newsroom',
    'https://www.iowaagriculture.gov/press-releases',
    'https://www.iowaagriculture.gov/announcements',
    'https://www.iowaagriculture.gov/updates',
    'https://www.iowaagriculture.gov/latest-news',
    'https://www.iowaagriculture.gov/media/news',
    'https://www.iowaagriculture.gov/about/news',
    'https://www.iowaagriculture.gov/hemp.asp',
    'https://www.iowaagriculture.gov/hemp.asp/news',
    'https://www.iowaagriculture.gov/news',
    'https://www.iowaagriculture.gov/newsroom',
    'https://www.iowaagriculture.gov/press-releases',
    'https://www.iowaagriculture.gov/announcements',
    'https://www.iowaagriculture.gov/updates',
    'https://www.iowaagriculture.gov/latest-news',
    'https://www.iowaagriculture.gov/media/news',
    'https://www.iowaagriculture.gov/about/news'],
  regulationPages: [
    'https://hhs.iowa.gov/medical-cannabis',
    'https://www.iowaagriculture.gov/hemp.asp',
    'https://www.iowaagriculture.gov/hemp.asp/regulations',
    'https://www.iowaagriculture.gov/hemp.asp/rules',
    'https://www.ia.gov/laws-regulations/hemp'
  ]
},

'KS': {
  agency: 'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp',
  agencyName: 'Kansas Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://www.ksda.gov/news/',
    'https://www.ksda.gov/plant-protection/hemp/news/',
    'https://www.kansas.gov/governor/news/',
    'https://www.kansas.gov/governor/',
    'https://www.kansas.gov/',
'https://agriculture.ks.gov/news',
    'https://www.kslegislature.org',
    'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp/news',
    'https://www.ks.gov/agriculture/hemp',
    'https://agriculture.ks.gov/hemp',
    'https://governor.ks.gov/news',
    'https://agriculture.ks.gov/newsroom',
    'https://governor.ks.gov/newsroom',
    'https://agriculture.ks.gov/newsroom',
    'https://www.ks.gov/governor/news',
    'https://www.ks.gov/agriculture/news'
  ,
    'https://www.kansas.gov/',
    'https://agriculture.ks.gov/news',
    'https://www.kslegislature.org',
    'https://governor.ks.gov/newsroom',
    'https://www.kansas.gov/',
    'https://www.kansas.gov/'],
  regulationPages: [
    'https://www.ksda.gov/plant-protection/hemp/',
    'https://www.ksda.gov/plant-protection/',
    'https://www.ksda.gov/',
'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp',
    'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp/regulations',
    'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp/rules',
    'https://www.ks.gov/laws-regulations/hemp',
    'https://agriculture.ks.gov/hemp-program',
    'https://agriculture.ks.gov/plant-protection',
    'https://agriculture.ks.gov/hemp-businesses',
    'https://agriculture.ks.gov/plant-businesses',
    'https://agriculture.ks.gov/hemp-rules',
    'https://agriculture.ks.gov/plant-rules'
  ]
},

'KY': {
  agency: 'https://kymedcan.ky.gov/',
  agencyName: 'Kentucky Office of Medical Cannabis',
  rssFeeds: [],
  newsPages: [
    'https://legislature.ky.gov/news',
    'https://governor.ky.gov/news',
    'https://www.kyagr.com/marketing/hemp.html',
    'https://www.kyagr.com/marketing/hemp.html/news',
    'https://www.ky.gov/agriculture/hemp',
    'https://agriculture.ky.gov/hemp'
  ,
    'https://governor.ky.gov/news',
    'https://www.kyagr.com/marketing/hemp.html',
    'https://www.kyagr.com/marketing/hemp.html/news',
    'https://governor.ky.gov/news',
    'https://www.kyagr.com/marketing/hemp.html',
    'https://www.kyagr.com/marketing/hemp.html/news',
    'https://governor.ky.gov/news',
    'https://www.kyagr.com/marketing/hemp.html',
    'https://www.kyagr.com/marketing/hemp.html/news'],
  regulationPages: [
    'https://legislature.ky.gov/laws/statutes',
    'https://www.kyagr.com/marketing/hemp.html',
    'https://www.kyagr.com/marketing/hemp.html/regulations',
    'https://www.kyagr.com/marketing/hemp.html/rules',
    'https://www.ky.gov/laws-regulations/hemp'
  ]
},

'LA': {
  agency: 'https://www.ldaf.state.la.us/medical-marijuana/',
  agencyName: 'Louisiana Department of Agriculture & Forestry – Medical Marijuana',
  rssFeeds: [],
  newsPages: [],
  regulationPages: []
},

'ME': {
  agency: 'https://www.maine.gov/dafs/ocp',
  agencyName: 'Maine Office of Cannabis Policy',
  rssFeeds: [],
  newsPages: [
'https://www.maine.gov/dafs/ocp/news',
    'https://legislature.maine.gov',
    'https://www.maine.gov/agriculture/hemp',
    'https://www.maine.gov/agriculture/hemp/news',
    'https://www.me.gov/agriculture/hemp',
    'https://agriculture.me.gov/hemp',
    'https://www.maine.gov/governor/news',
    'https://www.maine.gov/agriculture/newsroom',
    'https://www.maine.gov/governor/newsroom',
    'https://www.maine.gov/agriculture/newsroom',
    'https://www.me.gov/governor/news',
    'https://www.me.gov/agriculture/news'
  ,
    'https://legislature.maine.gov',
    'https://www.maine.gov/agriculture/hemp',
    'https://www.maine.gov/agriculture/hemp/news',
    'https://www.maine.gov/agriculture/newsroom',
    'https://www.maine.gov/agriculture/newsroom',
    'https://legislature.maine.gov',
    'https://www.maine.gov/agriculture/hemp',
    'https://www.maine.gov/agriculture/hemp/news',
    'https://www.maine.gov/agriculture/newsroom',
    'https://www.maine.gov/agriculture/newsroom',
    'https://legislature.maine.gov',
    'https://www.maine.gov/agriculture/hemp',
    'https://www.maine.gov/agriculture/hemp/news',
    'https://www.maine.gov/agriculture/newsroom',
    'https://www.maine.gov/agriculture/newsroom'],
  regulationPages: [
'https://www.maine.gov/dafs/ocp/rules-statutes',
    'https://www.maine.gov/agriculture/hemp/',
    'https://www.maine.gov/agriculture/hemp/regulations',
    'https://www.maine.gov/agriculture/hemp/rules',
    'https://www.me.gov/laws-regulations/hemp',
    'https://www.maine.gov/agriculture/hemp-program',
    'https://www.maine.gov/agriculture/plant-industries',
    'https://www.maine.gov/agriculture/hemp-businesses',
    'https://www.maine.gov/agriculture/plant-businesses',
    'https://www.maine.gov/agriculture/hemp-rules',
    'https://www.maine.gov/agriculture/plant-rules'
  ]
},

'MD': {
  agency: 'https://cannabis.maryland.gov/',
  agencyName: 'Maryland Cannabis Administration',
  rssFeeds: [],
  newsPages: [
    'https://cannabis.maryland.gov/Pages/news.aspx',
    'https://mda.maryland.gov/hemp/Pages/default.aspx',
    'https://mda.maryland.gov/hemp/Pages/default.aspx/news',
    'https://www.md.gov/agriculture/hemp',
    'https://agriculture.md.gov/hemp'
  ,
    'https://cannabis.maryland.gov/Pages/news.aspx',
    'https://cannabis.maryland.gov/Pages/news.aspx',
    'https://cannabis.maryland.gov/Pages/news.aspx'],
  regulationPages: [
    'https://cannabis.maryland.gov/Pages/Laws-Regulations.aspx',
    'https://mda.maryland.gov/hemp/Pages/default.aspx',
    'https://mda.maryland.gov/hemp/Pages/default.aspx/regulations',
    'https://mda.maryland.gov/hemp/Pages/default.aspx/rules',
    'https://www.md.gov/laws-regulations/hemp'
  ]
},
'MA': { 
   agency: 'https://masscannabiscontrol.com', 
   agencyName: 'Massachusetts Cannabis Control Commission', 
   rssFeeds: ['https://masscannabiscontrol.com/feed'], 
   newsPages: [
'https://masscannabiscontrol.com/news',
    'https://masscannabiscontrol.com/public-meetings',
    'https://www.mass.gov/hemp',
    'https://www.mass.gov/hemp/news',
    'https://www.ma.gov/agriculture/hemp',
    'https://agriculture.ma.gov/hemp',
    'https://www.mass.gov/news',
    'https://www.mass.gov/agriculture/news',
    'https://www.mass.gov/governor/press-office',
    'https://www.mass.gov/agriculture/news',
    'https://www.mass.gov/public-health/news',
    'https://masscannabiscontrol.com/news-events'
  ,
    'https://masscannabiscontrol.com/feed',
    'https://masscannabiscontrol.com/news',
    'https://masscannabiscontrol.com/public-meetings',
    'https://www.mass.gov/governor/press-office',
    'https://masscannabiscontrol.com/feed',
    'https://masscannabiscontrol.com/news',
    'https://masscannabiscontrol.com/public-meetings',
    'https://www.mass.gov/governor/press-office',
    'https://masscannabiscontrol.com/feed',
    'https://masscannabiscontrol.com/news',
    'https://masscannabiscontrol.com/public-meetings',
    'https://www.mass.gov/governor/press-office'], 
   regulationPages: [
'https://masscannabiscontrol.com/public-documents/regulations',
    'https://www.mass.gov/hemp',
    'https://www.mass.gov/hemp/regulations',
    'https://www.mass.gov/hemp/rules',
    'https://www.ma.gov/laws-regulations/hemp',
    'https://www.mass.gov/cannabis-rules',
    'https://www.mass.gov/hemp-rules',
    'https://masscannabiscontrol.com/businesses',
    'https://masscannabiscontrol.com/consumers',
    'https://www.mass.gov/hemp-regulations',
    'https://masscannabiscontrol.com/rules-regulations'
  ] 
},
'MI': { 
   agency: 'https://www.michigan.gov/cra', 
   agencyName: 'Michigan Cannabis Regulatory Agency', 
   rssFeeds: [], 
   newsPages: [
'https://www.michigan.gov/news',
    'https://legislature.mi.gov',
    'https://www.michigan.gov/mda/services/industrial-hemp',
    'https://www.michigan.gov/mda/services/industrial-hemp/news',
    'https://www.mi.gov/agriculture/hemp',
    'https://agriculture.mi.gov/hemp',
    'https://www.michigan.gov/mda/press-releases',
    'https://www.michigan.gov/mda/news',
    'https://www.michigan.gov/cra/news'
  ,
    'https://www.michigan.gov/news',
    'https://legislature.mi.gov',
    'https://www.michigan.gov/news',
    'https://www.michigan.gov/news'], 
   regulationPages: [
'https://www.michigan.gov/cra/about/rules',
    'https://www.michigan.gov/mda/services/industrial-hemp',
    'https://www.michigan.gov/mda/services/industrial-hemp/regulations',
    'https://www.michigan.gov/mda/services/industrial-hemp/rules',
    'https://www.mi.gov/laws-regulations/hemp',
    'https://www.michigan.gov/cra/rules',
    'https://www.michigan.gov/mda/industrial-hemp-regulations',
    'https://www.michigan.gov/cra/licensing'
  ] 
},
'MN': { 
   agency: 'https://mn.gov/ocm', 
   agencyName: 'Minnesota Office of Cannabis Management', 
   rssFeeds: [], 
   newsPages: [
    'https://www.mda.state.mn.us/news/',
    'https://www.mda.state.mn.us/plants/hemp/news/',
    'https://www.minnesota.gov/governor/news/',
    'https://www.minnesota.gov/governor/',
    'https://www.minnesota.gov/',
'https://mn.gov/ocm/media/news-releases/',
    'https://www.mda.state.mn.us/hemp',
    'https://www.mda.state.mn.us/hemp/news',
    'https://www.mn.gov/agriculture/hemp',
    'https://agriculture.mn.gov/hemp',
    'https://www.mda.state.mn.us/news',
    'https://www.mda.state.mn.us/press-releases'
  ,
    'https://www.mda.state.mn.us/news/',
    'https://mn.gov/ocm/media/news-releases/',
    'https://www.mda.state.mn.us/hemp',
    'https://www.mda.state.mn.us/news',
    'https://www.mda.state.mn.us/news/',
    'https://mn.gov/ocm/media/news-releases/',
    'https://www.mda.state.mn.us/hemp',
    'https://www.mn.gov/agriculture/hemp',
    'https://www.mda.state.mn.us/news',
    'https://www.mda.state.mn.us/news/',
    'https://mn.gov/ocm/media/news-releases/',
    'https://www.mda.state.mn.us/hemp',
    'https://www.mda.state.mn.us/news'], 
   regulationPages: [
    'https://www.mda.state.mn.us/plants/hemp/',
'https://mn.gov/ocm/laws/',
    'https://mn.gov/ocm/laws/rulemaking.jsp',
    'https://www.revisor.mn.gov/rules/9810/',
    'https://www.mda.state.mn.us/hemp',
    'https://www.mda.state.mn.us/hemp/regulations',
    'https://www.mda.state.mn.us/hemp/rules',
    'https://www.mn.gov/laws-regulations/hemp',
    'https://www.mda.state.mn.us/plants/hemp',
    'https://www.mda.state.mn.us/plants/hemp-regulations'
  ] 
},
'MS': { 
   agency: 'https://www.mda.ms.gov/divisions/hemp', 
   agencyName: 'Mississippi Department of Agriculture - Hemp', 
   rssFeeds: [], 
   newsPages: [], 
   regulationPages: [] 
},
'MO': { 
   agency: 'https://cannabis.mo.gov', 
   agencyName: 'Missouri Division of Cannabis Regulation', 
   rssFeeds: [], 
   newsPages: [
    'https://cannabis.mo.gov/news',
    'https://agriculture.mo.gov/hemp',
    'https://agriculture.mo.gov/hemp/news',
    'https://www.mo.gov/agriculture/hemp',
    'https://agriculture.mo.gov/hemp'
  ,
    'https://agriculture.mo.gov/news',
    'https://www.mda.mo.gov/news',
    'https://www.mda.mo.gov/newsroom',
    'https://www.mda.mo.gov/press-releases',
    'https://www.mda.mo.gov/announcements',
    'https://www.mda.mo.gov/updates',
    'https://www.mda.mo.gov/latest-news',
    'https://www.mda.mo.gov/media/news',
    'https://www.mda.mo.gov/about/news',
    'https://cannabis.mo.gov/news',
    'https://agriculture.mo.gov/news',
    'https://www.mda.mo.gov/news',
    'https://cannabis.mo.gov/news',
    'https://agriculture.mo.gov/news',
    'https://www.mda.mo.gov/news',
    'https://cannabis.mo.gov/news',
    'https://agriculture.mo.gov/news',
    'https://www.mda.mo.gov/news'], 
   regulationPages: [
    'https://cannabis.mo.gov/rules-regulations',
    'https://agriculture.mo.gov/hemp/',
    'https://agriculture.mo.gov/hemp/regulations',
    'https://agriculture.mo.gov/hemp/rules',
    'https://www.mo.gov/laws-regulations/hemp'
  ] 
},
'MT': { 
   agency: 'https://mt.gov/cannabis', 
   agencyName: 'Montana Department of Revenue - Cannabis Control Division', 
   rssFeeds: [], 
   newsPages: [
    'https://agr.mt.gov/news/',
    'https://agr.mt.gov/agriculture/hemp/news/',
    'https://www.montana.gov/governor/news/',
    'https://www.montana.gov/governor/',
    'https://www.montana.gov/',
    'https://mt.gov/cannabis/news',
    'https://leg.mt.gov',
    'https://ag.mt.gov/hemp',
    'https://ag.mt.gov/hemp/news',
    'https://www.mt.gov/agriculture/hemp',
    'https://agriculture.mt.gov/hemp'
  ,
    'https://www.montana.gov/',
    'https://www.montana.gov/',
    'https://www.montana.gov/'], 
   regulationPages: [
    'https://agr.mt.gov/hemp',
    'https://agr.mt.gov/agriculture/hemp/',
    'https://agr.mt.gov/agriculture/',
    'https://agr.mt.gov/',
    'https://mt.gov/cannabis/rules',
    'https://ag.mt.gov/hemp',
    'https://ag.mt.gov/hemp/regulations',
    'https://ag.mt.gov/hemp/rules',
    'https://www.mt.gov/laws-regulations/hemp'
  ] 
},
'NE': { 
   agency: 'https://agr.nebraska.gov/hemp', 
   agencyName: 'Nebraska Department of Agriculture - Hemp', 
   rssFeeds: [], 
   newsPages: [
    'https://nda.nebraska.gov/news/',
    'https://nda.nebraska.gov/agriculture/hemp/news/',
    'https://www.nebraska.gov/governor/news/',
    'https://www.nebraska.gov/governor/',
    'https://www.nebraska.gov/',
    'https://agr.nebraska.gov/news',
    'https://legislature.nebraska.gov',
    'https://nda.nebraska.gov/hemp',
    'https://nda.nebraska.gov/hemp/news',
    'https://www.ne.gov/agriculture/hemp',
    'https://agriculture.ne.gov/hemp'
  ,
    'https://www.nebraska.gov/',
    'https://legislature.nebraska.gov',
    'https://nda.nebraska.gov/hemp',
    'https://www.nebraska.gov/',
    'https://legislature.nebraska.gov',
    'https://nda.nebraska.gov/hemp',
    'https://www.nebraska.gov/',
    'https://legislature.nebraska.gov',
    'https://nda.nebraska.gov/hemp'], 
   regulationPages: [
    'https://nda.nebraska.gov/agriculture/hemp/',
    'https://nda.nebraska.gov/agriculture/',
    'https://agr.nebraska.gov/hemp',
    'https://nda.nebraska.gov/hemp/',
    'https://nda.nebraska.gov/hemp/regulations',
    'https://nda.nebraska.gov/hemp/rules',
    'https://www.ne.gov/laws-regulations/hemp'
  ] 
},
'NV': { 
   agency: 'https://ccb.nv.gov', 
   agencyName: 'Nevada Cannabis Compliance Board', 
   rssFeeds: [], 
   newsPages: [
    'https://www.agri.nv.gov/news/',
    'https://www.agri.nv.gov/Programs/Industrial_Hemp/news/',
    'https://www.nv.gov/governor/news/',
    'https://www.nv.gov/governor/',
    'https://ccb.nv.gov/news-events',
    'https://www.leg.state.nv.us',
    'https://agri.nv.gov/Programs/Industrial_Hemp',
    'https://agri.nv.gov/Programs/Industrial_Hemp/news',
    'https://www.nv.gov/agriculture/hemp',
    'https://agriculture.nv.gov/hemp'
  ,
    'https://www.leg.state.nv.us',
    'https://agri.nv.gov/Programs/Industrial_Hemp',
    'https://agri.nv.gov/Programs/Industrial_Hemp/news',
    'https://www.leg.state.nv.us',
    'https://agri.nv.gov/Programs/Industrial_Hemp',
    'https://agri.nv.gov/Programs/Industrial_Hemp/news',
    'https://www.leg.state.nv.us',
    'https://agri.nv.gov/Programs/Industrial_Hemp',
    'https://agri.nv.gov/Programs/Industrial_Hemp/news'], 
   regulationPages: [
    'https://www.agri.nv.gov/Programs/Industrial_Hemp/',
    'https://www.agri.nv.gov/Programs/',
    'https://www.agri.nv.gov/',
    'https://ccb.nv.gov/public-notices',
    'https://agri.nv.gov/Programs/Industrial_Hemp/',
    'https://agri.nv.gov/Programs/Industrial_Hemp/regulations',
    'https://agri.nv.gov/Programs/Industrial_Hemp/rules',
    'https://www.nv.gov/laws-regulations/hemp'
  ] 
},
'ND': {
  agency: 'https://www.ndda.nd.gov/',
  agencyName: 'North Dakota Department of Agriculture',
  rssFeeds: [],
  newsPages: [
    'https://www.ndda.nd.gov/news/',
    'https://www.ndda.nd.gov/agriculture/hemp/news/',
    'https://www.nd.gov/governor/news/',
'https://www.ndda.nd.gov/news',
    'https://www.ndda.nd.gov/industrial-hemp',
    'https://www.nd.gov/governor/news',
    'https://www.ndda.nd.gov/agriculture-news',
    'https://www.nd.gov/governor/newsroom',
    'https://www.ndda.nd.gov/newsroom',
    'https://www.nd.gov/agriculture/news',
    'https://www.ndda.nd.gov/agriculture-news'
  ,
    'https://www.ndda.nd.gov/news/',
    'https://www.nd.gov/governor/news/',
    'https://www.ndda.nd.gov/news',
    'https://www.nd.gov/governor/news',
    'https://www.nd.gov/governor/newsroom',
    'https://www.ndda.nd.gov/news/',
    'https://www.nd.gov/governor/news/',
    'https://www.ndda.nd.gov/news',
    'https://www.nd.gov/governor/news',
    'https://www.nd.gov/governor/newsroom',
    'https://www.ndda.nd.gov/news/',
    'https://www.nd.gov/governor/news/',
    'https://www.ndda.nd.gov/news',
    'https://www.nd.gov/governor/news',
    'https://www.nd.gov/governor/newsroom'],
  regulationPages: [
    'https://www.ndda.nd.gov/agriculture/hemp/',
    'https://www.ndda.nd.gov/agriculture/',
'https://www.ndda.nd.gov/industrial-hemp/regulations',
    'https://www.nd.gov/laws-regulations/hemp',
    'https://www.ndda.nd.gov/agricultural-rules',
    'https://www.nd.gov/hemp-program',
    'https://www.ndda.nd.gov/hemp-businesses',
    'https://www.ndda.nd.gov/agriculture-businesses',
    'https://www.ndda.nd.gov/hemp-rules',
    'https://www.ndda.nd.gov/agriculture-rules'
  ]
},
'NH': {
  agency: 'https://www.dhhs.nh.gov/programs-services/population-health/therapeutic-cannabis',
  agencyName: 'New Hampshire Department of Health and Human Services - Therapeutic Cannabis Program',
  rssFeeds: [],
  newsPages: [],
  regulationPages: []
},
'NJ': {
  agency: 'https://www.nj.gov/cannabis/',
  agencyName: 'New Jersey Cannabis Regulatory Commission',
  rssFeeds: [],
  newsPages: [
    'https://www.nj.gov/agriculture/news/',
    'https://www.nj.gov/agriculture/hemp/news/',
    'https://www.nj.gov/governor/news/',
'https://www.nj.gov/cannabis/news/',
    'https://www.nj.gov/agriculture/divisions/pi/hemp',
    'https://www.nj.gov/agriculture/divisions/pi/hemp/news',
    'https://www.nj.gov/agriculture/hemp',
    'https://agriculture.nj.gov/hemp',
    'https://www.nj.gov/governor/news',
    'https://www.nj.gov/agriculture/news',
    'https://www.nj.gov/governor/news',
    'https://www.nj.gov/agriculture/news',
    'https://www.nj.gov/health/news',
    'https://www.nj.gov/cannabis/news'
  ,
    'https://www.nj.gov/agriculture/news/',
    'https://www.nj.gov/cannabis/news/',
    'https://www.nj.gov/agriculture/news',
    'https://www.nj.gov/agriculture/news',
    'https://www.nj.gov/health/news',
    'https://www.nj.gov/cannabis/news',
    'https://www.nj.gov/agriculture/news/',
    'https://www.nj.gov/cannabis/news/',
    'https://www.nj.gov/agriculture/news',
    'https://www.nj.gov/agriculture/news',
    'https://www.nj.gov/health/news',
    'https://www.nj.gov/cannabis/news',
    'https://www.nj.gov/agriculture/news/',
    'https://www.nj.gov/cannabis/news/',
    'https://www.nj.gov/agriculture/news',
    'https://www.nj.gov/agriculture/news',
    'https://www.nj.gov/health/news',
    'https://www.nj.gov/cannabis/news'],
  regulationPages: [
    'https://www.nj.gov/agriculture/plant-industry/',
    'https://www.nj.gov/agriculture/hemp/',
'https://www.nj.gov/cannabis/resources/cannabis-laws/',
    'https://www.nj.gov/agriculture/divisions/pi/hemp/',
    'https://www.nj.gov/agriculture/divisions/pi/hemp/regulations',
    'https://www.nj.gov/agriculture/divisions/pi/hemp/rules',
    'https://www.nj.gov/laws-regulations/hemp',
    'https://www.nj.gov/agriculture/rules',
    'https://www.nj.gov/cannabis/rules',
    'https://www.nj.gov/cannabis/businesses',
    'https://www.nj.gov/cannabis/consumers',
    'https://www.nj.gov/agriculture/hemp-rules',
    'https://www.nj.gov/cannabis/rules-regulations'
  ]
},

'NM': {
  agency: 'https://www.rld.nm.gov/cannabis/',
  agencyName: 'New Mexico Regulation & Licensing Department – Cannabis Control Division',
  rssFeeds: [],
  newsPages: [
    'https://www.nmda.nmsu.edu/news/',
    'https://www.nmda.nmsu.edu/agriculture/hemp/news/',
    'https://www.newmexico.gov/governor/news/',
    'https://www.newmexico.gov/governor/',
    'https://www.newmexico.gov/',
    'https://www.rld.nm.gov/news/',
    'https://www.nmda.nmsu.edu/hemp',
    'https://www.nmda.nmsu.edu/hemp/news',
    'https://www.nm.gov/agriculture/hemp',
    'https://agriculture.nm.gov/hemp'
  ,
    'https://www.newmexico.gov/governor/news/',
    'https://www.newmexico.gov/governor/',
    'https://www.newmexico.gov/',
    'https://www.rld.nm.gov/news/',
    'https://www.newmexico.gov/governor/news/',
    'https://www.newmexico.gov/governor/',
    'https://www.newmexico.gov/',
    'https://www.rld.nm.gov/news/',
    'https://www.newmexico.gov/governor/news/',
    'https://www.newmexico.gov/governor/',
    'https://www.newmexico.gov/',
    'https://www.rld.nm.gov/news/'],
  regulationPages: [
    'https://www.nmda.nmsu.edu/agriculture/hemp/',
    'https://www.nmda.nmsu.edu/agriculture/',
    'https://www.rld.nm.gov/cannabis/rules-and-regulations/',
    'https://www.nmda.nmsu.edu/hemp/',
    'https://www.nmda.nmsu.edu/hemp/regulations',
    'https://www.nmda.nmsu.edu/hemp/rules',
    'https://www.nm.gov/laws-regulations/hemp'
  ]
},

'NY': {
  agency: 'https://cannabis.ny.gov/',
  agencyName: 'New York Office of Cannabis Management',
  rssFeeds: [],
  newsPages: [
    'https://www.agriculture.ny.gov/news/',
    'https://www.agriculture.ny.gov/plant-industry/hemp/news/',
    'https://www.ny.gov/governor/press-releases/',
'https://cannabis.ny.gov/pressroom',
    'https://agriculture.ny.gov/hemp',
    'https://agriculture.ny.gov/hemp/news',
    'https://www.ny.gov/agriculture/hemp',
    'https://agriculture.ny.gov/hemp',
    'https://www.ny.gov/governor/press-releases',
    'https://agriculture.ny.gov/news-releases',
    'https://www.ny.gov/governor/press-releases',
    'https://agriculture.ny.gov/newsroom',
    'https://www.ny.gov/health/news',
    'https://cannabis.ny.gov/newsroom'
  ,
    'https://cannabis.ny.gov/pressroom',
    'https://agriculture.ny.gov/hemp',
    'https://agriculture.ny.gov/hemp',
    'https://cannabis.ny.gov/pressroom',
    'https://agriculture.ny.gov/hemp',
    'https://agriculture.ny.gov/hemp',
    'https://cannabis.ny.gov/pressroom',
    'https://agriculture.ny.gov/hemp',
    'https://agriculture.ny.gov/hemp'],
  regulationPages: [
    'https://www.agriculture.ny.gov/plant-industry/hemp/',
    'https://www.agriculture.ny.gov/plant-industry/',
    'https://www.agriculture.ny.gov/',
'https://cannabis.ny.gov/marihuana-regulation-and-taxation-act-mrta',
    'https://agriculture.ny.gov/hemp',
    'https://agriculture.ny.gov/hemp/regulations',
    'https://agriculture.ny.gov/hemp/rules',
    'https://www.ny.gov/laws-regulations/hemp',
    'https://cannabis.ny.gov/rules',
    'https://agriculture.ny.gov/hemp-rules',
    'https://cannabis.ny.gov/businesses',
    'https://cannabis.ny.gov/consumers',
    'https://agriculture.ny.gov/hemp-regulations',
    'https://cannabis.ny.gov/rules-codes'
  ]
},

'OH': {
  agency: 'https://cannabis.ohio.gov/',
  agencyName: 'Ohio Division of Cannabis Control',
  rssFeeds: [],
  newsPages: [
'https://cannabis.ohio.gov/news',
    'https://www.legislature.ohio.gov',
    'https://agri.ohio.gov/divs/plant/seed-hemp',
    'https://agri.ohio.gov/divs/plant/seed-hemp/news',
    'https://www.oh.gov/agriculture/hemp',
    'https://agriculture.oh.gov/hemp',
    'https://governor.ohio.gov/news',
    'https://agri.ohio.gov/news',
    'https://governor.ohio.gov/wps/portal/gov/governor/media/news',
    'https://agri.ohio.gov/wps/portal/gov/agri/go-and-do/news',
    'https://cannabis.ohio.gov/wps/portal/gov/cannabis/news',
    'https://www.oh.gov/governor/press-releases'
  ,
    'https://agri.ohio.gov/divs/plant/seed-hemp',
    'https://agri.ohio.gov/divs/plant/seed-hemp/news',
    'https://governor.ohio.gov/news',
    'https://agri.ohio.gov/news',
    'https://governor.ohio.gov/wps/portal/gov/governor/media/news',
    'https://agri.ohio.gov/wps/portal/gov/agri/go-and-do/news',
    'https://agri.ohio.gov/divs/plant/seed-hemp',
    'https://agri.ohio.gov/divs/plant/seed-hemp/news',
    'https://governor.ohio.gov/news',
    'https://agri.ohio.gov/news',
    'https://governor.ohio.gov/wps/portal/gov/governor/media/news',
    'https://agri.ohio.gov/wps/portal/gov/agri/go-and-do/news',
    'https://agri.ohio.gov/divs/plant/seed-hemp',
    'https://agri.ohio.gov/divs/plant/seed-hemp/news',
    'https://governor.ohio.gov/news',
    'https://agri.ohio.gov/news',
    'https://governor.ohio.gov/wps/portal/gov/governor/media/news',
    'https://agri.ohio.gov/wps/portal/gov/agri/go-and-do/news'],
  regulationPages: [
'https://cannabis.ohio.gov/rules',
    'https://agri.ohio.gov/divs/plant/seed-hemp',
    'https://agri.ohio.gov/divs/plant/seed-hemp/regulations',
    'https://agri.ohio.gov/divs/plant/seed-hemp/rules',
    'https://www.oh.gov/laws-regulations/hemp',
    'https://cannabis.ohio.gov/licensing',
    'https://agri.ohio.gov/hemp-rules',
    'https://cannabis.ohio.gov/businesses',
    'https://agri.ohio.gov/hemp-businesses',
    'https://cannabis.ohio.gov/rules',
    'https://agri.ohio.gov/hemp-rules'
  ]
},

'OK': {
  agency: 'https://oklahoma.gov/omma.html',
  agencyName: 'Oklahoma Medical Marijuana Authority',
  rssFeeds: [],
  newsPages: [
    'https://oklahoma.gov/omma/news.html',
    'https://www.oklegislature.gov',
    'https://www.oda.ok.gov/hemp',
    'https://www.oda.ok.gov/hemp/news',
    'https://www.ok.gov/agriculture/hemp',
    'https://agriculture.ok.gov/hemp'
  ,
    'https://www.oklegislature.gov',
    'https://www.oklegislature.gov',
    'https://www.oklegislature.gov'],
  regulationPages: [
    'https://oklahoma.gov/omma/rules.html',
    'https://www.oda.ok.gov/hemp',
    'https://www.oda.ok.gov/hemp/regulations',
    'https://www.oda.ok.gov/hemp/rules',
    'https://www.ok.gov/laws-regulations/hemp'
  ]
},

'OR': {
  agency: 'https://www.oregon.gov/olcc/',
  agencyName: 'Oregon Liquor and Cannabis Commission',
  rssFeeds: [],
  newsPages: [
    'https://www.oregon.gov/olcc/Pages/News.aspx',
    'https://www.oregon.gov/governor/news',
    'https://www.oregon.gov/news'
  ],
  regulationPages: [
    'https://www.oregon.gov/olcc/marijuana/Pages/Recreational-Marijuana-Laws-and-Rules.aspx',
    'https://www.oregon.gov/ODA/programs/Hemp/Pages/default.aspx',
    'https://www.oregon.gov/olcc/rules'
  ]
},

'PA': {
  agency: 'https://www.health.pa.gov/topics/programs/Medical%20Marijuana',
  agencyName: 'Pennsylvania Department of Health – Medical Marijuana Program',
  rssFeeds: [],
  newsPages: [
    'https://www.agriculture.pa.gov/news/',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/news/',
    'https://www.pa.gov/governor/news/',
    'https://www.pa.gov/governor/',
'https://www.health.pa.gov/topics/healthcare/Pages/News.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx/news',
    'https://www.pa.gov/agriculture/hemp',
    'https://agriculture.pa.gov/hemp',
    'https://www.agriculture.pa.gov/news',
    'https://www.agriculture.pa.gov/press-releases'
  ,
    'https://www.agriculture.pa.gov/news/',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/news/',
    'https://www.pa.gov/governor/',
    'https://www.health.pa.gov/topics/healthcare/Pages/News.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx/news',
    'https://agriculture.pa.gov/hemp',
    'https://www.agriculture.pa.gov/news',
    'https://www.agriculture.pa.gov/press-releases',
    'https://www.agriculture.pa.gov/news/',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/news/',
    'https://www.pa.gov/governor/',
    'https://www.health.pa.gov/topics/healthcare/Pages/News.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx/news',
    'https://agriculture.pa.gov/hemp',
    'https://www.agriculture.pa.gov/news',
    'https://www.agriculture.pa.gov/press-releases',
    'https://www.agriculture.pa.gov/news/',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/news/',
    'https://www.pa.gov/governor/',
    'https://www.health.pa.gov/topics/healthcare/Pages/News.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx/news',
    'https://agriculture.pa.gov/hemp',
    'https://www.agriculture.pa.gov/news',
    'https://www.agriculture.pa.gov/press-releases'],
  regulationPages: [
'https://www.health.pa.gov/topics/programs/Medical%20Marijuana/Pages/Regulations.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx/regulations',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx/rules',
    'https://www.pa.gov/laws-regulations/hemp',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp',
    'https://www.health.pa.gov/topics/programs/Medical%20Marijuana'
  ]
},
'RI': {
  agency: 'https://ccc.ri.gov/',
  agencyName: 'Rhode Island Cannabis Control Commission',
  rssFeeds: [],
  newsPages: [],
  regulationPages: []
},
'SC': {
  agency: 'https://agriculture.sc.gov/divisions/consumer-protection/hemp/',
  agencyName: 'South Carolina Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://www.clemson.edu/cafls/news/',
    'https://www.clemson.edu/cafls/hemp/news/',
    'https://www.sc.gov/governor/news/',
'https://agriculture.sc.gov/news/',
    'https://www.clemson.edu/cafls/hemp',
    'https://www.clemson.edu/cafls/hemp/news',
    'https://www.sc.gov/agriculture/hemp',
    'https://agriculture.sc.gov/hemp',
    'https://governor.sc.gov/news',
    'https://agriculture.sc.gov/newsroom',
    'https://governor.sc.gov/newsroom',
    'https://agriculture.sc.gov/newsroom',
    'https://www.sc.gov/agriculture/news',
    'https://www.sc.gov/governor/news'
  ,
    'https://www.clemson.edu/cafls/news/',
    'https://www.clemson.edu/cafls/hemp/news/',
    'https://agriculture.sc.gov/news/',
    'https://www.clemson.edu/cafls/hemp',
    'https://www.clemson.edu/cafls/hemp/news',
    'https://agriculture.sc.gov/hemp',
    'https://governor.sc.gov/news',
    'https://www.clemson.edu/cafls/news/',
    'https://www.clemson.edu/cafls/hemp/news/',
    'https://agriculture.sc.gov/news/',
    'https://www.clemson.edu/cafls/hemp',
    'https://www.clemson.edu/cafls/hemp/news',
    'https://agriculture.sc.gov/hemp',
    'https://governor.sc.gov/news',
    'https://www.clemson.edu/cafls/news/',
    'https://www.clemson.edu/cafls/hemp/news/',
    'https://agriculture.sc.gov/news/',
    'https://www.clemson.edu/cafls/hemp',
    'https://www.clemson.edu/cafls/hemp/news',
    'https://agriculture.sc.gov/hemp',
    'https://governor.sc.gov/news'],
  regulationPages: [
'https://www.scstatehouse.gov/code/t46c055.php',
    'https://www.clemson.edu/cafls/hemp/',
    'https://www.clemson.edu/cafls/hemp/regulations',
    'https://www.clemson.edu/cafls/hemp/rules',
    'https://www.sc.gov/laws-regulations/hemp',
    'https://agriculture.sc.gov/hemp-program',
    'https://agriculture.sc.gov/plant-industries',
    'https://agriculture.sc.gov/hemp-businesses',
    'https://agriculture.sc.gov/plant-businesses',
    'https://agriculture.sc.gov/hemp-rules',
    'https://agriculture.sc.gov/plant-rules'
  ]
},

'NC': {
  agency: 'https://www.ncagr.gov/divisions/plant-industry/hemp-nc',
  agencyName: 'North Carolina Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://www.ncagr.gov/divisions/public-affairs/news-roundup',
    'https://www.ncagr.gov/divisions/plant-industry/hemp-nc',
    'https://governor.nc.gov/news',
    'https://www.ncagr.gov/news'
  ],
  regulationPages: [
    'https://www.ncagr.gov/divisions/plant-industry/hemp-nc',
    'https://www.ams.usda.gov/rules-regulations/hemp',
    'https://www.ams.usda.gov/rules-regulations/hemp/information-producers',
    'https://www.ams.usda.gov/rules-regulations/hemp/HempLawsandRegulations'
  ]
},

'SD': {
  agency: 'https://medcannabis.sd.gov/',
  agencyName: 'South Dakota Department of Health – Medical Cannabis Program',
  rssFeeds: [],
  newsPages: [
    'https://sddps.gov/news/',
    'https://sddps.gov/agriculture/hemp/news/',
    'https://www.sd.gov/governor/news/',
'https://medcannabis.sd.gov/Updates/News.aspx',
    'https://sddps.gov/hemp',
    'https://sddps.gov/hemp/news',
    'https://www.sd.gov/agriculture/hemp',
    'https://agriculture.sd.gov/hemp',
    'https://www.sd.gov/press-releases',
    'https://www.sd.gov/announcements',
    'https://sddps.gov/newsroom',
    'https://www.sd.gov/governor/news',
    'https://sddps.gov/newsroom',
    'https://medcannabis.sd.gov/newsroom',
    'https://www.sd.gov/governor/news',
    'https://www.sd.gov/agriculture/news'
  ,
    'https://www.sd.gov/governor/news/',
    'https://www.sd.gov/agriculture/hemp',
    'https://www.sd.gov/press-releases',
    'https://www.sd.gov/announcements',
    'https://www.sd.gov/governor/news',
    'https://www.sd.gov/governor/news',
    'https://www.sd.gov/agriculture/news',
    'https://www.sd.gov/governor/news/',
    'https://www.sd.gov/agriculture/hemp',
    'https://www.sd.gov/press-releases',
    'https://www.sd.gov/announcements',
    'https://www.sd.gov/governor/news',
    'https://www.sd.gov/governor/news',
    'https://www.sd.gov/agriculture/news',
    'https://www.sd.gov/governor/news/',
    'https://www.sd.gov/agriculture/hemp',
    'https://www.sd.gov/press-releases',
    'https://www.sd.gov/announcements',
    'https://www.sd.gov/governor/news',
    'https://www.sd.gov/governor/news',
    'https://www.sd.gov/agriculture/news'],
  regulationPages: [
    'https://sddps.gov/agriculture/hemp/',
    'https://sddps.gov/agriculture/',
'https://medcannabis.sd.gov/About/Laws.aspx',
    'https://sdlegislature.gov/Statutes/34-20G',
    'https://sddps.gov/hemp/',
    'https://sddps.gov/hemp/regulations',
    'https://sddps.gov/hemp/rules',
    'https://www.sd.gov/laws-regulations/hemp',
    'https://www.sd.gov/regulations',
    'https://www.sd.gov/rules',
    'https://www.sd.gov/laws',
    'https://sddps.gov/agricultural-rules',
    'https://medcannabis.sd.gov/rules',
    'https://sddps.gov/hemp-businesses',
    'https://medcannabis.sd.gov/businesses',
    'https://sddps.gov/hemp-rules',
    'https://medcannabis.sd.gov/rules'
  ]
},

'TN': {
  agency: 'https://www.tn.gov/agriculture/businesses/hemp.html',
  agencyName: 'Tennessee Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://www.tn.gov/agriculture/news/',
    'https://www.tn.gov/agriculture/businesses/hemp/news/',
    'https://www.tn.gov/governor/news/',
    'https://www.tn.gov/governor/',
    'https://www.tn.gov/news',
    'https://wapp.capitol.tn.gov',
    'https://www.tn.gov/agriculture/businesses/hemp.html/news',
    'https://www.tn.gov/agriculture/hemp',
    'https://agriculture.tn.gov/hemp'
  ,
    'https://www.tn.gov/agriculture/news/',
    'https://www.tn.gov/governor/news/',
    'https://www.tn.gov/governor/',
    'https://wapp.capitol.tn.gov',
    'https://www.tn.gov/agriculture/businesses/hemp.html/news',
    'https://www.tn.gov/governor/',
    'https://www.tn.gov/news',
    'https://wapp.capitol.tn.gov',
    'https://www.tn.gov/agriculture/businesses/hemp.html/news',
    'https://www.tn.gov/agriculture/news/',
    'https://www.tn.gov/governor/news/',
    'https://www.tn.gov/governor/',
    'https://wapp.capitol.tn.gov',
    'https://www.tn.gov/agriculture/businesses/hemp.html/news'],
  regulationPages: [
    'https://www.tn.gov/agriculture/businesses/hemp/',
    'https://www.tn.gov/agriculture/businesses/hemp.html',
    'https://www.tn.gov/agriculture/businesses/hemp.html/regulations',
    'https://www.tn.gov/agriculture/businesses/hemp.html/rules',
    'https://www.tn.gov/laws-regulations/hemp'
  ]
},

'TX': {
  agency: 'https://www.dshs.texas.gov/consumable-hemp-program',
  agencyName: 'Texas Department of State Health Services – Consumable Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://www.texasagriculture.gov/news/',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp/news/',
    'https://www.texas.gov/governor/news/',
    'https://www.texas.gov/governor/',
'https://www.dshs.texas.gov/news-alerts',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx/news',
    'https://www.tx.gov/agriculture/hemp',
    'https://agriculture.tx.gov/hemp',
    'https://www.texasagriculture.gov/news',
    'https://www.texasagriculture.gov/press-releases',
    'https://gov.texas.gov/news',
    'https://www.texas.gov/news',
    'https://gov.texas.gov/business/page/agriculture-news',
    'https://www.texas.gov/business/agriculture',
    'https://www.texas.gov/health/cannabis-news',
    'https://www.texasagriculture.gov/about/news'
  ,
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp/news/',
    'https://www.dshs.texas.gov/news-alerts',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx/news',
    'https://gov.texas.gov/news',
    'https://www.texasagriculture.gov/about/news',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp/news/',
    'https://www.dshs.texas.gov/news-alerts',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx/news',
    'https://www.texasagriculture.gov/about/news',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp/news/',
    'https://www.dshs.texas.gov/news-alerts',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx/news',
    'https://gov.texas.gov/news',
    'https://www.texasagriculture.gov/about/news'],
  regulationPages: [
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp/',
'https://www.dshs.texas.gov/consumable-hemp-program',
    'https://texasagriculture.gov/Regulatory-Programs/Hemp',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx/regulations',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx/rules',
    'https://www.tx.gov/laws-regulations/hemp',
    'https://www.texasagriculture.gov/Regulatory-Programs/Hemp',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp-Regulations',
    'https://www.texas.gov/cannabis',
    'https://www.texas.gov/hemp-regulations',
    'https://www.texasagriculture.gov/businesses/hemp',
    'https://www.texasagriculture.gov/consumers/hemp',
    'https://www.texasagriculture.gov/hemp-rules',
    'https://www.texas.gov/cannabis-regulations'
  ]
},

'UT': {
  agency: 'https://medicalcannabis.utah.gov/',
  agencyName: 'Utah Department of Health & Human Services – Medical Cannabis Program',
  rssFeeds: [],
  newsPages: [
    'https://ag.utah.gov/news/',
    'https://ag.utah.gov/plant/hemp/news/',
    'https://www.utah.gov/governor/news/',
    'https://www.utah.gov/governor/',
    'https://www.utah.gov/',
    'https://medicalcannabis.utah.gov/news/',
    'https://le.utah.gov',
    'https://ag.utah.gov/hemp',
    'https://ag.utah.gov/hemp/news',
    'https://www.ut.gov/agriculture/hemp',
    'https://agriculture.ut.gov/hemp'
  ,
    'https://ag.utah.gov/news/',
    'https://ag.utah.gov/plant/hemp/news/',
    'https://www.utah.gov/governor/news/',
    'https://www.utah.gov/governor/',
    'https://www.utah.gov/',
    'https://le.utah.gov',
    'https://ag.utah.gov/hemp',
    'https://ag.utah.gov/hemp/news',
    'https://ag.utah.gov/news/',
    'https://ag.utah.gov/plant/hemp/news/',
    'https://www.utah.gov/governor/news/',
    'https://www.utah.gov/governor/',
    'https://www.utah.gov/',
    'https://le.utah.gov',
    'https://ag.utah.gov/hemp',
    'https://ag.utah.gov/hemp/news',
    'https://ag.utah.gov/news/',
    'https://ag.utah.gov/plant/hemp/news/',
    'https://www.utah.gov/governor/news/',
    'https://www.utah.gov/governor/',
    'https://www.utah.gov/',
    'https://le.utah.gov',
    'https://ag.utah.gov/hemp',
    'https://ag.utah.gov/hemp/news'],
  regulationPages: [
    'https://ag.utah.gov/plant/hemp/',
    'https://ag.utah.gov/plant/',
    'https://medicalcannabis.utah.gov/laws-and-rules/',
    'https://ag.utah.gov/hemp/',
    'https://ag.utah.gov/hemp/regulations',
    'https://ag.utah.gov/hemp/rules',
    'https://www.ut.gov/laws-regulations/hemp'
  ]
},

'VA': {
  agency: 'https://www.cca.virginia.gov/',
  agencyName: 'Virginia Cannabis Control Authority',
  rssFeeds: [],
  newsPages: [
    'https://www.vdacs.virginia.gov/news/',
    'https://www.vdacs.virginia.gov/agriculture/hemp/news/',
    'https://www.virginia.gov/governor/news/',
    'https://www.virginia.gov/governor/',
    'https://www.virginia.gov/',
'https://www.cca.virginia.gov/news',
    'https://www.vdacs.virginia.gov/hemp.shtml',
    'https://www.vdacs.virginia.gov/hemp.shtml/news',
    'https://www.va.gov/agriculture/hemp',
    'https://agriculture.va.gov/hemp',
    'https://www.governor.virginia.gov/news',
    'https://www.vdacs.virginia.gov/news',
    'https://www.governor.virginia.gov/newsroom',
    'https://www.vdacs.virginia.gov/newsroom',
    'https://www.cca.virginia.gov/newsroom',
    'https://www.va.gov/agriculture/news'
  ,
    'https://www.virginia.gov/',
    'https://www.cca.virginia.gov/news',
    'https://www.governor.virginia.gov/newsroom',
    'https://www.virginia.gov/',
    'https://www.cca.virginia.gov/news',
    'https://www.governor.virginia.gov/newsroom',
    'https://www.virginia.gov/',
    'https://www.cca.virginia.gov/news',
    'https://www.governor.virginia.gov/newsroom'],
  regulationPages: [
    'https://www.vdacs.virginia.gov/agriculture/hemp/',
    'https://www.vdacs.virginia.gov/agriculture/',
'https://www.cca.virginia.gov/regulations',
    'https://www.vdacs.virginia.gov/hemp.shtml',
    'https://www.vdacs.virginia.gov/hemp.shtml/regulations',
    'https://www.vdacs.virginia.gov/hemp.shtml/rules',
    'https://www.va.gov/laws-regulations/hemp',
    'https://www.cca.virginia.gov/cannabis-rules',
    'https://www.vdacs.virginia.gov/hemp-rules',
    'https://www.cca.virginia.gov/businesses',
    'https://www.vdacs.virginia.gov/hemp-businesses',
    'https://www.cca.virginia.gov/rules',
    'https://www.vdacs.virginia.gov/hemp-rules'
  ]
},

'VT': {
  agency: 'https://ccb.vermont.gov/',
  agencyName: 'Vermont Cannabis Control Board',
  rssFeeds: [
    'https://ccb.vermont.gov/feed'
  ],
  newsPages: [
'https://ccb.vermont.gov/news',
    'https://legislature.vermont.gov',
    'https://agriculture.vermont.gov/hemp',
    'https://agriculture.vermont.gov/hemp/news',
    'https://www.vt.gov/agriculture/hemp',
    'https://agriculture.vt.gov/hemp',
    'https://agriculture.vermont.gov/newsroom',
    'https://www.vt.gov/governor/news',
    'https://agriculture.vermont.gov/newsroom',
    'https://ccb.vermont.gov/newsroom',
    'https://www.vt.gov/governor/news',
    'https://www.vt.gov/agriculture/news'
  ,
    'https://ccb.vermont.gov/feed',
    'https://ccb.vermont.gov/news',
    'https://legislature.vermont.gov',
    'https://agriculture.vermont.gov/hemp',
    'https://agriculture.vermont.gov/hemp/news',
    'https://agriculture.vermont.gov/newsroom',
    'https://agriculture.vermont.gov/newsroom',
    'https://ccb.vermont.gov/newsroom',
    'https://ccb.vermont.gov/feed',
    'https://ccb.vermont.gov/news',
    'https://legislature.vermont.gov',
    'https://agriculture.vermont.gov/hemp',
    'https://agriculture.vermont.gov/hemp/news',
    'https://agriculture.vermont.gov/newsroom',
    'https://agriculture.vermont.gov/newsroom',
    'https://ccb.vermont.gov/newsroom',
    'https://ccb.vermont.gov/feed',
    'https://ccb.vermont.gov/news',
    'https://legislature.vermont.gov',
    'https://agriculture.vermont.gov/hemp',
    'https://agriculture.vermont.gov/hemp/news',
    'https://agriculture.vermont.gov/newsroom',
    'https://agriculture.vermont.gov/newsroom',
    'https://ccb.vermont.gov/newsroom'],
  regulationPages: [
'https://ccb.vermont.gov/rules',
    'https://agriculture.vermont.gov/hemp',
    'https://agriculture.vermont.gov/hemp/regulations',
    'https://agriculture.vermont.gov/hemp/rules',
    'https://www.vt.gov/laws-regulations/hemp',
    'https://agriculture.vermont.gov/rules',
    'https://ccb.vermont.gov/cannabis-rules',
    'https://agriculture.vermont.gov/hemp-businesses',
    'https://ccb.vermont.gov/businesses',
    'https://agriculture.vermont.gov/hemp-rules',
    'https://ccb.vermont.gov/rules'
  ]
},

'WA': {
  agency: 'https://lcb.wa.gov/',
  agencyName: 'Washington State Liquor and Cannabis Board',
  rssFeeds: [],
  newsPages: [
    'https://www.agr.wa.gov/news/',
    'https://www.agr.wa.gov/lcb/hemp/news/',
    'https://www.wa.gov/governor/news/',
'https://lcb.wa.gov/pressreleases',
    'https://agr.wa.gov/hemp',
    'https://agr.wa.gov/hemp/news',
    'https://www.wa.gov/agriculture/hemp',
    'https://agriculture.wa.gov/hemp',
    'https://lcb.wa.gov/news',
    'https://lcb.wa.gov/press-releases',
    'https://lcb.wa.gov/announcements',
    'https://www.wa.gov/governor/press-releases',
    'https://www.wa.gov/agriculture/news',
    'https://www.wa.gov/commerce/news',
    'https://lcb.wa.gov/about-us/news-events'
  ,
    'https://www.agr.wa.gov/news/',
    'https://lcb.wa.gov/pressreleases',
    'https://www.agr.wa.gov/news/',
    'https://lcb.wa.gov/pressreleases',
    'https://www.agr.wa.gov/news/',
    'https://lcb.wa.gov/pressreleases'],
  regulationPages: [
    'https://www.agr.wa.gov/lcb/hemp/',
    'https://www.agr.wa.gov/lcb/',
    'https://www.agr.wa.gov/',
'https://lcb.wa.gov/laws/laws-and-rules',
    'https://agr.wa.gov/hemp/',
    'https://agr.wa.gov/hemp/regulations',
    'https://agr.wa.gov/hemp/rules',
    'https://www.wa.gov/laws-regulations/hemp',
    'https://lcb.wa.gov/licensing',
    'https://lcb.wa.gov/rules',
    'https://lcb.wa.gov/cannabis-rules',
    'https://lcb.wa.gov/marijuana/cannabis-business-license',
    'https://lcb.wa.gov/hemp/hemp-license',
    'https://lcb.wa.gov/rules/cannabis-rules',
    'https://lcb.wa.gov/rules/hemp-rules'
  ]
},

'WI': {
  agency: 'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx',
  agencyName: 'Wisconsin Department of Agriculture, Trade and Consumer Protection – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://www.wisconsin.gov/datcp/news/',
    'https://www.wisconsin.gov/datcp/agriculture/hemp/news/',
    'https://www.wisconsin.gov/governor/news/',
    'https://www.wisconsin.gov/governor/',
    'https://www.wisconsin.gov/',
'https://datcp.wi.gov/Pages/News_Media/News.aspx',
    'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx/news',
    'https://www.wi.gov/agriculture/hemp',
    'https://agriculture.wi.gov/hemp',
    'https://datcp.wi.gov/Pages/Newsroom/News.aspx',
    'https://datcp.wi.gov/Pages/Newsroom/PressReleases.aspx'
  ,
    'https://www.wisconsin.gov/',
    'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx/news',
    'https://www.wisconsin.gov/',
    'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx/news',
    'https://www.wisconsin.gov/',
    'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx/news'],
  regulationPages: [
    'https://www.wisconsin.gov/datcp/agriculture/hemp/',
    'https://www.wisconsin.gov/datcp/agriculture/',
    'https://www.wisconsin.gov/datcp/',
'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx',
    'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx/regulations',
    'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx/rules',
    'https://www.wi.gov/laws-regulations/hemp',
    'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx',
    'https://datcp.wi.gov/Pages/Programs_Services/HempRules.aspx'
  ]
},

'WV': {
  agency: 'https://omc.wv.gov/',
  agencyName: 'West Virginia Office of Medical Cannabis',
  rssFeeds: [],
  newsPages: [
    'https://omc.wv.gov/news',
    'https://agriculture.wv.gov/Divisions/Plant/Ag_Industries/hemp/Pages/default.aspx',
    'https://agriculture.wv.gov/Divisions/Plant/Ag_Industries/hemp/Pages/default.aspx/news',
    'https://www.wv.gov/agriculture/hemp',
    'https://agriculture.wv.gov/hemp'
  ,
    'https://omc.wv.gov/news',
    'https://agriculture.wv.gov/hemp',
    'https://omc.wv.gov/news',
    'https://agriculture.wv.gov/hemp',
    'https://omc.wv.gov/news',
    'https://agriculture.wv.gov/hemp'],
  regulationPages: [
    'https://omc.wv.gov/rules/Pages/default.aspx',
    'https://code.wvlegislature.gov/16A/',
    'https://agriculture.wv.gov/Divisions/Plant/Ag_Industries/hemp/Pages/default.aspx',
    'https://agriculture.wv.gov/Divisions/Plant/Ag_Industries/hemp/Pages/default.aspx/regulations',
    'https://agriculture.wv.gov/Divisions/Plant/Ag_Industries/hemp/Pages/default.aspx/rules',
    'https://www.wv.gov/laws-regulations/hemp'
  ]
},

'WY': {
  agency: 'https://agriculture.wy.gov/divisions/hemp',
  agencyName: 'Wyoming Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://www.wyo.gov/agriculture/news/',
    'https://www.wyo.gov/agriculture/plant/hemp/news/',
    'https://www.wyo.gov/governor/news/',
    'https://www.wyo.gov/governor/',
    'https://www.wyo.gov/',
'https://agriculture.wy.gov/news',
    'https://governor.wy.gov/news',
    'https://www.wy.gov/governor/news',
    'https://governor.wy.gov/newsroom',
    'https://agriculture.wy.gov/newsroom',
    'https://www.wy.gov/governor/news',
    'https://www.wy.gov/agriculture/news'
  ,
    'https://www.wyo.gov/',
    'https://agriculture.wy.gov/news',
    'https://governor.wy.gov/news',
    'https://governor.wy.gov/newsroom',
    'https://www.wyo.gov/',
    'https://agriculture.wy.gov/news',
    'https://governor.wy.gov/news',
    'https://governor.wy.gov/newsroom',
    'https://www.wyo.gov/',
    'https://agriculture.wy.gov/news',
    'https://governor.wy.gov/news',
    'https://governor.wy.gov/newsroom'],
  regulationPages: [
    'https://www.wyo.gov/agriculture/plant/hemp/',
    'https://www.wyo.gov/agriculture/plant/',
    'https://www.wyo.gov/agriculture/',
'https://agriculture.wy.gov/divisions/hemp',
    'https://agriculture.wy.gov/plant-industries',
    'https://agriculture.wy.gov/agricultural-rules',
    'https://agriculture.wy.gov/hemp-businesses',
    'https://agriculture.wy.gov/plant-businesses',
    'https://agriculture.wy.gov/hemp-rules',
    'https://agriculture.wy.gov/plant-rules'
  ]
}
   
};

const DOCUMENT_TYPES = [
  'regulation', 'proposed_rule', 'final_rule', 'guidance', 'bulletin',
  'memo', 'press_release', 'announcement', 'enforcement_action',
  'license_update', 'policy_change', 'public_notice', 'emergency_rule', 'advisory'
];

function parseRSSFeed(xml: string, baseUrl: string): Array<{title: string; link: string; description: string; pubDate: string; guid: string}> {
  const items: Array<any> = [];
  try {
    const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    for (const itemXml of itemMatches) {
      const title = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
      const link = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || '';
      const description = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || '';
      const pubDate = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || '';
      const guid = itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1]?.trim() || link;
      if (title && link) {
        items.push({
          title: decodeHTMLEntities(title),
          link: link.startsWith('http') ? link : new URL(link, baseUrl).href,
          description: decodeHTMLEntities(stripHTML(description).substring(0, 1000)),
          pubDate,
          guid: guid || link
        });
      }
    }
    if (items.length === 0) {
      const entryMatches = xml.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi) || [];
      for (const entryXml of entryMatches) {
        const title = entryXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
        const link = entryXml.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] || '';
        const summary = entryXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1]?.trim() || '';
        const published = entryXml.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1]?.trim() || '';
        const id = entryXml.match(/<id[^>]*>([\s\S]*?)<\/id>/i)?.[1]?.trim() || link;
        if (title && link) {
          items.push({
            title: decodeHTMLEntities(title),
            link: link.startsWith('http') ? link : new URL(link, baseUrl).href,
            description: decodeHTMLEntities(stripHTML(summary).substring(0, 1000)),
            pubDate: published,
            guid: id || link
          });
        }
      }
    }
  } catch (e) { console.error('RSS parsing error:', e); }
  return items;
}

function parseNewsPage(html: string, baseUrl: string): Array<{title: string; link: string; description: string; pubDate: string}> {
  const items: Array<any> = [];
  try {
    const patterns = [
      /<article[^>]*>[\s\S]*?<\/article>/gi,
      /<div[^>]*class="[^"]*(?:news|post|article|announcement|bulletin|update|press-release|release)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      /<li[^>]*class="[^"]*(?:news|post|item|update)[^"]*"[^>]*>[\s\S]*?<\/li>/gi,
      /<tr[^>]*>[\s\S]*?<\/tr>/gi
    ];
    const seenLinks = new Set<string>();
    for (const pattern of patterns) {
      const matches = html.match(pattern) || [];
      for (const match of matches) {
        const linkMatch = match.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
        if (!linkMatch) continue;
        let link = linkMatch[1];
        if (!link.startsWith('http')) {
          try { link = new URL(link, baseUrl).href; } catch { continue; }
        }
        if (seenLinks.has(link)) continue;
        seenLinks.add(link);
        let title = stripHTML(linkMatch[2]).trim();
        if (!title || title.length < 5) {
          const headingMatch = match.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
          title = headingMatch ? stripHTML(headingMatch[1]).trim() : '';
        }
        if (!title || title.length < 5) continue;
        if (/^(home|about|contact|menu|nav|skip|search|login|sign|directory|job|careers|employment|public.records|privacy|terms|conditions|accessibility|facebook|twitter|instagram|youtube|linkedin|social|media|contact.us|meet.the|priorities|newsletter|newsroom|commissioner|meet.the.commissioner|press.releases|proclamations|executive.orders|submit.a.request|request.an.award|attendance|employee.portal|farmland.preservation|board.of.agriculture|boards.and.commissions|ncdacs.at.a.glance|website.feedback|disclaimer|open.budget|see.all)/i.test(title)) continue;
        
        // Exclude navigation/program pages based on URL patterns
        if (/\/(divisions|programs|services|departments|offices|about|contact|directory|jobs|careers|employment|public.records|privacy|terms|conditions|accessibility|social|media|newsroom|newsletter|priorities|meet|commissioner|press-releases|proclamations|executive-orders|request|submit|attendance|intranet|adfp|boards|departmentataglance|webform|disclaimer|open-budget)\//i.test(link)) continue;
        
        // Exclude short titles that look like menu items
        if (title.length < 10 && !/\d{4}/.test(title)) continue;
        
        // Prefer links that contain news/announcement keywords in URL
        const isLikelyNews = /\/(news|announcements?|press|bulletins?|updates?|alerts?|notices?)\//i.test(link) || 
                            /(news|announcement|press|bulletin|update|alert|notice)/i.test(title);
        
        // If we have many items and this doesn't look like news, skip it
        if (items.length >= 10 && !isLikelyNews && !/\d{4}/.test(title)) continue;
        const descMatch = match.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
        const description = descMatch ? stripHTML(descMatch[1]).trim().substring(0, 500) : '';
        const dateMatch = match.match(/(?:posted|published|date|updated)[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/i)
          || match.match(/<time[^>]*datetime=["']([^"']+)["']/i)
          || match.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
        const pubDate = dateMatch ? stripHTML(dateMatch[1]).trim() : '';
        items.push({ title: decodeHTMLEntities(title), link, description: decodeHTMLEntities(description), pubDate });
      }
      if (items.length >= 20) break;
    }
  } catch (e) { console.error('HTML parsing error:', e); }
  return items;
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#39;': "'", '&nbsp;': ' ', '&ndash;': '-', '&mdash;': '—',
    '&rsquo;': "'", '&lsquo;': "'", '&rdquo;': '"', '&ldquo;': '"'
  };
  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}

// TEMPORARY STUB: Use default analysis during lite testing
function getDefaultAnalysis(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();

  // Enhanced hemp and cannabinoid detection
  const hempKeywords = /\b(hemp|industrial hemp|cbd|cbda|thca|delta.?8|delta.?9|delta.?10|thc.?p|hhc|cannabinoid|cannabinoids|hemp.?derived|hemp.?based|farm bill|2018 farm bill)\b/i;
  const cannabisKeywords = /\b(cannabis|marijuana|medical cannabis|recreational cannabis|thc|tetrahydrocannabinol|mmj)\b/i;

  // Determine primary category
  let category = 'other';
  let sub_category = 'general';

  if (hempKeywords.test(text)) {
    category = 'hemp';
    if (/\b(thca|delta.?8|delta.?9|delta.?10|thc.?p|hhc)\b/i.test(text)) {
      sub_category = 'novel_cannabinoids';
    } else if (/\b(cbd|cbda|hemp.?derived)\b/i.test(text)) {
      sub_category = 'cbd_hemp';
    } else if (/\b(farm bill|2018 farm bill|industrial hemp)\b/i.test(text)) {
      sub_category = 'farm_bill';
    } else {
      sub_category = 'general_hemp';
    }
  } else if (cannabisKeywords.test(text)) {
    category = 'cannabis';
    if (/\b(medical|mmj|patient|doctor|prescription)\b/i.test(text)) {
      sub_category = 'medical';
    } else if (/\b(recreational|adult.?use|retail)\b/i.test(text)) {
      sub_category = 'adult_use';
    } else {
      sub_category = 'general_cannabis';
    }
  }

  let documentType = 'announcement';
  if (text.includes('proposed') && text.includes('rule')) documentType = 'proposed_rule';
  else if (text.includes('final') && text.includes('rule')) documentType = 'final_rule';
  else if (text.includes('regulation') || text.includes('regulatory')) documentType = 'regulation';
  else if (text.includes('guidance') || text.includes('guidelines')) documentType = 'guidance';
  else if (text.includes('bulletin')) documentType = 'bulletin';
  else if (text.includes('memo') || text.includes('memorandum')) documentType = 'memo';
  else if (text.includes('enforcement') || text.includes('violation') || text.includes('penalty')) documentType = 'enforcement_action';
  else if (text.includes('license') || text.includes('licensing') || text.includes('permit')) documentType = 'license_update';
  else if (text.includes('policy')) documentType = 'policy_change';
  else if (text.includes('notice')) documentType = 'public_notice';
  else if (text.includes('emergency')) documentType = 'emergency_rule';
  else if (text.includes('press release') || text.includes('press-release')) documentType = 'press_release';
  else if (text.includes('advisory')) documentType = 'advisory';
  else if (text.includes('testing') || text.includes('lab') || text.includes('potency')) documentType = 'testing_requirements';
  else if (text.includes('tax') || text.includes('revenue')) documentType = 'tax_policy';

  // Enhanced topic detection for hemp and cannabinoids
  const isDispensaryRelated = /dispensary|dispensaries|retail|storefront|mmtc|treatment center|dispensary|apothecary/i.test(text);
  const isLicensingRelated = /license|licensing|application|permit|renewal|lottery|registration|certification/i.test(text);
  const isComplianceRelated = /compliance|requirement|regulation|rule|violation|inspection|audit|monitoring/i.test(text);
  const isHempRelated = hempKeywords.test(text);
  const isCannabisRelated = cannabisKeywords.test(text);
  const isNovelCannabinoidRelated = /\b(thca|delta.?8|delta.?9|delta.?10|thc.?p|hhc|cannabinoid|cannabinoids)\b/i.test(text);
  const isFederalRelated = /federal|dea|fda|usda|farm bill|controlled substances|schedule|drug enforcement/i.test(text);
  const isStateRelated = /state|department|agency|commission|board|division/i.test(text);

  let urgency = 'medium';
  if (text.includes('emergency') || text.includes('immediate') || text.includes('urgent') || text.includes('recall')) urgency = 'critical';
  else if (text.includes('deadline') || text.includes('required') || text.includes('mandatory') || text.includes('compliance date')) urgency = 'high';
  else if (text.includes('update') || text.includes('reminder') || text.includes('extension')) urgency = 'low';

  const topics: string[] = [];
  if (isDispensaryRelated) topics.push('dispensary');
  if (isLicensingRelated) topics.push('licensing');
  if (isComplianceRelated) topics.push('compliance');
  if (isHempRelated) topics.push('hemp');
  if (isCannabisRelated) topics.push('cannabis');
  if (isNovelCannabinoidRelated) topics.push('novel_cannabinoids');
  if (/\b(thca|tetrahydrocannabinolic acid)\b/i.test(text)) topics.push('thca');
  if (/\b(delta.?8|delta-8)\b/i.test(text)) topics.push('delta_8');
  if (/\b(delta.?9|delta-9)\b/i.test(text)) topics.push('delta_9');
  if (/\b(delta.?10|delta-10)\b/i.test(text)) topics.push('delta_10');
  if (/\b(thc.?p|thcp)\b/i.test(text)) topics.push('thcp');
  if (/\b(hhc|hexahydrocannabinol)\b/i.test(text)) topics.push('hhc');
  if (/\b(cbd|cbda|cannabidiol)\b/i.test(text)) topics.push('cbd');
  if (isFederalRelated) topics.push('federal');
  if (isStateRelated) topics.push('state');
  if (text.includes('testing') || text.includes('lab')) topics.push('testing');
  if (text.includes('tax') || text.includes('revenue')) topics.push('taxation');
  if (text.includes('export') || text.includes('import')) topics.push('trade');
  if (text.includes('research') || text.includes('study')) topics.push('research');

  return {
    documentType,
    category,
    sub_category,
    summary: description?.substring(0, 200) || title,
    relevanceScore: 0.5 + (isDispensaryRelated ? 0.2 : 0) + (isLicensingRelated ? 0.15 : 0) + (isComplianceRelated ? 0.15 : 0) + (isHempRelated ? 0.2 : 0) + (isNovelCannabinoidRelated ? 0.25 : 0) + (isFederalRelated ? 0.1 : 0),
    topics,
    isDispensaryRelated,
    isLicensingRelated,
    isComplianceRelated,
    isHempRelated,
    isCannabisRelated,
    isNovelCannabinoidRelated,
    isFederalRelated,
    isStateRelated,
    urgency
  };
}

async function fetchWithRetry(url: string, retries = 2): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        console.log(`Fetch success for ${url}: ${response.status}`);
        return await response.text();
      }
      console.log(`Fetch failed for ${url}: ${response.status}`);
    } catch (e: any) {
      console.log(`Fetch error for ${url}: ${e.message}`);
      if (i === retries) return null;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

// @ts-ignore - Deno global for Supabase Edge Functions
Deno.serve(async (req: Request) => {
  const requestCorsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: requestCorsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { stateCode, fullScan = false, sessionId, sourceName } = body;

    // Ensure we have a valid UUID session id for DB operations. If the caller
    // provided an invalid value (for example a placeholder like "test-quick-<uuid>"),
    // generate a proper UUID server-side so upserts won't fail.
    let session_id = sessionId;
    try {
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!session_id || !uuidRegex.test(session_id)) {
        session_id = crypto.randomUUID();
        console.log('Generated session_id:', session_id);
      }
    } catch (e) {
      // Fallback: generate with crypto.randomUUID (Deno provides this)
      try {
        session_id = crypto.randomUUID();
      } catch (_) {
        session_id = String(Date.now());
      }
      console.log('Fallback generated session_id:', session_id);
    }

    // @ts-ignore - Deno global for Supabase Edge Functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // Prefer non-SUPABASE alias used in CI/Dashboard, then the official service role env,
    // then runtime alias `Supabase_API_Public`, and finally the anon key.
    // Order: `SERVICE_ROLE_KEY` -> `SUPABASE_SERVICE_ROLE_KEY` -> `Supabase_API_Public` -> `SUPABASE_ANON_KEY`.
    // Do NOT commit secrets to the repo.
    // @ts-ignore - Deno global for Supabase Edge Functions
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('Supabase_API_Public') || Deno.env.get('SUPABASE_ANON_KEY');
    // @ts-ignore - Deno global for Supabase Edge Functions
    const keySource = Deno.env.get('SERVICE_ROLE_KEY')
      // @ts-ignore - Deno global for Supabase Edge Functions
      ? 'service_role_alias_SERVICE_ROLE_KEY'
      // @ts-ignore - Deno global for Supabase Edge Functions
      : (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'service_role_SUPABASE_SERVICE_ROLE_KEY' : (Deno.env.get('Supabase_API_Public') ? 'alias_Supabase_API_Public' : (Deno.env.get('SUPABASE_ANON_KEY') ? 'anon' : 'none')));

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing SUPABASE_URL or SUPABASE keys. Ensure SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY is set.');
      return new Response(JSON.stringify({ success: false, error: 'Missing SUPABASE_URL or SUPABASE keys. Ensure SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY is set.' }), {
        status: 500,
        headers: { ...requestCorsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If only an anon key is available, fail loudly — anon keys cannot perform writes under RLS.
    if (keySource === 'anon') {
      console.error('Refusing to run poller with anon key: writes will be rejected by RLS. Map a service role secret (SERVICE_ROLE_KEY) in the project.');
      return new Response(JSON.stringify({ success: false, error: 'Server requires a Supabase service role key (SERVICE_ROLE_KEY). Do not use anon key for writes.' }), {
        status: 403,
        headers: { ...requestCorsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log which key source is being used (do not log the key value itself)
    console.log('Using Supabase key source for DB operations:', keySource);

    const supabase = createClient(supabaseUrl, supabaseKey.trim());

    // basic counters and error collection (moved earlier so updateProgress can reference it)
    let recordsProcessed = 0;
    let newItemsFound = 0;
    const errors: string[] = [];
    const recentItems: any[] = [];

    const updateProgress = async (updates: any) => {
      if (session_id && sourceName) {
        const row = {
          session_id: session_id,
          source_name: sourceName,
          ...updates
        };
        const { data: pgData, error: pgError } = await supabase.from('data_population_progress').upsert(row, { onConflict: ['session_id', 'source_name'] });
        if (pgError) {
          console.error('data_population_progress upsert error:', pgError);
          errors.push(`progress_upsert:${pgError.message}`);
        }
        return pgData;
      }
      return null;
    };

    await updateProgress({ status: 'running', started_at: new Date().toISOString() });

    const { data: jurisdictions, error: jurisdictionsErr } = await supabase.from('jurisdiction').select('id, name, code').neq('code', 'US');
    if (jurisdictionsErr) {
      console.error('jurisdiction query error:', jurisdictionsErr);
      errors.push(`jurisdiction:${jurisdictionsErr.message}`);
    }

    const statesToProcess = stateCode
      ? Object.entries(STATE_CANNABIS_SOURCES).filter(([code]) => code === stateCode)
      : Object.entries(STATE_CANNABIS_SOURCES); // Process all states for full scan

    // Add timeout protection - if no stateCode specified, limit processing time
    const startTime = Date.now();
    const maxProcessingTime = stateCode ? 30000 : 120000; // 30s for single state, 2min for multi-state

    const { data: existingItems, error: existingItemsErr } = await supabase
      .from('instrument')
      .select('external_id')
      .in('source', ['state_rss', 'state_news', 'state_regulations']);
    if (existingItemsErr) {
      console.error('existingItems query error:', existingItemsErr);
      errors.push(`existing_items:${existingItemsErr.message}`);
    }

    const existingIds = new Set((existingItems || []).map((i: { external_id: string }) => i.external_id));

    // Processing limits
    const maxItemsPerState = stateCode ? 50 : 25; // More items for single state requests, reasonable for multi-state
    let totalItemsProcessed = 0;

    for (const [code, sources] of statesToProcess) {
      // Check if we've exceeded processing time
      if (Date.now() - startTime > maxProcessingTime) {
        console.log(`Processing timeout reached after ${Date.now() - startTime}ms, stopping at state ${code}`);
        break;
      }

      console.log(`Processing state: ${code} (${sources.agencyName})`);
      const jurisdiction = jurisdictions?.find((j: { id: string; name: string; code: string }) => j.code === code);
      if (!jurisdiction) {
        console.log(`No jurisdiction found for ${code}, skipping`);
        continue;
      }

      // RSS Feeds
      for (const feedUrl of sources.rssFeeds) {
        if (totalItemsProcessed >= maxItemsPerState) break;
        try {
          const xml = await fetchWithRetry(feedUrl);
          if (xml) {
            const items = parseRSSFeed(xml, sources.agency);
            for (const item of items) {
              if (totalItemsProcessed >= maxItemsPerState) break;
              const externalId = `${code}-rss-${btoa(item.guid || item.link).substring(0, 50)}`;
              const isNew = !existingIds.has(externalId);
              if (!isNew && !fullScan) { recordsProcessed++; continue; }

              const analysis = await analyzeWithOpenAI(item.title, item.description || '', sources.agencyName, code);
              let effectiveDate = new Date().toISOString().split('T')[0];
              if (item.pubDate) {
                try {
                  const d = new Date(item.pubDate);
                  if (!isNaN(d.getTime())) effectiveDate = d.toISOString().split('T')[0];
                } catch {}
              }

              const { data: upsertData, error: upsertErr } = await supabase.from('instrument').upsert({
                external_id: externalId,
                title: item.title.substring(0, 500),
                description: analysis.summary || item.description?.substring(0, 2000),
                effective_date: effectiveDate,
                jurisdiction_id: jurisdiction.id,
                source: 'state_rss',
                url: item.link,
                category: analysis.category || 'cannabis',
                sub_category: analysis.sub_category || 'other',
                updated_at: new Date().toISOString(),
                metadata: {
                  ...analysis,
                  agencyName: sources.agencyName,
                  sourceType: 'rss',
                  feedUrl,
                  analyzedAt: new Date().toISOString()
                }
              }, { onConflict: 'external_id' });
              if (upsertErr) {
                console.error('instrument upsert error (rss):', upsertErr);
                errors.push(`${code} instrument_upsert_rss:${upsertErr.message}`);
              }
              recordsProcessed++;
              if (isNew) {
                newItemsFound++;
                existingIds.add(externalId);
                recentItems.push({
                  state: code,
                  title: item.title,
                  type: analysis.documentType,
                  urgency: analysis.urgency,
                  isNew: true,
                  link: item.link
                });
              }
              totalItemsProcessed++;
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        } catch (e: any) {
          errors.push(`${code} RSS ${feedUrl}: ${e.message}`);
        }
      }

      // News Pages
      for (const newsUrl of sources.newsPages) {
        if (totalItemsProcessed >= maxItemsPerState) break;
        try {
          const html = await fetchWithRetry(newsUrl);
          if (html) {
            const items = parseNewsPage(html, sources.agency);
            for (const item of items) {
              if (totalItemsProcessed >= maxItemsPerState) break;
              const externalId = `${code}-news-${btoa(item.link).substring(0, 50)}`;
              const isNew = !existingIds.has(externalId);
              if (!isNew && !fullScan) { recordsProcessed++; continue; }

              const analysis = await analyzeWithOpenAI(item.title, item.description || '', sources.agencyName, code);

              let effectiveDate = new Date().toISOString().split('T')[0];
              if (item.pubDate) {
                try {
                  const d = new Date(item.pubDate);
                  if (!isNaN(d.getTime())) effectiveDate = d.toISOString().split('T')[0];
                } catch {}
              }

              const { data: upsertData2, error: upsertErr2 } = await supabase.from('instrument').upsert({
                external_id: externalId,
                title: item.title.substring(0, 500),
                description: analysis.summary || item.description?.substring(0, 2000),
                effective_date: effectiveDate,
                jurisdiction_id: jurisdiction.id,
                source: 'state_news',
                url: item.link,
                category: analysis.category || 'cannabis',
                sub_category: analysis.sub_category || 'other',
                updated_at: new Date().toISOString(),
                metadata: {
                  ...analysis,
                  agencyName: sources.agencyName,
                  sourceType: 'news',
                  newsPageUrl: newsUrl,
                  analyzedAt: new Date().toISOString()
                }
              }, { onConflict: 'external_id' });
              if (upsertErr2) {
                console.error('instrument upsert error (news):', upsertErr2);
                errors.push(`${code} instrument_upsert_news:${upsertErr2.message}`);
              }
              recordsProcessed++;
              if (isNew) {
                newItemsFound++;
                existingIds.add(externalId);
                recentItems.push({
                  state: code,
                  title: item.title,
                  type: analysis.documentType,
                  urgency: analysis.urgency,
                  isNew: true,
                  link: item.link
                });
              }
              totalItemsProcessed++;
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        } catch (e: any) {
          errors.push(`${code} news ${newsUrl}: ${e.message}`);
        }
      }

      await updateProgress({
        records_fetched: recordsProcessed,
        metadata: { newItemsFound, statesProcessed: code }
      });
    }

    const { data: ingestionData, error: ingestionErr } = await supabase.from('ingestion_log').insert({
      source: 'state_regulations_lite',
      status: errors.length === 0 ? 'success' : (errors.length < statesToProcess.length ? 'partial' : 'error'),
      records_fetched: recordsProcessed,
      metadata: {
        newItemsFound,
        statesProcessed: statesToProcess.length,
        errors: errors.slice(0, 10),
        recentItems: recentItems.slice(0, 20),
        fullScan,
        stateCode: stateCode || 'all'
      }
    });
    if (ingestionErr) {
      console.error('ingestion_log insert error:', ingestionErr);
      errors.push(`ingestion_log:${ingestionErr.message}`);
    }

    await updateProgress({
      status: 'completed',
      records_fetched: recordsProcessed,
      completed_at: new Date().toISOString(),
      metadata: { newItemsFound, errors }
    });

    return new Response(JSON.stringify({
      success: true,
      recordsProcessed,
      newItemsFound,
      statesProcessed: statesToProcess.length,
      errors: errors.slice(0, 10),
      recentItems: recentItems.slice(0, 20)
    }), {
      headers: { ...requestCorsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Poller lite error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...requestCorsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function analyzeWithOpenAI(
  title: string,
  description: string,
  agencyName: string,
  stateCode: string
): Promise<{
  documentType: string;
  category: string;
  sub_category: string;
  summary: string;
  relevanceScore: number;
  topics: string[];
  isDispensaryRelated: boolean;
  isLicensingRelated: boolean;
  isComplianceRelated: boolean;
  urgency: string;
}> {
  // @ts-ignore - Deno global for Supabase Edge Functions
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    console.log('No OpenAI key — falling back to default analysis');
    return getDefaultAnalysis(title, description);
  }

  try {
    // Build a Headers object and coerce all values to strings so Deno's
    // WebIDL conversion to ByteString cannot fail (some runtimes reject non-strings).
    const rawHeaders: Record<string, any> = {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json'
    };
    const safeHeaders = new Headers();
    for (const [k, v] of Object.entries(rawHeaders)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        safeHeaders.set(k, v.map(String).join(', '));
      } else {
        safeHeaders.set(k, String(v));
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: safeHeaders,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a cannabis regulatory analyst specializing in hemp, THC, and CBD. Analyze news items from state agencies for operators in the alternative wellness space. Return JSON with:
documentType (one of: ${DOCUMENT_TYPES.join(', ')}),
category ('cannabis' or 'hemp'),
sub_category (one of: 'medical', 'adult-use', 'hemp-derived', 'THC', 'CBD', 'other'),
summary (1-2 sentences),
relevanceScore (0-1),
topics (array, max 5),
isDispensaryRelated (bool),
isLicensingRelated (bool),
isComplianceRelated (bool),
urgency (low/medium/high/critical). Return ONLY valid JSON.`
          },
          {
            role: 'user',
            content: `Analyze this ${stateCode} cannabis/hemp item from ${agencyName}:\n\nTitle: ${title}\n\nDescription: ${description || 'No description'}\n\nReturn only valid JSON.`
          }
        ],
        temperature: 0.3,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      console.log(`OpenAI API error: ${response.status} ${response.statusText}`);
      return getDefaultAnalysis(title, description);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        documentType: DOCUMENT_TYPES.includes(parsed.documentType) ? parsed.documentType : 'announcement',
        category: ['cannabis', 'hemp'].includes(parsed.category) ? parsed.category : 'cannabis',
        sub_category: ['medical', 'adult-use', 'hemp-derived', 'THC', 'CBD', 'other'].includes(parsed.sub_category)
          ? parsed.sub_category
          : 'other',
        summary: parsed.summary || description?.substring(0, 200) || title,
        relevanceScore: Math.min(1, Math.max(0, parsed.relevanceScore || 0.5)),
        topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 5) : [],
        isDispensaryRelated: Boolean(parsed.isDispensaryRelated),
        isLicensingRelated: Boolean(parsed.isLicensingRelated),
        isComplianceRelated: Boolean(parsed.isComplianceRelated),
        urgency: ['low', 'medium', 'high', 'critical'].includes(parsed.urgency) ? parsed.urgency : 'medium'
      };
    } else {
      console.log('No valid JSON from OpenAI');
      return getDefaultAnalysis(title, description);
    }
  } catch (e) {
    console.error('OpenAI error:', e);
    return getDefaultAnalysis(title, description);
  }
}

