export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // or 'https://www.thynkflow.io' change for prod
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const STATE_CANNABIS_SOURCES: Record<string, {
  agency: string;
  agencyName: string;
  rssFeeds: string[];
  newsPages: string[];
  regulationPages: string[];
}> = {
'AL': {
  agency: 'https://amcc.alabama.gov/',
  agencyName: 'Alabama Medical Cannabis Commission',
  rssFeeds: [],
  newsPages: [
    'https://www.alabama.gov/newsroom',
    'https://www.legislature.state.al.us',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx/news',
    'https://www.al.gov/agriculture/hemp',
    'https://agriculture.al.gov/hemp'
  ],
  regulationPages: [
    'https://amcc.alabama.gov/rules/',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx/regulations',
    'https://www.agi.alabama.gov/divisions/Regulatory/hemp.aspx/rules',
    'https://www.al.gov/laws-regulations/hemp'
  ]
},

'AK': {
  agency: 'https://www.commerce.alaska.gov/web/cbpl/Marijuana.aspx',
  agencyName: 'Alaska Marijuana Control Board',
  rssFeeds: [],
  newsPages: [
    'https://www.alaska.gov/news',
    'https://legislature.ak.gov/news.php',
    'https://www.commerce.alaska.gov/web/cbpl/Hemp.aspx',
    'https://www.commerce.alaska.gov/web/cbpl/Hemp.aspx/news',
    'https://www.ak.gov/agriculture/hemp',
    'https://agriculture.ak.gov/hemp'
  ],
  regulationPages: [
    'https://www.commerce.alaska.gov/web/cbpl/Marijuana/StatutesRegulations.aspx',
    'https://www.commerce.alaska.gov/web/cbpl/Hemp.aspx',
    'https://www.commerce.alaska.gov/web/cbpl/Hemp.aspx/regulations',
    'https://www.commerce.alaska.gov/web/cbpl/Hemp.aspx/rules',
    'https://www.ak.gov/laws-regulations/hemp'
  ]
},

'AZ': {
  agency: 'https://www.azdhs.gov/licensing/marijuana/',
  agencyName: 'Arizona Department of Health Services – Marijuana Program',
  rssFeeds: [],
  newsPages: [
    'https://www.azdhs.gov/news/',
    'https://agriculture.az.gov/hemp',
    'https://agriculture.az.gov/hemp/news',
    'https://www.az.gov/agriculture/hemp',
    'https://agriculture.az.gov/hemp'
  ],
  regulationPages: [
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
  newsPages: [
    'https://www.arkansas.gov/news',
    'https://www.arkansas.gov/governor/news',
    'https://www.agriculture.arkansas.gov/divisions/plant-industries/hemp',
    'https://www.agriculture.arkansas.gov/divisions/plant-industries/hemp/news',
    'https://www.ar.gov/agriculture/hemp',
    'https://agriculture.ar.gov/hemp'
  ],
  regulationPages: [
    'https://www.arkansas.gov/amcc/rules-regulations/',
    'https://www.agriculture.arkansas.gov/divisions/plant-industries/hemp',
    'https://www.agriculture.arkansas.gov/divisions/plant-industries/hemp/regulations',
    'https://www.agriculture.arkansas.gov/divisions/plant-industries/hemp/rules',
    'https://www.ar.gov/laws-regulations/hemp'
  ]
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
  ],
  regulationPages: [
    'https://www.cannabis.ca.gov/cannabis-laws/dcc-regulations/',
    'https://www.cdfa.ca.gov/plant/industrialhemp/',
    'https://www.cdfa.ca.gov/plant/industrialhemp/regulations',
    'https://www.cdfa.ca.gov/plant/industrialhemp/rules',
    'https://www.ca.gov/laws-regulations/hemp'
  ]
},

'CO': {
  agency: 'https://sbg.colorado.gov/marijuana',
  agencyName: 'Colorado Marijuana Enforcement Division',
  rssFeeds: [],
  newsPages: [
    'https://legislature.colorado.gov',
    'https://www.colorado.gov/news',
    'https://www.colorado.gov/pacific/agriculture/hemp',
    'https://www.colorado.gov/pacific/agriculture/hemp/news',
    'https://www.co.gov/agriculture/hemp',
    'https://agriculture.co.gov/hemp'
  ],
  regulationPages: [
    'https://legislature.colorado.gov',
    'https://www.colorado.gov/pacific/agriculture/hemp',
    'https://www.colorado.gov/pacific/agriculture/hemp/regulations',
    'https://www.colorado.gov/pacific/agriculture/hemp/rules',
    'https://www.co.gov/laws-regulations/hemp'
  ]
},

'CT': {
  agency: 'https://portal.ct.gov/dcp/cannabis',
  agencyName: 'Connecticut Department of Consumer Protection – Cannabis',
  rssFeeds: [],
  newsPages: [
    'https://www.ct.gov/news',
    'https://legislature.ct.gov',
    'https://portal.ct.gov/doag/program/hemp',
    'https://portal.ct.gov/doag/program/hemp/news',
    'https://www.ct.gov/agriculture/hemp',
    'https://agriculture.ct.gov/hemp'
  ],
  regulationPages: [
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
    'https://agriculture.de.gov/hemp'
  ],
  regulationPages: [
    'https://omc.delaware.gov/regulations/',
    'https://dda.delaware.gov/hemp/',
    'https://dda.delaware.gov/hemp/regulations',
    'https://dda.delaware.gov/hemp/rules',
    'https://www.de.gov/laws-regulations/hemp'
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
    'https://agriculture.fl.gov/hemp'
  ],
  regulationPages: [
    'https://knowthefactsmmj.com/about/',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp/regulations',
    'https://www.fdacs.gov/Agriculture-Industry/Hemp/rules',
    'https://www.fl.gov/laws-regulations/hemp'
  ]
},

'GA': {
  agency: 'https://www.gmcc.ga.gov/',
  agencyName: 'Georgia Access to Medical Cannabis Commission',
  rssFeeds: [],
  newsPages: [
    'https://www.gmcc.ga.gov/news',
    'https://gov.georgia.gov/press-releases'
  ],
  regulationPages: [
    'https://www.gmcc.ga.gov/regulations'
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
    'https://agriculture.hi.gov/hemp'
  ],
  regulationPages: [
    'https://health.hawaii.gov/medicalcannabis/statutes-rules/',
    'https://hdoa.hawaii.gov/hemp/',
    'https://hdoa.hawaii.gov/hemp/regulations',
    'https://hdoa.hawaii.gov/hemp/rules',
    'https://www.hi.gov/laws-regulations/hemp'
  ]
},

'ID': {
  agency: 'https://agri.idaho.gov/main/hemp/',
  agencyName: 'Idaho State Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://agri.idaho.gov/news/',
    'https://www.agri.idaho.gov/main/hemp',
    'https://www.agri.idaho.gov/main/hemp/news',
    'https://www.id.gov/agriculture/hemp',
    'https://agriculture.id.gov/hemp'
  ],
  regulationPages: [
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
  newsPages: [
    'https://www.in.gov/news',
    'https://iga.in.gov/legislative/',
    'https://www.in.gov/isda/divisions/plant-industries/hemp',
    'https://www.in.gov/isda/divisions/plant-industries/hemp/news',
    'https://www.in.gov/agriculture/hemp',
    'https://agriculture.in.gov/hemp'
  ],
  regulationPages: [
    'https://www.in.gov/cannabis/',
    'https://www.in.gov/isda/divisions/plant-industries/hemp/',
    'https://www.in.gov/isda/divisions/plant-industries/hemp/regulations',
    'https://www.in.gov/isda/divisions/plant-industries/hemp/rules',
    'https://www.in.gov/laws-regulations/hemp'
  ]
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
  ],
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
    'https://agriculture.ks.gov/news',
    'https://www.kslegislature.org',
    'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp/news',
    'https://www.ks.gov/agriculture/hemp',
    'https://agriculture.ks.gov/hemp'
  ],
  regulationPages: [
    'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp',
    'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp/regulations',
    'https://agriculture.ks.gov/divisions-programs/plant-protection-and-weed-control/hemp/rules',
    'https://www.ks.gov/laws-regulations/hemp'
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
  ],
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
  newsPages: [
    'https://www.ldaf.state.la.us/newsroom',
    'https://legislature.la.gov',
    'https://www.ldaf.state.la.us/agricultural-commodities/hemp',
    'https://www.ldaf.state.la.us/agricultural-commodities/hemp/news',
    'https://www.la.gov/agriculture/hemp',
    'https://agriculture.la.gov/hemp'
  ],
  regulationPages: [
    'https://www.ldaf.state.la.us/medical-marijuana/regulations/',
    'https://www.ldaf.state.la.us/agricultural-commodities/hemp',
    'https://www.ldaf.state.la.us/agricultural-commodities/hemp/regulations',
    'https://www.ldaf.state.la.us/agricultural-commodities/hemp/rules',
    'https://www.la.gov/laws-regulations/hemp'
  ]
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
    'https://agriculture.me.gov/hemp'
  ],
  regulationPages: [
    'https://www.maine.gov/dafs/ocp/rules-statutes',
    'https://www.maine.gov/agriculture/hemp/',
    'https://www.maine.gov/agriculture/hemp/regulations',
    'https://www.maine.gov/agriculture/hemp/rules',
    'https://www.me.gov/laws-regulations/hemp'
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
  ],
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
    'https://agriculture.ma.gov/hemp'
  ], 
   regulationPages: [
    'https://masscannabiscontrol.com/public-documents/regulations',
    'https://www.mass.gov/hemp',
    'https://www.mass.gov/hemp/regulations',
    'https://www.mass.gov/hemp/rules',
    'https://www.ma.gov/laws-regulations/hemp'
  ] 
},
'MI': { 
   agency: 'https://www.michigan.gov/cra', 
   agencyName: 'Michigan Cannabis Regulatory Agency', 
   rssFeeds: [], 
   newsPages: [
    'https://www.michigan.gov/news',
    'https://legislature.mi.gov',
    'https://www.michigan.gov/mda/0,4601,7-125-1569_2802_2805---,00.html',
    'https://www.michigan.gov/mda/0,4601,7-125-1569_2802_2805---,00.html/news',
    'https://www.mi.gov/agriculture/hemp',
    'https://agriculture.mi.gov/hemp'
  ], 
   regulationPages: [
    'https://www.michigan.gov/cra/about/rules',
    'https://www.michigan.gov/mda/0,4601,7-125-1569_2802_2805---,00.html',
    'https://www.michigan.gov/mda/0,4601,7-125-1569_2802_2805---,00.html/regulations',
    'https://www.michigan.gov/mda/0,4601,7-125-1569_2802_2805---,00.html/rules',
    'https://www.mi.gov/laws-regulations/hemp'
  ] 
},
'MN': { 
   agency: 'https://mn.gov/ocm', 
   agencyName: 'Minnesota Office of Cannabis Management', 
   rssFeeds: [], 
   newsPages: [
    'https://mn.gov/ocm/media/news-releases/',
    'https://www.mda.state.mn.us/hemp',
    'https://www.mda.state.mn.us/hemp/news',
    'https://www.mn.gov/agriculture/hemp',
    'https://agriculture.mn.gov/hemp'
  ], 
   regulationPages: [
    'https://mn.gov/ocm/laws/',
    'https://mn.gov/ocm/laws/rulemaking.jsp',
    'https://www.revisor.mn.gov/rules/9810/',
    'https://www.mda.state.mn.us/hemp',
    'https://www.mda.state.mn.us/hemp/regulations',
    'https://www.mda.state.mn.us/hemp/rules',
    'https://www.mn.gov/laws-regulations/hemp'
  ] 
},
'MS': { 
   agency: 'https://www.mda.ms.gov/divisions/hemp', 
   agencyName: 'Mississippi Department of Agriculture - Hemp', 
   rssFeeds: [], 
   newsPages: [
    'https://www.mda.ms.gov/news',
    'https://www.legislature.ms.gov',
    'https://www.mda.ms.gov/divisions/hemp/news',
    'https://www.ms.gov/agriculture/hemp',
    'https://agriculture.ms.gov/hemp'
  ], 
   regulationPages: [
    'https://www.mda.ms.gov/hemp-program',
    'https://www.mda.ms.gov/divisions/hemp/regulations',
    'https://www.mda.ms.gov/divisions/hemp/rules',
    'https://www.ms.gov/laws-regulations/hemp'
  ] 
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
  ], 
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
    'https://mt.gov/cannabis/news',
    'https://leg.mt.gov',
    'https://ag.mt.gov/hemp',
    'https://ag.mt.gov/hemp/news',
    'https://www.mt.gov/agriculture/hemp',
    'https://agriculture.mt.gov/hemp'
  ], 
   regulationPages: [
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
    'https://agr.nebraska.gov/news',
    'https://legislature.nebraska.gov',
    'https://nda.nebraska.gov/hemp',
    'https://nda.nebraska.gov/hemp/news',
    'https://www.ne.gov/agriculture/hemp',
    'https://agriculture.ne.gov/hemp'
  ], 
   regulationPages: [
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
    'https://ccb.nv.gov/news-events',
    'https://www.leg.state.nv.us',
    'https://agri.nv.gov/Programs/Industrial_Hemp',
    'https://agri.nv.gov/Programs/Industrial_Hemp/news',
    'https://www.nv.gov/agriculture/hemp',
    'https://agriculture.nv.gov/hemp'
  ], 
   regulationPages: [
    'https://ccb.nv.gov/public-notices',
    'https://agri.nv.gov/Programs/Industrial_Hemp/',
    'https://agri.nv.gov/Programs/Industrial_Hemp/regulations',
    'https://agri.nv.gov/Programs/Industrial_Hemp/rules',
    'https://www.nv.gov/laws-regulations/hemp'
  ] 
},
'NH': {
  agency: 'https://www.dhhs.nh.gov/programs-services/population-health/therapeutic-cannabis',
  agencyName: 'New Hampshire Department of Health and Human Services - Therapeutic Cannabis Program',
  rssFeeds: [],
  newsPages: [
    'https://www.dhhs.nh.gov/news-events/press-releases',
    'https://www.gencourt.state.nh.us',
    'https://www.nh.gov/hemp',
    'https://www.nh.gov/hemp/news',
    'https://www.nh.gov/agriculture/hemp',
    'https://agriculture.nh.gov/hemp'
  ],
  regulationPages: [
    'https://www.dhhs.nh.gov/document/therapeutic-cannabis-program-data-report-2024',
    'https://www.nh.gov/hemp/',
    'https://www.nh.gov/hemp/regulations',
    'https://www.nh.gov/hemp/rules',
    'https://www.nh.gov/laws-regulations/hemp'
  ]
},
'NJ': {
  agency: 'https://www.nj.gov/cannabis/',
  agencyName: 'New Jersey Cannabis Regulatory Commission',
  rssFeeds: [],
  newsPages: [
    'https://www.nj.gov/cannabis/news/',
    'https://www.nj.gov/agriculture/divisions/pi/hemp',
    'https://www.nj.gov/agriculture/divisions/pi/hemp/news',
    'https://www.nj.gov/agriculture/hemp',
    'https://agriculture.nj.gov/hemp'
  ],
  regulationPages: [
    'https://www.nj.gov/cannabis/resources/cannabis-laws/',
    'https://www.nj.gov/agriculture/divisions/pi/hemp/',
    'https://www.nj.gov/agriculture/divisions/pi/hemp/regulations',
    'https://www.nj.gov/agriculture/divisions/pi/hemp/rules',
    'https://www.nj.gov/laws-regulations/hemp'
  ]
},

'NM': {
  agency: 'https://www.rld.nm.gov/cannabis/',
  agencyName: 'New Mexico Regulation & Licensing Department – Cannabis Control Division',
  rssFeeds: [],
  newsPages: [
    'https://www.rld.nm.gov/news/',
    'https://www.nmda.nmsu.edu/hemp',
    'https://www.nmda.nmsu.edu/hemp/news',
    'https://www.nm.gov/agriculture/hemp',
    'https://agriculture.nm.gov/hemp'
  ],
  regulationPages: [
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
    'https://cannabis.ny.gov/pressroom',
    'https://agriculture.ny.gov/hemp',
    'https://agriculture.ny.gov/hemp/news',
    'https://www.ny.gov/agriculture/hemp',
    'https://agriculture.ny.gov/hemp'
  ],
  regulationPages: [
    'https://cannabis.ny.gov/marihuana-regulation-and-taxation-act-mrta',
    'https://agriculture.ny.gov/hemp',
    'https://agriculture.ny.gov/hemp/regulations',
    'https://agriculture.ny.gov/hemp/rules',
    'https://www.ny.gov/laws-regulations/hemp'
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
    'https://agriculture.oh.gov/hemp'
  ],
  regulationPages: [
    'https://cannabis.ohio.gov/rules',
    'https://agri.ohio.gov/divs/plant/seed-hemp',
    'https://agri.ohio.gov/divs/plant/seed-hemp/regulations',
    'https://agri.ohio.gov/divs/plant/seed-hemp/rules',
    'https://www.oh.gov/laws-regulations/hemp'
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
  ],
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
    'https://www.oregon.gov/olcc/Pages/news.aspx',
    'https://www.oregon.gov/ODA/programs/Hemp/Pages/default.aspx',
    'https://www.oregon.gov/ODA/programs/Hemp/Pages/default.aspx/news',
    'https://www.or.gov/agriculture/hemp',
    'https://agriculture.or.gov/hemp'
  ],
  regulationPages: [
    'https://www.oregon.gov/olcc/marijuana/Pages/Recreational-Marijuana-Laws-and-Rules.aspx',
    'https://www.oregon.gov/ODA/programs/Hemp/Pages/default.aspx',
    'https://www.oregon.gov/ODA/programs/Hemp/Pages/default.aspx/regulations',
    'https://www.oregon.gov/ODA/programs/Hemp/Pages/default.aspx/rules',
    'https://www.or.gov/laws-regulations/hemp'
  ]
},

'PA': {
  agency: 'https://www.health.pa.gov/topics/programs/Medical%20Marijuana',
  agencyName: 'Pennsylvania Department of Health – Medical Marijuana Program',
  rssFeeds: [],
  newsPages: [
    'https://www.health.pa.gov/topics/healthcare/Pages/News.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx/news',
    'https://www.pa.gov/agriculture/hemp',
    'https://agriculture.pa.gov/hemp'
  ],
  regulationPages: [
    'https://www.health.pa.gov/topics/programs/Medical%20Marijuana/Pages/Regulations.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx/regulations',
    'https://www.agriculture.pa.gov/Plants_Land_Water/PlantIndustry/hemp/Pages/default.aspx/rules',
    'https://www.pa.gov/laws-regulations/hemp'
  ]
},
'RI': {
  agency: 'https://ccc.ri.gov/',
  agencyName: 'Rhode Island Cannabis Control Commission',
  rssFeeds: [],
  newsPages: [
    'https://ccc.ri.gov/news',
    'https://www.rilegislature.gov',
    'https://www.agriculture.ri.gov/hemp',
    'https://www.agriculture.ri.gov/hemp/news',
    'https://www.ri.gov/agriculture/hemp',
    'https://agriculture.ri.gov/hemp'
  ],
  regulationPages: [
    'https://ccc.ri.gov/regulations',
    'https://www.agriculture.ri.gov/hemp/',
    'https://www.agriculture.ri.gov/hemp/regulations',
    'https://www.agriculture.ri.gov/hemp/rules',
    'https://www.ri.gov/laws-regulations/hemp'
  ]
},
'SC': {
  agency: 'https://agriculture.sc.gov/divisions/consumer-protection/hemp/',
  agencyName: 'South Carolina Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://agriculture.sc.gov/news/',
    'https://www.clemson.edu/cafls/hemp',
    'https://www.clemson.edu/cafls/hemp/news',
    'https://www.sc.gov/agriculture/hemp',
    'https://agriculture.sc.gov/hemp'
  ],
  regulationPages: [
    'https://www.scstatehouse.gov/code/t46c055.php',
    'https://www.clemson.edu/cafls/hemp/',
    'https://www.clemson.edu/cafls/hemp/regulations',
    'https://www.clemson.edu/cafls/hemp/rules',
    'https://www.sc.gov/laws-regulations/hemp'
  ]
},

'SD': {
  agency: 'https://medcannabis.sd.gov/',
  agencyName: 'South Dakota Department of Health – Medical Cannabis Program',
  rssFeeds: [],
  newsPages: [
    'https://medcannabis.sd.gov/Updates/News.aspx',
    'https://sddps.gov/hemp',
    'https://sddps.gov/hemp/news',
    'https://www.sd.gov/agriculture/hemp',
    'https://agriculture.sd.gov/hemp'
  ],
  regulationPages: [
    'https://medcannabis.sd.gov/About/Laws.aspx',
    'https://sdlegislature.gov/Statutes/34-20G',
    'https://sddps.gov/hemp/',
    'https://sddps.gov/hemp/regulations',
    'https://sddps.gov/hemp/rules',
    'https://www.sd.gov/laws-regulations/hemp'
  ]
},

'TN': {
  agency: 'https://www.tn.gov/agriculture/businesses/hemp.html',
  agencyName: 'Tennessee Department of Agriculture – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://www.tn.gov/news',
    'https://wapp.capitol.tn.gov',
    'https://www.tn.gov/agriculture/businesses/hemp.html/news',
    'https://www.tn.gov/agriculture/hemp',
    'https://agriculture.tn.gov/hemp'
  ],
  regulationPages: [
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
    'https://www.dshs.texas.gov/news-alerts',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx/news',
    'https://www.tx.gov/agriculture/hemp',
    'https://agriculture.tx.gov/hemp'
  ],
  regulationPages: [
    'https://www.dshs.texas.gov/consumable-hemp-program',
    'https://texasagriculture.gov/Regulatory-Programs/Hemp',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx/regulations',
    'https://www.texasagriculture.gov/Regulatory-Programs/PlantQuality/Hemp.aspx/rules',
    'https://www.tx.gov/laws-regulations/hemp'
  ]
},

'UT': {
  agency: 'https://medicalcannabis.utah.gov/',
  agencyName: 'Utah Department of Health & Human Services – Medical Cannabis Program',
  rssFeeds: [],
  newsPages: [
    'https://medicalcannabis.utah.gov/news/',
    'https://le.utah.gov',
    'https://ag.utah.gov/hemp',
    'https://ag.utah.gov/hemp/news',
    'https://www.ut.gov/agriculture/hemp',
    'https://agriculture.ut.gov/hemp'
  ],
  regulationPages: [
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
    'https://www.cca.virginia.gov/news',
    'https://www.vdacs.virginia.gov/hemp.shtml',
    'https://www.vdacs.virginia.gov/hemp.shtml/news',
    'https://www.va.gov/agriculture/hemp',
    'https://agriculture.va.gov/hemp'
  ],
  regulationPages: [
    'https://www.cca.virginia.gov/regulations',
    'https://www.vdacs.virginia.gov/hemp.shtml',
    'https://www.vdacs.virginia.gov/hemp.shtml/regulations',
    'https://www.vdacs.virginia.gov/hemp.shtml/rules',
    'https://www.va.gov/laws-regulations/hemp'
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
    'https://agriculture.vt.gov/hemp'
  ],
  regulationPages: [
    'https://ccb.vermont.gov/rules',
    'https://agriculture.vermont.gov/hemp',
    'https://agriculture.vermont.gov/hemp/regulations',
    'https://agriculture.vermont.gov/hemp/rules',
    'https://www.vt.gov/laws-regulations/hemp'
  ]
},

'WA': {
  agency: 'https://lcb.wa.gov/',
  agencyName: 'Washington State Liquor and Cannabis Board',
  rssFeeds: [],
  newsPages: [
    'https://lcb.wa.gov/pressreleases',
    'https://agr.wa.gov/hemp',
    'https://agr.wa.gov/hemp/news',
    'https://www.wa.gov/agriculture/hemp',
    'https://agriculture.wa.gov/hemp'
  ],
  regulationPages: [
    'https://lcb.wa.gov/laws/laws-and-rules',
    'https://agr.wa.gov/hemp/',
    'https://agr.wa.gov/hemp/regulations',
    'https://agr.wa.gov/hemp/rules',
    'https://www.wa.gov/laws-regulations/hemp'
  ]
},

'WI': {
  agency: 'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx',
  agencyName: 'Wisconsin Department of Agriculture, Trade and Consumer Protection – Hemp Program',
  rssFeeds: [],
  newsPages: [
    'https://datcp.wi.gov/Pages/News_Media/News.aspx',
    'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx/news',
    'https://www.wi.gov/agriculture/hemp',
    'https://agriculture.wi.gov/hemp'
  ],
  regulationPages: [
    'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx',
    'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx/regulations',
    'https://datcp.wi.gov/Pages/Programs_Services/Hemp.aspx/rules',
    'https://www.wi.gov/laws-regulations/hemp'
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
  ],
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
    'https://agriculture.wy.gov/news'
  ],
  regulationPages: [
    'https://agriculture.wy.gov/divisions/hemp'
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
        if (/^(home|about|contact|menu|nav|skip|search|login|sign)/i.test(title)) continue;
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // Prefer non-SUPABASE alias used in CI/Dashboard, then the official service role env,
    // then runtime alias `Supabase_API_Public`, and finally the anon key.
    // Order: `SERVICE_ROLE_KEY` -> `SUPABASE_SERVICE_ROLE_KEY` -> `Supabase_API_Public` -> `SUPABASE_ANON_KEY`.
    // Do NOT commit secrets to the repo.
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('Supabase_API_Public') || Deno.env.get('SUPABASE_ANON_KEY');
    const keySource = Deno.env.get('SERVICE_ROLE_KEY')
      ? 'service_role_alias_SERVICE_ROLE_KEY'
      : (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? 'service_role_SUPABASE_SERVICE_ROLE_KEY' : (Deno.env.get('Supabase_API_Public') ? 'alias_Supabase_API_Public' : (Deno.env.get('SUPABASE_ANON_KEY') ? 'anon' : 'none')));

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing SUPABASE_URL or SUPABASE keys. Ensure SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY is set.');
      return new Response(JSON.stringify({ success: false, error: 'Missing SUPABASE_URL or SUPABASE keys. Ensure SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY is set.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If only an anon key is available, fail loudly — anon keys cannot perform writes under RLS.
    if (keySource === 'anon') {
      console.error('Refusing to run poller with anon key: writes will be rejected by RLS. Map a service role secret (SERVICE_ROLE_KEY) in the project.');
      return new Response(JSON.stringify({ success: false, error: 'Server requires a Supabase service role key (SERVICE_ROLE_KEY). Do not use anon key for writes.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      : Object.entries(STATE_CANNABIS_SOURCES);

    const { data: existingItems, error: existingItemsErr } = await supabase
      .from('instrument')
      .select('external_id')
      .in('source', ['state_rss', 'state_news', 'state_regulations']);
    if (existingItemsErr) {
      console.error('existingItems query error:', existingItemsErr);
      errors.push(`existing_items:${existingItemsErr.message}`);
    }

    const existingIds = new Set((existingItems || []).map(i => i.external_id));

    for (const [code, sources] of statesToProcess) {
      console.log(`Processing state: ${code} (${sources.agencyName})`);
      const jurisdiction = jurisdictions?.find(j => j.code === code);
      if (!jurisdiction) {
        console.log(`No jurisdiction found for ${code}, skipping`);
        continue;
      }

      // RSS Feeds
      for (const feedUrl of sources.rssFeeds) {
        try {
          const xml = await fetchWithRetry(feedUrl);
          if (xml) {
            const items = parseRSSFeed(xml, sources.agency);
            for (const item of items) {
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
              await new Promise(r => setTimeout(r, 1000));
            }
          }
        } catch (e: any) {
          errors.push(`${code} RSS ${feedUrl}: ${e.message}`);
        }
      }

      // News Pages
      for (const newsUrl of sources.newsPages) {
        try {
          const html = await fetchWithRetry(newsUrl);
          if (html) {
            const items = parseNewsPage(html, sources.agency);
            for (const item of items) {
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Poller lite error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

